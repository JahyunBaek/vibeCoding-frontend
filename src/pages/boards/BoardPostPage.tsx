import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Download, MessageSquare, Paperclip, Send } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

function formatSize(bytes?: number): string | null {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR");
}

function getInitials(name: string): string {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
}

function avatarColor(name: string): string {
  const colors = [
    "bg-blue-500", "bg-emerald-500", "bg-violet-500",
    "bg-orange-500", "bg-rose-500", "bg-cyan-500", "bg-amber-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function FileAttachment({ f }: { f: any }) {
  const [downloading, setDownloading] = useState(false);
  const ext = getExt(f.originalName);
  const size = formatSize(f.sizeBytes);

  const handleDownload = async () => {
    setDownloading(true);
    try { await api.fileDownload(f.fileId, f.originalName); }
    finally { setDownloading(false); }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="group flex w-full items-center gap-3 rounded-lg border bg-white p-3 text-left shadow-sm transition-all hover:border-slate-300 hover:shadow-md disabled:opacity-60"
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${extColor(ext)}`}>
        {ext.slice(0, 4)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-slate-800 group-hover:text-slate-900">{f.originalName}</div>
        {size && <div className="mt-0.5 text-xs text-slate-400">{size}</div>}
      </div>
      <div className={`shrink-0 rounded-md p-1.5 transition-colors ${downloading ? "text-slate-300" : "text-slate-300 group-hover:bg-slate-100 group-hover:text-slate-600"}`}>
        <Download className="h-4 w-4" />
      </div>
    </button>
  );
}

function CommentItem({ c }: { c: any }) {
  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColor(c.authorName ?? "")}`}>
        {getInitials(c.authorName ?? "")}
      </div>

      {/* Bubble */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-slate-800">{c.authorName}</span>
          <span className="text-xs text-slate-400">{formatRelativeTime(c.createdAt)}</span>
        </div>
        <div className="mt-1 rounded-2xl rounded-tl-sm bg-slate-50 px-4 py-2.5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-100">
          {c.content}
        </div>
      </div>
    </div>
  );
}

export default function BoardPostPage() {
  const { boardId = "", postId = "" } = useParams();
  const nav = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data, refetch } = useQuery({
    queryKey: ["post", boardId, postId],
    queryFn: () => api.postDetail(boardId, postId),
  });

  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => api.commentsList(postId),
  });

  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!data) return;
    setTitle(data.title ?? "");
    setContent(data.content ?? "");
  }, [data]);

  const onSave = async () => {
    await api.postUpdate(boardId, postId, title, content, (data?.files ?? []).map((f: any) => f.fileId));
    setEdit(false);
    await refetch();
  };

  const onDelete = async () => {
    if (!confirm("삭제하시겠습니까?")) return;
    await api.postDelete(boardId, postId);
    nav(`/boards/${boardId}`);
  };

  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const onAddComment = async () => {
    if (!comment.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      await api.commentCreate(postId, comment.trim());
      setComment("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      await refetchComments();
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onAddComment();
    }
  };

  // 텍스트 입력에 따라 textarea 높이 자동 조절
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const files: any[] = data?.files ?? [];
  const commentList: any[] = comments ?? [];

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <Link to={`/boards/${boardId}`} className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
          ← 목록으로
        </Link>
        <div className="flex gap-2">
          {!edit ? (
            <Button variant="outline" size="sm" onClick={() => setEdit(true)}>편집</Button>
          ) : (
            <>
              <Button size="sm" onClick={onSave}>저장</Button>
              <Button variant="outline" size="sm" onClick={() => setEdit(false)}>취소</Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={onDelete} className="text-red-500 hover:text-red-600 hover:border-red-300">삭제</Button>
        </div>
      </div>

      {/* Post */}
      <Card>
        <CardHeader>
          <CardTitle>
            {edit
              ? <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-base font-semibold" />
              : <span>{data?.title}</span>
            }
          </CardTitle>
          {data?.authorName && (
            <div className="flex items-center gap-2 pt-1">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColor(data.authorName)}`}>
                {getInitials(data.authorName)}
              </div>
              <span className="text-sm text-slate-600">{data.authorName}</span>
              {data?.createdAt && (
                <span className="text-xs text-slate-400">{formatRelativeTime(data.createdAt)}</span>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-t pt-4">
            {edit ? (
              <textarea
                className="min-h-[220px] w-full resize-none rounded-md border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{data?.content}</div>
            )}
          </div>

          {/* Attachments */}
          {files.length > 0 && (
            <div className="border-t pt-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Paperclip className="h-3.5 w-3.5" />
                첨부파일 {files.length}개
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {files.map((f: any) => <FileAttachment key={f.fileId} f={f} />)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-slate-500" />
            <CardTitle className="text-base">
              댓글
              {commentList.length > 0 && (
                <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {commentList.length}
                </span>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Comment list */}
          {commentList.length > 0 ? (
            <div className="space-y-4">
              {commentList.map((c: any) => (
                <CommentItem key={c.commentId} c={c} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
              <MessageSquare className="h-8 w-8 opacity-30" />
              <span className="text-sm">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</span>
            </div>
          )}

          {/* Divider */}
          {commentList.length > 0 && <div className="border-t" />}

          {/* Comment input */}
          <div className="flex gap-3">
            <div className="shrink-0 h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-semibold">
              나
            </div>
            <div className="flex-1 min-w-0">
              <div className="relative rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-slate-400 focus-within:bg-white transition-colors">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={comment}
                  onChange={handleCommentChange}
                  onKeyDown={handleCommentKeyDown}
                  placeholder="댓글을 입력하세요... (Ctrl+Enter로 등록)"
                  disabled={submittingComment}
                  className="w-full resize-none bg-transparent px-4 py-2.5 pr-12 text-sm text-slate-700 placeholder:text-slate-400 outline-none disabled:opacity-60 max-h-40 overflow-y-auto"
                />
                <button
                  onClick={onAddComment}
                  disabled={!comment.trim() || submittingComment}
                  className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-white transition-all hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-1 text-right text-[11px] text-slate-400">Ctrl+Enter로 등록</div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
