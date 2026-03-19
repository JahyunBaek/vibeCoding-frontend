import { useState, useRef, useCallback, DragEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FileStatus = "staged" | "uploading" | "done" | "error";

type FileItem = {
  uid: string;
  file: File;
  status: FileStatus;
  progress: number;
  fileId?: number;
  errorMsg?: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getExt(name: string): string {
  return name.split(".").pop()?.toUpperCase() ?? "FILE";
}

function extColor(ext: string): string {
  const map: Record<string, string> = {
    PDF: "bg-red-100 text-red-600",
    DOC: "bg-blue-100 text-blue-600", DOCX: "bg-blue-100 text-blue-600",
    XLS: "bg-emerald-100 text-emerald-600", XLSX: "bg-emerald-100 text-emerald-600",
    PPT: "bg-orange-100 text-orange-600", PPTX: "bg-orange-100 text-orange-600",
    JPG: "bg-purple-100 text-purple-600", JPEG: "bg-purple-100 text-purple-600",
    PNG: "bg-purple-100 text-purple-600", GIF: "bg-purple-100 text-purple-600",
    ZIP: "bg-yellow-100 text-yellow-600", RAR: "bg-yellow-100 text-yellow-600",
  };
  return map[ext] ?? "bg-slate-100 text-slate-500";
}

export default function BoardWritePage() {
  const { boardId = "" } = useParams();
  const nav = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  const addFiles = useCallback((incoming: File[]) => {
    const items: FileItem[] = incoming.map((file) => ({
      uid: `${Date.now()}-${Math.random()}`,
      file,
      status: "staged",
      progress: 0,
    }));
    setFileItems((prev) => [...prev, ...items]);
  }, []);

  const removeFile = (uid: string) =>
    setFileItems((prev) => prev.filter((f) => f.uid !== uid));

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) addFiles(dropped);
  };

  const onSubmit = async () => {
    setSubmitError(null);
    setSubmitting(true);

    // 모든 파일을 staged로 초기화 (재시도 시)
    setFileItems((prev) =>
      prev.map((f) => ({ ...f, status: "staged" as FileStatus, progress: 0, errorMsg: undefined }))
    );

    const uploadedIds: number[] = [];

    try {
      // 1단계: 파일 순차 업로드
      const currentItems = fileItems; // closure 캡처
      for (const item of currentItems) {
        // 업로드 중 상태로 변경
        setFileItems((prev) =>
          prev.map((f) => f.uid === item.uid ? { ...f, status: "uploading", progress: 0 } : f)
        );

        try {
          const result = await api.fileUploadWithProgress(item.file, (pct) => {
            setFileItems((prev) =>
              prev.map((f) => f.uid === item.uid ? { ...f, progress: pct } : f)
            );
          });

          uploadedIds.push(result.fileId);
          setFileItems((prev) =>
            prev.map((f) =>
              f.uid === item.uid ? { ...f, status: "done", progress: 100, fileId: result.fileId } : f
            )
          );
        } catch (e: any) {
          // 이 파일 업로드 실패 → 롤백
          setFileItems((prev) =>
            prev.map((f) =>
              f.uid === item.uid ? { ...f, status: "error", errorMsg: e.message ?? "업로드 실패" } : f
            )
          );
          throw new Error(`"${item.file.name}" 업로드 실패: ${e.message ?? "알 수 없는 오류"}`);
        }
      }

      // 2단계: 게시글 생성
      try {
        const postId = await api.postCreate(boardId, title, content, uploadedIds, idempotencyKey);
        nav(`/boards/${boardId}/posts/${postId}`);
      } catch (e: any) {
        throw new Error(`게시글 저장 실패: ${e.message ?? "알 수 없는 오류"}`);
      }

    } catch (e: any) {
      // 롤백: 이미 업로드된 파일들 서버에서 삭제
      await Promise.allSettled(uploadedIds.map((id) => api.fileDelete(id)));

      // 롤백된 파일들을 staged 상태로 되돌려 재시도 가능하게
      setFileItems((prev) =>
        prev.map((f) =>
          f.fileId && uploadedIds.includes(f.fileId)
            ? { ...f, status: "staged", progress: 0, fileId: undefined }
            : f
        )
      );

      // 새 UUID 생성 → 재시도 시 중복 차단되지 않도록
      setIdempotencyKey(crypto.randomUUID());
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="text-xl font-semibold">글 작성</div>

      <Card>
        <CardHeader>
          <CardTitle>새 글</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">제목</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              disabled={submitting}
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">내용</label>
            <textarea
              className="min-h-[240px] w-full resize-none rounded-md border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              disabled={submitting}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">첨부파일</label>

            {/* Drop Zone */}
            <div
              onClick={() => !submitting && inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); if (!submitting) setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { if (!submitting) handleDrop(e); else e.preventDefault(); }}
              className={`flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-all ${
                submitting
                  ? "cursor-not-allowed opacity-50 border-slate-200"
                  : dragging
                  ? "cursor-pointer border-slate-700 bg-slate-50 scale-[1.01]"
                  : "cursor-pointer border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
              }`}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${dragging ? "bg-slate-200" : "bg-slate-100"}`}>
                <Upload className={`h-5 w-5 transition-colors ${dragging ? "text-slate-700" : "text-slate-400"}`} />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700">
                  {dragging ? "여기에 놓으세요" : "파일을 드래그하거나 클릭하여 선택"}
                </div>
                <div className="mt-0.5 text-xs text-slate-400">
                  파일은 저장 시 함께 업로드됩니다
                </div>
              </div>
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const selected = Array.from(e.target.files ?? []);
                  if (selected.length) addFiles(selected);
                  e.target.value = "";
                }}
              />
            </div>

            {/* File List */}
            {fileItems.length > 0 && (
              <div className="space-y-2 pt-1">
                {fileItems.map((item) => {
                  const ext = getExt(item.file.name);
                  return (
                    <div
                      key={item.uid}
                      className="flex items-center gap-3 rounded-lg border bg-white p-3 shadow-sm"
                    >
                      {/* Extension badge */}
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${extColor(ext)}`}>
                        {ext.slice(0, 4)}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium text-slate-800">{item.file.name}</span>
                          <span className="shrink-0 text-xs text-slate-400">{formatSize(item.file.size)}</span>
                        </div>

                        {item.status === "staged" && (
                          <div className="text-xs text-slate-400">저장 시 업로드됩니다</div>
                        )}

                        {item.status === "uploading" && (
                          <div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-slate-700 transition-all duration-150"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                            <div className="mt-0.5 text-xs text-slate-400">{item.progress}% 업로드 중...</div>
                          </div>
                        )}

                        {item.status === "done" && (
                          <div className="flex items-center gap-1 text-xs text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" />
                            업로드 완료
                          </div>
                        )}

                        {item.status === "error" && (
                          <div className="flex items-center gap-1.5 text-xs text-red-500">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span className="truncate">{item.errorMsg}</span>
                          </div>
                        )}
                      </div>

                      {/* Remove (업로드 중에는 비활성) */}
                      <button
                        onClick={() => removeFile(item.uid)}
                        disabled={submitting}
                        className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="제거"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}

                <div className="px-1 text-xs text-slate-400">
                  총 {fileItems.length}개 파일 · {formatSize(fileItems.reduce((s, f) => s + f.file.size, 0))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <div className="font-medium">저장 실패</div>
                <div className="mt-0.5 text-xs">{submitError} — 업로드된 파일은 자동으로 롤백되었습니다.</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 border-t pt-4">
            <Button
              onClick={onSubmit}
              disabled={submitting || !title.trim() || !content.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : "저장"}
            </Button>
            <Button variant="outline" onClick={() => nav(-1)} disabled={submitting}>
              취소
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
