import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Lock, Dna, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("유효하지 않은 링크입니다. 토큰이 없습니다.");
      return;
    }
    if (newPassword.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(token, newPassword);
      setSuccess(true);
      toast.success("비밀번호가 성공적으로 변경되었습니다.");
    } catch (err: any) {
      const msg = err?.message ?? "비밀번호 재설정에 실패했습니다.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">

      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="absolute left-1/3 bottom-0 h-[400px] w-[400px] rounded-full bg-violet-600/10 blur-[100px]" />
        <div className="absolute right-1/4 top-0 h-[300px] w-[300px] rounded-full bg-cyan-500/10 blur-[80px]" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-[400px]">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/10">
            <Dna className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-extrabold tracking-tight text-white">BioCore System</h1>
            <p className="mt-0.5 text-xs text-slate-500">Integrated Bio Research Platform</p>
          </div>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

          <div className="p-8">

            {success ? (
              /* Success state */
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-4 ring-emerald-500/20">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
                <div className="text-center">
                  <h2 className="text-lg font-bold text-white">비밀번호 변경 완료</h2>
                  <p className="mt-1.5 text-[13px] text-slate-500">
                    새 비밀번호로 로그인하세요.
                  </p>
                </div>
                <Link
                  to="/login"
                  className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 hover:shadow-blue-500/30 active:scale-[0.98]"
                >
                  로그인 페이지로 이동 →
                </Link>
              </div>
            ) : (
              /* Form state */
              <>
                <div className="mb-6">
                  <h2 className="text-[22px] font-bold text-white">비밀번호 재설정</h2>
                  <p className="mt-1 text-[13px] text-slate-500">새로운 비밀번호를 입력해 주세요.</p>
                </div>

                <form className="space-y-3.5" onSubmit={onSubmit}>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      새 비밀번호
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        disabled={loading}
                        className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.06] pl-9 pr-4 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:border-blue-500/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      비밀번호 확인
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        disabled={loading}
                        className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.06] pl-9 pr-4 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:border-blue-500/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-400">
                      <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative mt-1 flex h-11 w-full items-center justify-center overflow-hidden rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 hover:shadow-blue-500/30 active:scale-[0.98] disabled:opacity-60"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 transition-opacity group-hover:opacity-100" />
                    {loading
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />처리 중...</>
                      : "비밀번호 변경 →"
                    }
                  </button>
                </form>

                {/* Link to login */}
                <div className="mt-5 text-center">
                  <Link to="/login" className="text-[13px] text-slate-500 transition-colors hover:text-blue-400">
                    ← 로그인 페이지로 돌아가기
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-700">
          © 2026 BioCore System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
