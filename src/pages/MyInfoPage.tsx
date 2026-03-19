import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AlertCircle, CheckCircle2, KeyRound, User as UserIcon } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function avatarColor(name: string): string {
  const colors = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-orange-500", "bg-rose-500"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function MyInfoPage() {
  const { data, refetch } = useQuery({ queryKey: ["me"], queryFn: api.me });

  const [name, setName] = useState("");
  const [changePassword, setChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 클라이언트 검증
  const validate = (): string | null => {
    if (!(name || data?.name).trim()) return "이름을 입력해주세요.";
    if (changePassword) {
      if (!currentPassword) return "현재 비밀번호를 입력해주세요.";
      if (!newPassword) return "새 비밀번호를 입력해주세요.";
      if (newPassword.length < 8) return "새 비밀번호는 8자 이상이어야 합니다.";
      if (newPassword === currentPassword) return "새 비밀번호가 현재 비밀번호와 동일합니다.";
      if (newPassword !== confirmPassword) return "새 비밀번호가 일치하지 않습니다.";
    }
    return null;
  };

  const onSave = async () => {
    setError(null);
    setSuccess(false);
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSaving(true);
    try {
      await api.updateMe(
        name || data?.name,
        changePassword ? currentPassword : undefined,
        changePassword ? newPassword : undefined,
      );
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setChangePassword(false);
      await refetch();
    } catch (e: any) {
      setError(e.message ?? "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const displayName = data?.name ?? "";
  const initials = displayName ? displayName.charAt(0).toUpperCase() : "?";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-xl font-bold text-slate-800">내 정보</h1>

      {/* Profile card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserIcon className="h-4 w-4 text-slate-500" />
            프로필
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Avatar + Login ID */}
          <div className="flex items-center gap-4">
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white ${avatarColor(displayName)}`}>
              {initials}
            </div>
            <div>
              <div className="text-xs text-slate-400">Login ID</div>
              <div className="mt-0.5 font-mono text-sm font-semibold text-slate-700">{data?.username}</div>
              <div className="mt-1 text-xs text-slate-400">Role: {data?.roleKey}</div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">이름</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={data?.name ?? "이름 입력"}
              disabled={saving}
            />
          </div>

        </CardContent>
      </Card>

      {/* Password card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-slate-500" />
            비밀번호
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Toggle */}
          <label className="flex cursor-pointer items-center gap-3">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={changePassword}
                onChange={(e) => {
                  setChangePassword(e.target.checked);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setError(null);
                }}
                disabled={saving}
              />
              <div className={`h-5 w-9 rounded-full transition-colors ${changePassword ? "bg-slate-800" : "bg-slate-200"}`} />
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${changePassword ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
            <span className="text-sm font-medium text-slate-700">비밀번호 변경</span>
          </label>

          {changePassword && (
            <div className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">현재 비밀번호</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="현재 비밀번호 입력"
                  disabled={saving}
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">새 비밀번호</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="8자 이상"
                  disabled={saving}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">새 비밀번호 확인</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="새 비밀번호 재입력"
                  disabled={saving}
                  autoComplete="new-password"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
                )}
                {confirmPassword && newPassword === confirmPassword && newPassword.length >= 8 && (
                  <p className="flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" /> 비밀번호가 일치합니다.
                  </p>
                )}
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Feedback */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          저장되었습니다.
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
}
