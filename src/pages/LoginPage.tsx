import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";

export default function LoginPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { setAuth, initialized, accessToken } = useAuthStore();

  // 새로고침 등으로 refresh가 성공해 이미 로그인된 상태면 대시보드(또는 이전 목적지)로 이동
  useEffect(() => {
    console.log(initialized, accessToken);
    if (!initialized || !accessToken) return;
    const from = (location.state as { from?: string })?.from ?? "/dashboard";
    nav(from, { replace: true });
  }, [initialized, accessToken, nav, location.state]);

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin1234!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api.login(username, password);
      setAuth(data.accessToken, data.user);
      nav("/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <div className="text-xl font-semibold">Sign in</div>
        <div className="mt-1 text-sm text-slate-500">JWT + Refresh Cookie (Rotation)</div>

        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <div>
            <div className="text-xs font-medium text-slate-600 mb-1">Username</div>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-600 mb-1">Password</div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <Button className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" className="flex-1" disabled>
              Google (준비)
            </Button>
            <Button type="button" variant="outline" className="flex-1" disabled>
              Kakao (준비)
            </Button>
          </div>
        </form>

        <div className="mt-4 text-xs text-slate-500">
          기본 계정: <span className="font-mono">admin/Admin1234!</span>, <span className="font-mono">user/User1234!</span>
        </div>
      </div>
    </div>
  );
}
