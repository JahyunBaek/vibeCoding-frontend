import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, FileText, MessageSquare, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

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

function avatarColor(name: string): string {
  const colors = [
    "bg-blue-500", "bg-emerald-500", "bg-violet-500",
    "bg-orange-500", "bg-rose-500", "bg-cyan-500", "bg-amber-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function BoardListPage() {
  const { boardId = "" } = useParams();
  const [sp, setSp] = useSearchParams();
  const page = Number(sp.get("page") || "1");

  const { data } = useQuery({
    queryKey: ["posts", boardId, page],
    queryFn: () => api.postsList(boardId, page, 10),
  });

  const items: any[] = data?.items ?? [];
  const total: number = data?.total ?? 0;
  const size: number = data?.size ?? 10;
  const totalPages = Math.max(1, Math.ceil(total / size));

  // 오늘 작성된 게시글 여부
  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">게시판</h1>
          {total > 0 && (
            <p className="mt-0.5 text-sm text-slate-400">전체 {total}개</p>
          )}
        </div>
        <Link to={`/boards/${boardId}/new`}>
          <Button size="sm" className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            글쓰기
          </Button>
        </Link>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto] gap-4 border-b bg-slate-50 px-5 py-2.5 text-xs font-medium text-slate-500 sm:grid-cols-[auto_1fr_auto_auto]">
          <span className="hidden sm:block w-10 text-center">번호</span>
          <span>제목</span>
          <span className="hidden sm:block">작성자</span>
          <span>날짜</span>
        </div>

        {/* Rows */}
        {items.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {items.map((p: any, idx: number) => {
              const rowNum = total - (page - 1) * size - idx;
              const today = p.createdAt && isToday(p.createdAt);
              return (
                <Link
                  key={p.postId}
                  to={`/boards/${boardId}/posts/${p.postId}`}
                  className="group grid grid-cols-[1fr_auto] gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50 sm:grid-cols-[auto_1fr_auto_auto]"
                >
                  {/* Number */}
                  <span className="hidden sm:flex w-10 items-center justify-center text-xs text-slate-400">
                    {rowNum}
                  </span>

                  {/* Title */}
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-medium text-slate-700 group-hover:text-slate-900">
                      {p.title}
                    </span>
                    {today && (
                      <span className="shrink-0 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">
                        NEW
                      </span>
                    )}
                    {(p.commentCount ?? 0) > 0 && (
                      <span className="shrink-0 flex items-center gap-0.5 text-[11px] text-slate-400">
                        <MessageSquare className="h-3 w-3" />
                        {p.commentCount}
                      </span>
                    )}
                    {(p.fileCount ?? 0) > 0 && (
                      <span className="shrink-0 text-[11px] text-slate-400" title="첨부파일 있음">
                        📎
                      </span>
                    )}
                  </div>

                  {/* Author */}
                  <div className="hidden sm:flex items-center gap-2">
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${avatarColor(p.authorName ?? "")}`}>
                      {(p.authorName ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-slate-500">{p.authorName}</span>
                  </div>

                  {/* Date */}
                  <span className="flex items-center text-xs text-slate-400">
                    {p.createdAt ? formatRelativeTime(p.createdAt) : ""}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
            <FileText className="h-10 w-10 opacity-30" />
            <p className="text-sm">등록된 게시글이 없습니다.</p>
            <Link to={`/boards/${boardId}/new`}>
              <Button variant="outline" size="sm">첫 글 작성하기</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <button
            disabled={page <= 1}
            onClick={() => setSp({ page: String(page - 1) })}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .reduce<(number | "...")[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="px-1 text-xs text-slate-400">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setSp({ page: String(p) })}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-slate-800 text-white"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}

          <button
            disabled={page >= totalPages}
            onClick={() => setSp({ page: String(page + 1) })}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
