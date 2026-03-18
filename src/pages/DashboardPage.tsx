import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function SparkLine({ points }: { points: number[] }) {
  const w = 280;
  const h = 80;
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const norm = (v: number) => {
    if (max === min) return h / 2;
    return h - ((v - min) / (max - min)) * (h - 10) - 5;
  };

  const step = w / (points.length - 1);
  const d = points
    .map((p, i) => {
      const x = i * step;
      const y = norm(p);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="w-full">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function DashboardPage() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.dashboard
  });

  return (
    <div className="space-y-6">
      <div className="text-2xl font-bold">Dashboard</div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Invite your team members to collaborate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Toby Belhome", email: "contact@bundui.io", role: "Viewer" },
              { name: "Jackson Lee", email: "pre@example.com", role: "Developer" },
              { name: "Hally Gray", email: "hally@site.com", role: "Viewer" }
            ].map((m) => (
              <div key={m.email} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">{m.name}</div>
                  <div className="text-xs text-slate-500">{m.email}</div>
                </div>
                <Badge variant="secondary">{m.role}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">+{data?.subscriptions ?? 0}</div>
            <div className="text-sm text-emerald-600">+{data?.subscriptionsChangePct ?? 0}% from last month</div>
            <div className="mt-4 grid grid-cols-8 items-end gap-2">
              {(data?.subscriptionsBars ?? []).map((v: number, i: number) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-full rounded-md bg-slate-900" style={{ height: Math.max(8, v / 6) }} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${(data?.revenue ?? 0).toLocaleString()}</div>
            <div className="text-sm text-emerald-600">+{data?.revenueChangePct ?? 0}% from last month</div>
            <div className="mt-4 text-slate-900">
              <SparkLine points={(data?.revenueLine ?? []).map((x: number) => Math.round(x))} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Exercise Minutes</CardTitle>
            <CardDescription>Your exercise minutes are ahead of where you normally are.</CardDescription>
          </div>
          <Button variant="outline">Export</Button>
        </CardHeader>
        <CardContent>
          <div className="text-slate-900">
            <SparkLine points={(data?.exerciseSeries?.[0]?.points ?? []).map((x: number) => x)} />
          </div>
          <div className="mt-2 text-xs text-slate-500">
            (차트는 샘플 SVG 입니다. 실제 지표/차트 라이브러리 연결은 확장하세요.)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
