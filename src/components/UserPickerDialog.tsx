import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Search, X, User } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  /** 선택된 사용자 ID — 미리 강조 표시용 */
  selectedUserId?: number | null;
  /** 부서 필터 (선택) */
  defaultOrgId?: number | null;
};

/**
 * 사용자 선택 팝업.
 * 결재선, 멘션 등에서 사용자 검색 후 선택할 때 사용한다.
 */
export default function UserPickerDialog({ open, onClose, onSelect, selectedUserId, defaultOrgId }: Props) {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState("");
  const [orgId, setOrgId] = useState<number | null>(defaultOrgId ?? null);

  const { data: users = [] } = useQuery({
    queryKey: ["users", "picker", orgId],
    queryFn: () => api.usersDirectory(orgId ?? undefined, 200),
    enabled: open,
  });

  const { data: orgs = [] } = useQuery({
    queryKey: ["orgs", "directory"],
    queryFn: () => api.orgsDirectoryTree(),
    enabled: open,
  });

  const orgOptions = useMemo(() => flattenOrgs(orgs), [orgs]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u: any) => u.name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q));
  }, [users, keyword]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg bg-background shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            {t("userPicker.title")}
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

        {/* User list */}
        <div className="max-h-[50vh] overflow-y-auto px-2 py-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-fg">{t("userPicker.noResults")}</div>
          ) : (
            <ul className="divide-y">
              {filtered.map((u: any) => (
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
