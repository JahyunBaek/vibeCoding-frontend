import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, FileText, MessageSquare, Pencil, Search, X } from "lucide-react";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Can } from "@/components/Can";
import { SCREENS, ACTIONS } from "@/config/permissions";

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

function findMenuName(nodes: any[], boardId: number): string | null {
  for (const n of nodes) {
    if (n.boardId === boardId) return n.name;
    if (n.children?.length) {
      const found = findMenuName(n.children, boardId);
      if (found) return found;
    }
  }
  return null;
}

export default function BoardListPage() {
  const { boardId = "" } = useParams();
  const [sp, setSp] = useSearchParams();
  const page = Number(sp.get("page") || "1");
  const search = sp.get("search") ?? "";
  const [inputValue, setInputValue] = useState(search);
  const inputRef = useRef<HTMLInputElement>(null);

  const qc = useQueryClient();
  const menus: any[] = qc.getQueryData(["menus", "my"]) ?? [];
  const menuName = findMenuName(menus, Number(boardId)) ?? "게시판";

  const { data } = useQuery({
    queryKey: ["posts", boardId, page, search],
    queryFn: () => api.postsList(boardId, page, 10, search || undefined),
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = inputValue.trim();
    setSp(q ? { search: q } : {});
  }

  function clearSearch() {
    setInputValue("");
    setSp({});
    inputRef.current?.focus();
  }

  const items: any[] = data?.items ?? [];
  const total: number = data?.total ?? 0;
  const size: number = data?.size ?? 10;
  const totalPages = Math.max(1, Math.ceil(total / size));

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
          <h1 className="text-xl font-bold text-foreground">{menuName}</h1>
          {total > 0 && (
            <p className="mt-0.5 text-sm text-muted-fg">전체 {total}개</p>
          )}
        </div>
        <Can screen={SCREENS.BOARD_POST} action={ACTIONS.CREATE}>
          <Link to={`/boards/${boardId}/new`}>
            <Button size="sm" className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              글쓰기
            </Button>
          </Link>
        </Can>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="제목으로 검색..."
            className="pl-9 pr-8"
          />
          {inputValue && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-fg hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" variant="outline" size="sm" className="shrink-0">검색</Button>
      </form>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-base bg-surface shadow-sm">

        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-base bg-muted px-5 py-2.5 text-xs font-medium text-muted-fg sm:grid-cols-[auto_1fr_auto_auto]">
          <span className="hidden sm:block w-10 text-center">번호</span>
          <span>제목</span>
          <span className="hidden sm:block">작성자</span>
          <span>날짜</span>
        </div>

        {/* Rows */}
        {items.length > 0 ? (
          <div className="divide-y divide-base">
            {items.map((p: any, idx: number) => {
              const rowNum = total - (page - 1) * size - idx;
              const today = p.createdAt && isToday(p.createdAt);
              return (
                <Link
                  key={p.postId}
                  to={`/boards/${boardId}/posts/${p.postId}`}
                  className="group grid grid-cols-[1fr_auto] gap-4 px-5 py-3.5 transition-colors hover:bg-accent sm:grid-cols-[auto_1fr_auto_auto]"
                >
                  {/* Number */}
                  <span className="hidden sm:flex w-10 items-center justify-center text-xs text-muted-fg">
                    {rowNum}
                  </span>

                  {/* Title */}
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {p.title}
                    </span>
                    {today && (
                      <span className="shrink-0 rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400">
                        NEW
                      </span>
                    )}
                    {(p.commentCount ?? 0) > 0 && (
                      <span className="shrink-0 flex items-center gap-0.5 text-[11px] text-muted-fg">
                        <MessageSquare className="h-3 w-3" />
                        {p.commentCount}
                      </span>
                    )}
                    {(p.fileCount ?? 0) > 0 && (
                      <span className="shrink-0 text-[11px] text-muted-fg" title="첨부파일 있음">
                        📎
                      </span>
                    )}
                  </div>

                  {/* Author */}
                  <div className="hidden sm:flex items-center gap-2">
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${avatarColor(p.authorName ?? "")}`}>
                      {(p.authorName ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-muted-fg">{p.authorName}</span>
                  </div>

                  {/* Date */}
                  <span className="flex items-center text-xs text-muted-fg">
                    {p.createdAt ? formatRelativeTime(p.createdAt) : ""}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-fg">
            <FileText className="h-10 w-10 opacity-30" />
            <p className="text-sm">등록된 게시글이 없습니다.</p>
            <Link to={`/boards/${boardId}/new`}>
              <Button variant="outline" size="sm">첫 글 작성하기</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => setSp(search ? { page: String(page - 1), search } : { page: String(page - 1) })}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-base text-muted-fg transition-colors hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
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
              <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-fg">…</span>
            ) : (
              <button
                key={p}
                onClick={() => setSp(search ? { page: String(p), search } : { page: String(p) })}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  p === page
                    ? "bg-blue-600 text-white"
                    : "border border-base text-muted-fg hover:bg-accent"
                }`}
              >
                {p}
              </button>
            )
          )}

        <button
          disabled={page >= totalPages}
          onClick={() => setSp(search ? { page: String(page + 1), search } : { page: String(page + 1) })}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-base text-muted-fg transition-colors hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
