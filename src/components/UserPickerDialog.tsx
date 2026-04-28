import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, X, User, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 30;

export type UserPickerResult = {
  userId: number;
  name: string;
  username: string;
  orgId?: number | null;
  orgName?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (user: UserPickerResult) => void;
  selectedUserId?: number | null;
  defaultOrgId?: number | null;
};

/**
 * 사용자 선택 팝업 (서버 검색 + 무한 스크롤).
 * - 키워드 입력은 300ms debounce
 * - 스크롤 끝 도달 시 IntersectionObserver로 다음 페이지 자동 fetch
 */
export default function UserPickerDialog({ open, onClose, onSelect, selectedUserId, defaultOrgId }: Props) {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [orgId, setOrgId] = useState<number | null>(defaultOrgId ?? null);
  const sentinelRef = useRef<HTMLLIElement>(null);

  // 키워드 debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  // 부서 트리
  const { data: orgs = [] } = useQuery({
    queryKey: ["orgs", "directory"],
    queryFn: () => api.orgsDirectoryTree(),
    enabled: open,
  });
  const orgOptions = useMemo(() => flattenOrgs(orgs), [orgs]);

  // 무한 스크롤 사용자 검색
  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["users", "picker", debouncedKeyword, orgId],
    queryFn: ({ pageParam = 1 }) =>
      api.usersDirectory({
        keyword: debouncedKeyword || undefined,
        orgId: orgId ?? undefined,
        page: pageParam as number,
        size: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.size;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
    enabled: open,
  });

  const users = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

  // 무한 스크롤 sentinel 감지
  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "100px" },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, users.length]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg bg-background shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            {t("userPicker.title")}
            {total > 0 && <span className="text-xs font-normal text-muted-fg">({total})</span>}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search bar */}
        <div className="px-4 py-3 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-fg" />
            <Input
              autoFocus
              className="h-9 pl-8"
              placeholder={t("userPicker.searchPlaceholder")}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            {isFetching && !isFetchingNextPage && (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-fg" />
            )}
          </div>
          <select
            className="h-8 w-full rounded-md border bg-surface px-2 text-xs"
            value={orgId ?? ""}
            onChange={(e) => setOrgId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{t("userPicker.allDepts")}</option>
            {orgOptions.map((o) => (
              <option key={o.orgId} value={o.orgId}>
                {"—".repeat(o.depth)} {o.name}
              </option>
            ))}
          </select>
        </div>

        {/* User list with infinite scroll */}
        <div className="max-h-[50vh] overflow-y-auto px-2 py-2">
          {users.length === 0 && !isFetching ? (
            <div className="py-8 text-center text-sm text-muted-fg">{t("userPicker.noResults")}</div>
          ) : (
            <ul className="divide-y">
              {users.map((u) => (
                <li key={u.userId}>
                  <button
                    onClick={() => {
                      onSelect(u);
                      onClose();
                    }}
                    className={`w-full text-left rounded-md px-3 py-2 hover:bg-muted transition-colors ${
                      u.userId === selectedUserId ? "bg-primary/10 ring-1 ring-primary/20" : ""
                    }`}
                  >
                    <div className="text-sm font-medium">{u.name}</div>
                    <div className="text-xs text-muted-fg">
                      {u.username}
                      {u.orgName && ` · ${u.orgName}`}
                      {u.roleKey && ` · ${u.roleKey}`}
                    </div>
                  </button>
                </li>
              ))}
              {/* 무한 스크롤 sentinel */}
              {hasNextPage && (
                <li ref={sentinelRef} className="flex justify-center py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-fg" />
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-2.5 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            {t("common.cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function flattenOrgs(tree: any[], depth = 0): { orgId: number; name: string; depth: number }[] {
  const out: { orgId: number; name: string; depth: number }[] = [];
  for (const node of tree ?? []) {
    out.push({ orgId: node.orgId, name: node.name, depth });
    if (node.children?.length) out.push(...flattenOrgs(node.children, depth + 1));
  }
  return out;
}
