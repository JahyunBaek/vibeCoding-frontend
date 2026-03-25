import { useState, useRef, useCallback, DragEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RichEditor from "@/components/RichEditor";

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
    PDF: "bg-red-500/20 text-red-400",
    DOC: "bg-blue-500/20 text-blue-400", DOCX: "bg-blue-500/20 text-blue-400",
    XLS: "bg-emerald-500/20 text-emerald-400", XLSX: "bg-emerald-500/20 text-emerald-400",
    PPT: "bg-orange-500/20 text-orange-400", PPTX: "bg-orange-500/20 text-orange-400",
    JPG: "bg-purple-500/20 text-purple-400", JPEG: "bg-purple-500/20 text-purple-400",
    PNG: "bg-purple-500/20 text-purple-400", GIF: "bg-purple-500/20 text-purple-400",
    ZIP: "bg-yellow-500/20 text-yellow-400", RAR: "bg-yellow-500/20 text-yellow-400",
  };
  return map[ext] ?? "bg-accent text-muted-fg";
}

export default function BoardWritePage() {
  const { boardId = "" } = useParams();
  const nav = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [dragging, setDragging] = useState(false);
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

  const submitMut = useMutation({
    mutationFn: async () => {
      setSubmitError(null);

      setFileItems((prev) =>
        prev.map((f) => ({ ...f, status: "staged" as FileStatus, progress: 0, errorMsg: undefined }))
      );

      const uploadedIds: number[] = [];

      try {
        const currentItems = fileItems;
        for (const item of currentItems) {
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
            setFileItems((prev) =>
              prev.map((f) =>
                f.uid === item.uid ? { ...f, status: "error", errorMsg: e.message ?? "업로드 실패" } : f
              )
            );
            throw new Error(`"${item.file.name}" 업로드 실패: ${e.message ?? "알 수 없는 오류"}`);
          }
        }

        try {
          const postId = await api.postCreate(boardId, title, content, uploadedIds, idempotencyKey);
          return postId;
        } catch (e: any) {
          throw new Error(`게시글 저장 실패: ${e.message ?? "알 수 없는 오류"}`);
        }
      } catch (e: any) {
        await Promise.allSettled(uploadedIds.map((id) => api.fileDelete(id)));

        setFileItems((prev) =>
          prev.map((f) =>
            f.fileId && uploadedIds.includes(f.fileId)
              ? { ...f, status: "staged", progress: 0, fileId: undefined }
              : f
          )
        );

        setIdempotencyKey(crypto.randomUUID());
        throw e;
      }
    },
    onSuccess: (postId) => {
      toast.success("게시글이 작성되었습니다.");
      nav(`/boards/${boardId}/posts/${postId}`);
    },
    onError: (e: Error) => {
      setSubmitError(e.message);
      toast.error(e.message ?? "게시글 저장에 실패했습니다.");
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="text-xl font-semibold text-foreground">글 작성</div>

      <Card>
        <CardHeader>
          <CardTitle>새 글</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-fg">제목</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              disabled={submitMut.isPending}
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-fg">내용</label>
            <RichEditor
              value={content}
              onChange={setContent}
              placeholder="내용을 입력하세요. 이미지는 Ctrl+V로 붙여넣을 수 있습니다."
              disabled={submitMut.isPending}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-fg">첨부파일</label>

            {/* Drop Zone */}
            <div
              onClick={() => !submitMut.isPending && inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); if (!submitMut.isPending) setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { if (!submitMut.isPending) handleDrop(e); else e.preventDefault(); }}
              className={`flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-all ${
                submitMut.isPending
                  ? "cursor-not-allowed opacity-50 border-base"
                  : dragging
                  ? "cursor-pointer border-blue-500/50 bg-blue-500/5 scale-[1.01]"
                  : "cursor-pointer border-base hover:border-blue-500/30 hover:bg-accent"
              }`}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${dragging ? "bg-blue-500/20" : "bg-accent"}`}>
                <Upload className={`h-5 w-5 transition-colors ${dragging ? "text-blue-400" : "text-muted-fg"}`} />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">
                  {dragging ? "여기에 놓으세요" : "파일을 드래그하거나 클릭하여 선택"}
                </div>
                <div className="mt-0.5 text-xs text-muted-fg">
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
                      className="flex items-center gap-3 rounded-lg border border-base bg-surface p-3"
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${extColor(ext)}`}>
                        {ext.slice(0, 4)}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium text-foreground">{item.file.name}</span>
                          <span className="shrink-0 text-xs text-muted-fg">{formatSize(item.file.size)}</span>
                        </div>

                        {item.status === "staged" && (
                          <div className="text-xs text-muted-fg">저장 시 업로드됩니다</div>
                        )}

                        {item.status === "uploading" && (
                          <div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent">
                              <div
                                className="h-full rounded-full bg-blue-500 transition-all duration-150"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                            <div className="mt-0.5 text-xs text-muted-fg">{item.progress}% 업로드 중...</div>
                          </div>
                        )}

                        {item.status === "done" && (
                          <div className="flex items-center gap-1 text-xs text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            업로드 완료
                          </div>
                        )}

                        {item.status === "error" && (
                          <div className="flex items-center gap-1.5 text-xs text-red-400">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span className="truncate">{item.errorMsg}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => removeFile(item.uid)}
                        disabled={submitMut.isPending}
                        className="shrink-0 rounded-md p-1.5 text-muted-fg hover:bg-accent hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="제거"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}

                <div className="px-1 text-xs text-muted-fg">
                  총 {fileItems.length}개 파일 · {formatSize(fileItems.reduce((s, f) => s + f.file.size, 0))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <div className="font-medium">저장 실패</div>
                <div className="mt-0.5 text-xs">{submitError} — 업로드된 파일은 자동으로 롤백되었습니다.</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 border-t border-base pt-4">
            <Button
              onClick={() => submitMut.mutate()}
              disabled={submitMut.isPending || !title.trim() || content === "" || content === "<p></p>"}
            >
              {submitMut.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : "저장"}
            </Button>
            <Button variant="outline" onClick={() => nav(-1)} disabled={submitMut.isPending}>
              취소
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
