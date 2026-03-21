import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, Lock, User, Dna } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";

export default function LoginPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { setAuth, setPermissions, initialized, accessToken } = useAuthStore();

  useEffect(() => {
    if (!initialized || !accessToken) return;
    const from = (location.state as { from?: string })?.from ?? "/dashboard";
    nav(from, { replace: true });
  }, [initialized, accessToken, nav, location.state]);

  const [username, setUsername] = useState("superadmin");
  const [password, setPassword] = useState("Admin1234!");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api.login(username, password);
      setAuth(data.accessToken, data.user);
      try {
        const perms = await api.permissionsMyList();
        const permMap: Record<string, string[]> = {};
        for (const p of perms) permMap[p.screenKey] = p.actions;
        setPermissions(permMap);
      } catch { /* ignore */ }
      nav("/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">

      {/* ── 배경 그라디언트 & 장식 ─────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0">
        {/* 중앙 빛 */}
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="absolute left-1/3 bottom-0 h-[400px] w-[400px] rounded-full bg-violet-600/10 blur-[100px]" />
        <div className="absolute right-1/4 top-0 h-[300px] w-[300px] rounded-full bg-cyan-500/10 blur-[80px]" />
        {/* 격자 패턴 */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* ── 메인 카드 ────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-[400px]">

        {/* 로고 */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/10">
            <Dna className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-extrabold tracking-tight text-white">BioCore System</h1>
            <p className="mt-0.5 text-xs text-slate-500">Integrated Bio Research Platform</p>
          </div>
        </div>

        {/* 카드 본체 */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-2xl shadow-black/40 backdrop-blur-xl">

          {/* 카드 상단 강조선 */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

          <div className="p-8">

            {/* 헤더 */}
            <div className="mb-6">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                시스템 정상 운영중
              </div>
              <h2 className="text-[22px] font-bold text-white">로그인</h2>
              <p className="mt-1 text-[13px] text-slate-500">계정 정보를 입력해 접속하세요.</p>
            </div>

            {/* 폼 */}
            <form className="space-y-3.5" onSubmit={onSubmit}>

              {/* 아이디 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  아이디
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="아이디"
                    autoComplete="username"
                    disabled={loading}
                    className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.06] pl-9 pr-4 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:border-blue-500/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* 비밀번호 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  비밀번호
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                    className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.06] pl-9 pr-4 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:border-blue-500/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* 에러 */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-400">
                  <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  {error}
                </div>
              )}

              {/* 로그인 버튼 */}
              <button
                type="submit"
                disabled={loading}
                className="group relative mt-1 flex h-11 w-full items-center justify-center overflow-hidden rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 hover:shadow-blue-500/30 active:scale-[0.98] disabled:opacity-60"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 transition-opacity group-hover:opacity-100" />
                {loading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />로그인 중...</>
                  : "로그인 →"
                }
              </button>

              {/* 구분선 */}
              <div className="flex items-center gap-3 py-0.5">
                <div className="flex-1 border-t border-white/[0.06]" />
                <span className="text-[11px] text-slate-600">OR</span>
                <div className="flex-1 border-t border-white/[0.06]" />
              </div>

              {/* 소셜 버튼 */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "Google", mark: "G" },
                  { label: "Kakao",  mark: "K" },
                ].map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    disabled
                    className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] text-[12px] font-medium text-slate-500 transition-all hover:bg-white/[0.07] disabled:opacity-40"
                  >
                    <span className="font-bold text-slate-400">{s.mark}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* 테스트 계정 */}
          <div className="border-t border-white/[0.06] bg-white/[0.02] px-8 py-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              테스트 계정
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { role: "슈퍼관리자", id: "superadmin", pw: "Admin1234!", accent: "violet" },
                { role: "관리자",     id: "admin",      pw: "Admin1234!",  accent: "blue"   },
                { role: "일반",       id: "user",       pw: "User1234!",   accent: "slate"  },
              ].map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => { setUsername(a.id); setPassword(a.pw); }}
                  className={`flex flex-col items-start rounded-lg border px-3 py-2.5 text-left transition-all ${
                    a.accent === "violet"
                      ? "border-violet-500/20 bg-violet-500/[0.06] hover:border-violet-500/40 hover:bg-violet-500/10"
                      : a.accent === "blue"
                      ? "border-white/[0.07] bg-white/[0.04] hover:border-blue-500/30 hover:bg-blue-500/10"
                      : "border-white/[0.07] bg-white/[0.04] hover:border-white/[0.12] hover:bg-white/[0.07]"
                  }`}
                >
                  <span className={`text-[11px] font-semibold ${a.accent === "violet" ? "text-violet-300" : "text-slate-300"}`}>
                    {a.role}
                  </span>
                  <span className="mt-0.5 font-mono text-[10px] text-slate-600">{a.id}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-700">
          © 2026 BioCore System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
