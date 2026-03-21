import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Plus, X, ChevronLeft, ChevronRight, Copy, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TenantListRow } from "@/types/tenant";

const PAGE_SIZE = 10;

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-1 border-t px-4 py-3">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="flex h-7 w-7 items-center justify-center rounded border text-muted-fg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
        .reduce<(number | "...")[]>((acc, p, i, arr) => {
          if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
          acc.push(p);
          return acc;
        }, [])
        .map((p, i) =>
          p === "..." ? (
            <span key={`e-${i}`} className="px-1 text-xs text-muted-fg">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className={`flex h-7 w-7 items-center justify-center rounded text-xs font-medium transition-colors ${p === page ? "bg-blue-600 text-white" : "border text-muted-fg hover:bg-muted"}`}
            >
              {p}
            </button>
          )
        )}
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="flex h-7 w-7 items-center justify-center rounded border text-muted-fg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function SuperAdminTenantsPage() {
  const { data, refetch } = useQuery({
    queryKey: ["super-admin", "tenants"],
    queryFn: () => api.superAdminTenants(1, 200),
  });

  const [page, setPage] = useState(1);
  const allItems: TenantListRow[] = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE));
  const paged = allItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // --- Create ---
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newName, setNewName] = useState("");
  const [newPlan, setNewPlan] = useState("FREE");
  const [newAdminUser, setNewAdminUser] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("Admin1234!");
  const [createdCreds, setCreatedCreds] = useState<{ tenantId: number; adminUsername: string; adminPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const onCreate = async () => {
    const result = await api.superAdminTenantCreate({
      tenantKey: newKey, tenantName: newName, planType: newPlan,
      adminUsername: newAdminUser, adminPassword: newAdminPass,
    });
    setNewKey(""); setNewName(""); setNewPlan("FREE"); setNewAdminUser(""); setNewAdminPass("Admin1234!");
    setShowCreate(false);
    setCreatedCreds(result);
    await refetch();
  };

  const copyCredsToClipboard = () => {
    if (!createdCreds) return;
    navigator.clipboard.writeText(`ID: ${createdCreds.adminUsername}\nPW: ${createdCreds.adminPassword}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Edit ---
  const [editTenant, setEditTenant] = useState<TenantListRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editPlan, setEditPlan] = useState("");
  const [editActive, setEditActive] = useState(true);

  const startEdit = (t: TenantListRow) => {
    setEditTenant(t);
    setEditName(t.tenantName);
    setEditPlan(t.planType);
    setEditActive(t.active);
    setShowCreate(false);
  };

  const onSave = async () => {
    if (!editTenant) return;
    await api.superAdminTenantUpdate(editTenant.tenantId, { tenantName: editName, planType: editPlan, active: editActive });
    setEditTenant(null);
    await refetch();
  };

  const onDelete = async (t: TenantListRow) => {
    if (!confirm(`"${t.tenantName}" 테넌트를 삭제할까요? 모든 데이터가 삭제됩니다.`)) return;
    await api.superAdminTenantDelete(t.tenantId);
    await refetch();
  };

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">Super Admin · Tenants</div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>테넌트 목록</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-fg">{allItems.length}개</span>
            <Button
              variant="outline"
              onClick={() => { setShowCreate((v) => !v); setEditTenant(null); }}
            >
              {showCreate ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
              {showCreate ? "닫기" : "새 테넌트 추가"}
            </Button>
          </div>
        </CardHeader>

        {/* 생성 완료 자격증명 배너 */}
        {createdCreds && (
          <div className="mx-6 mb-4 rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                테넌트 생성 완료 — 초기 관리자 계정 정보를 저장하세요
              </div>
              <button onClick={() => setCreatedCreds(null)} className="text-muted-fg hover:text-foreground text-xs">닫기</button>
            </div>
            <div className="rounded-md bg-surface border px-4 py-3 font-mono text-sm space-y-1">
              <div><span className="text-muted-fg text-xs">Login ID</span><br /><span className="font-semibold">{createdCreds.adminUsername}</span></div>
              <div><span className="text-muted-fg text-xs">Password</span><br /><span className="font-semibold">{createdCreds.adminPassword}</span></div>
            </div>
            <Button variant="outline" className="h-7 text-xs gap-1.5" onClick={copyCredsToClipboard}>
              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "복사됨" : "클립보드 복사"}
            </Button>
          </div>
        )}

        {/* Create Form */}
        {showCreate && (
          <div className="mx-6 mb-4 rounded-lg border border-dashed border-slate-300 bg-muted p-4 space-y-3">
            <div className="text-xs font-medium text-muted-fg uppercase tracking-wide">새 테넌트</div>
            <div className="flex gap-2 flex-wrap">
              <Input className="w-36" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="테넌트 키 (영문)" />
              <Input className="w-48" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="테넌트 이름" />
              <Input className="w-28" value={newPlan} onChange={(e) => setNewPlan(e.target.value)} placeholder="플랜 (FREE/PRO)" />
            </div>
            <div className="flex gap-2 flex-wrap items-end">
              <div className="space-y-1">
                <div className="text-xs text-muted-fg">초기 관리자 ID</div>
                <Input className="w-40" value={newAdminUser} onChange={(e) => setNewAdminUser(e.target.value)} placeholder="admin" />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-fg">초기 관리자 비밀번호</div>
                <Input className="w-40" value={newAdminPass} onChange={(e) => setNewAdminPass(e.target.value)} placeholder="Admin1234!" />
              </div>
              <Button onClick={onCreate} disabled={!newKey.trim() || !newName.trim() || !newAdminUser.trim() || !newAdminPass.trim()}>추가</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>취소</Button>
            </div>
            <div className="text-xs text-muted-fg">테넌트 생성 시 메뉴, 게시판, 공통코드, 역할 권한, 초기 관리자 계정이 자동으로 초기화됩니다.</div>
          </div>
        )}

        {/* Edit Panel */}
        {editTenant && (
          <div className="mx-6 mb-4 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 space-y-3">
            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              편집 중 — {editTenant.tenantName} <span className="text-blue-400">(Key: {editTenant.tenantKey})</span>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <Input className="w-48" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="테넌트 이름" />
              <Input className="w-28" value={editPlan} onChange={(e) => setEditPlan(e.target.value)} placeholder="플랜" />
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="h-4 w-4"
                />
                활성
              </label>
              <Button onClick={onSave} disabled={!editName.trim()}>저장</Button>
              <Button variant="outline" onClick={() => setEditTenant(null)}>취소</Button>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted text-xs text-muted-fg">
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">키</th>
                <th className="px-4 py-3 text-left font-medium">이름</th>
                <th className="px-4 py-3 text-left font-medium">플랜</th>
                <th className="px-4 py-3 text-left font-medium">상태</th>
                <th className="px-4 py-3 text-left font-medium">사용자</th>
                <th className="px-4 py-3 text-left font-medium">생성일</th>
                <th className="px-4 py-3 text-right font-medium">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map((t) => (
                <tr
                  key={t.tenantId}
                  className={`hover:bg-muted/60 transition-colors ${editTenant?.tenantId === t.tenantId ? "bg-blue-500/5" : ""}`}
                >
                  <td className="px-4 py-3 text-xs text-muted-fg font-mono">{t.tenantId}</td>
                  <td className="px-4 py-3 font-mono text-xs">{t.tenantKey}</td>
                  <td className="px-4 py-3 font-medium">{t.tenantName}</td>
                  <td className="px-4 py-3 text-xs">{t.planType}</td>
                  <td className="px-4 py-3">
                    <Badge variant={t.active ? "default" : "secondary"}>
                      {t.active ? "활성" : "비활성"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-fg">{t.userCount}명</td>
                  <td className="px-4 py-3 text-xs text-muted-fg">{t.createdAt?.slice(0, 10) ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-7 w-7 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEdit(t)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />편집
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                          onClick={() => onDelete(t)}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-fg">
                    테넌트가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
