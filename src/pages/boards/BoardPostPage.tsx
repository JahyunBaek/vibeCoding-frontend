import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { useAuthStore } from "@/stores/auth";
import { useAction } from "@/hooks/useAction";
import { SCREENS, ACTIONS } from "@/config/permissions";
import { Download, MessageSquare, Paperclip, Send } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RichEditor from "@/components/RichEditor";

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
      className="group flex w-full items-center gap-3 rounded-lg border border-base bg-surface p-3 text-left transition-all hover:border-blue-500/40 hover:bg-accent disabled:opacity-60"
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${extColor(ext)}`}>
        {ext.slice(0, 4)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{f.originalName}</div>
        {size && <div className="mt-0.5 text-xs text-muted-fg">{size}</div>}
      </div>
      <div className={`shrink-0 rounded-md p-1.5 transition-colors ${downloading ? "opacity-30" : "text-muted-fg group-hover:bg-accent group-hover:text-foreground"}`}>
        <Download className="h-4 w-4" />
      </div>
    </button>
  );
}

function CommentItem({ c }: { c: any }) {
  return (
    <div className="flex gap-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColor(c.authorName ?? "")}`}>
        {getInitials(c.authorName ?? "")}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">{c.authorName}</span>
          <span className="text-xs text-muted-fg">{formatRelativeTime(c.createdAt)}</span>
        </div>
        <div className="mt-1 rounded-2xl rounded-tl-sm bg-accent px-4 py-2.5 text-sm text-foreground leading-relaxed whitespace-pre-wrap border border-base">
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

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const { user } = useAuthStore();
  const isAdmin = user?.roleKey === "ADMIN";
  const isAuthor = !!user && !!data && user.userId === data.authorId;
  const hasEditPerm = useAction(SCREENS.BOARD_POST, ACTIONS.EDIT);
  const hasDeletePerm = useAction(SCREENS.BOARD_POST, ACTIONS.DELETE);
  const canEdit = hasEditPerm && (isAdmin || isAuthor);
  const canDelete = hasDeletePerm && (isAdmin || isAuthor);

  const files: any[] = data?.files ?? [];
  const commentList: any[] = comments ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <Link to={`/boards/${boardId}`} className="text-sm text-muted-fg hover:text-foreground transition-colors">
          ← 목록으로
        </Link>
        {(canEdit || canDelete) && (
          <div className="flex gap-2">
            {canEdit && (
              !edit ? (
                <Button variant="outline" size="sm" onClick={() => setEdit(true)}>편집</Button>
              ) : (
                <>
                  <Button size="sm" onClick={onSave}>저장</Button>
                  <Button variant="outline" size="sm" onClick={() => setEdit(false)}>취소</Button>
                </>
              )
            )}
            {canDelete && (
              <Button variant="outline" size="sm" onClick={onDelete} className="text-red-400 hover:text-red-300 hover:border-red-500/40">삭제</Button>
            )}
          </div>
        )}
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
              <span className="text-sm text-muted-fg">{data.authorName}</span>
              {data?.createdAt && (
                <span className="text-xs text-muted-fg">{formatRelativeTime(data.createdAt)}</span>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-t border-base pt-4">
            {edit ? (
              <RichEditor value={content} onChange={setContent} />
            ) : (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(data?.content ?? "", {
                    ALLOWED_TAGS: [
                      "p","br","strong","em","u","s","strike",
                      "h2","h3","ul","ol","li","blockquote","pre","code",
                      "a","img","hr","span","div",
                    ],
                    ALLOWED_ATTR: ["href","src","alt","width","height","class","style","rel","target"],
                    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|\/images):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
                  }),
                }}
              />
            )}
          </div>

          {/* Attachments */}
          {files.length > 0 && (
            <div className="border-t border-base pt-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-fg">
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
            <MessageSquare className="h-4 w-4 text-muted-fg" />
            <CardTitle className="text-base">
              댓글
              {commentList.length > 0 && (
                <span className="ml-1.5 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-muted-fg">
                  {commentList.length}
                </span>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">

          {commentList.length > 0 ? (
            <div className="space-y-4">
              {commentList.map((c: any) => (
                <CommentItem key={c.commentId} c={c} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-fg">
              <MessageSquare className="h-8 w-8 opacity-30" />
              <span className="text-sm">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</span>
            </div>
          )}

          {commentList.length > 0 && <div className="border-t border-base" />}

          {/* Comment input */}
          <div className="flex gap-3">
            <div className="shrink-0 h-9 w-9 rounded-full bg-accent flex items-center justify-center text-muted-fg text-xs font-semibold">
              나
            </div>
            <div className="flex-1 min-w-0">
              <div className="relative rounded-2xl border border-base bg-accent focus-within:border-blue-500/50 focus-within:bg-surface transition-colors">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={comment}
                  onChange={handleCommentChange}
                  onKeyDown={handleCommentKeyDown}
                  placeholder="댓글을 입력하세요... (Ctrl+Enter로 등록)"
                  disabled={submittingComment}
                  className="w-full resize-none bg-transparent px-4 py-2.5 pr-12 text-sm text-foreground placeholder:text-muted-fg outline-none disabled:opacity-60 max-h-40 overflow-y-auto"
                />
                <button
                  onClick={onAddComment}
                  disabled={!comment.trim() || submittingComment}
                  className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white transition-all hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-1 text-right text-[11px] text-muted-fg">Ctrl+Enter로 등록</div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
