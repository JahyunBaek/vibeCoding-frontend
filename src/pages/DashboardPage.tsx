import {
  LineChart, Line,
  BarChart, Bar,
  AreaChart, Area,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart,
  ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  Heart, Activity, FlaskConical, Users, TrendingUp, TrendingDown,
  Microscope, Dna, Pill, AlertTriangle, CheckCircle2, Clock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ─── 팔레트 ──────────────────────────────────────────────────────
const C = {
  blue:    "#3b82f6",
  emerald: "#10b981",
  violet:  "#8b5cf6",
  orange:  "#f59e0b",
  rose:    "#f43f5e",
  cyan:    "#06b6d4",
  slate:   "#64748b",
  lime:    "#84cc16",
};

// ─── 목업 데이터 ──────────────────────────────────────────────────

const vitalTrend = [
  { month: "Jan", heartRate: 72, systolic: 118, diastolic: 76 },
  { month: "Feb", heartRate: 75, systolic: 121, diastolic: 78 },
  { month: "Mar", heartRate: 70, systolic: 115, diastolic: 74 },
  { month: "Apr", heartRate: 68, systolic: 112, diastolic: 72 },
  { month: "May", heartRate: 73, systolic: 119, diastolic: 77 },
  { month: "Jun", heartRate: 76, systolic: 122, diastolic: 79 },
  { month: "Jul", heartRate: 74, systolic: 120, diastolic: 76 },
  { month: "Aug", heartRate: 71, systolic: 116, diastolic: 75 },
  { month: "Sep", heartRate: 69, systolic: 114, diastolic: 73 },
  { month: "Oct", heartRate: 72, systolic: 118, diastolic: 76 },
  { month: "Nov", heartRate: 70, systolic: 117, diastolic: 75 },
  { month: "Dec", heartRate: 67, systolic: 113, diastolic: 72 },
];

const admissionBar = [
  { dept: "내과",  q1: 120, q2: 135, q3: 142, q4: 128 },
  { dept: "외과",  q1:  85, q2:  92, q3:  88, q4:  95 },
  { dept: "신경과", q1:  63, q2:  71, q3:  68, q4:  74 },
  { dept: "심장내과", q1: 94, q2: 101, q3:  97, q4: 108 },
  { dept: "종양내과", q1: 47, q2:  52, q3:  55, q4:  61 },
  { dept: "소화기내과", q1: 78, q2: 83, q3: 80, q4: 87 },
];

const enzymeTrend = [
  { week: "W1",  ALT: 32, AST: 28, ALP: 72, GGT: 18 },
  { week: "W2",  ALT: 38, AST: 31, ALP: 75, GGT: 21 },
  { week: "W3",  ALT: 45, AST: 37, ALP: 80, GGT: 25 },
  { week: "W4",  ALT: 41, AST: 34, ALP: 77, GGT: 23 },
  { week: "W5",  ALT: 52, AST: 42, ALP: 88, GGT: 30 },
  { week: "W6",  ALT: 49, AST: 40, ALP: 85, GGT: 28 },
  { week: "W7",  ALT: 43, AST: 35, ALP: 79, GGT: 24 },
  { week: "W8",  ALT: 36, AST: 30, ALP: 73, GGT: 20 },
];

const conditionPie = [
  { name: "정상",     value: 412, color: C.emerald },
  { name: "경계",     value: 187, color: C.orange  },
  { name: "주의요망",  value:  98, color: C.rose    },
  { name: "치료중",   value: 143, color: C.blue     },
  { name: "관찰",     value:  62, color: C.violet   },
];

const healthRadar = [
  { metric: "심폐기능",  A: 82, B: 68 },
  { metric: "대사기능",  A: 74, B: 71 },
  { metric: "간기능",    A: 91, B: 55 },
  { metric: "신장기능",  A: 78, B: 82 },
  { metric: "면역기능",  A: 65, B: 77 },
  { metric: "골밀도",    A: 60, B: 85 },
];

const bmiScatter = [
  { age: 25, bmi: 22.1, group: "A" }, { age: 28, bmi: 24.3, group: "A" },
  { age: 32, bmi: 26.8, group: "B" }, { age: 35, bmi: 27.2, group: "B" },
  { age: 38, bmi: 28.5, group: "B" }, { age: 40, bmi: 25.1, group: "A" },
  { age: 43, bmi: 29.7, group: "C" }, { age: 46, bmi: 30.2, group: "C" },
  { age: 50, bmi: 27.9, group: "B" }, { age: 53, bmi: 31.4, group: "C" },
  { age: 56, bmi: 24.6, group: "A" }, { age: 60, bmi: 28.8, group: "B" },
  { age: 63, bmi: 26.3, group: "A" }, { age: 67, bmi: 32.1, group: "C" },
  { age: 70, bmi: 23.9, group: "A" }, { age: 74, bmi: 29.5, group: "B" },
];

const trialProgress = [
  { phase: "Phase I",   enrolled: 42,  target: 50,  completed: 38 },
  { phase: "Phase II",  enrolled: 210, target: 250, completed: 185 },
  { phase: "Phase III", enrolled: 680, target: 800, completed: 420 },
];

const labResults = [
  { name: "WBC",   value: 6.8,  unit: "×10³/μL", ref: "4.0–10.0",  status: "normal"  },
  { name: "RBC",   value: 4.52, unit: "×10⁶/μL", ref: "4.0–5.5",   status: "normal"  },
  { name: "HGB",   value: 13.1, unit: "g/dL",    ref: "12.0–16.0",  status: "normal"  },
  { name: "PLT",   value: 148,  unit: "×10³/μL", ref: "150–400",    status: "caution" },
  { name: "CRP",   value: 2.4,  unit: "mg/L",    ref: "< 1.0",      status: "high"    },
  { name: "HbA1c", value: 6.1,  unit: "%",       ref: "< 5.7",      status: "high"    },
  { name: "LDL",   value: 118,  unit: "mg/dL",   ref: "< 130",      status: "normal"  },
  { name: "Creat", value: 0.92, unit: "mg/dL",   ref: "0.6–1.2",    status: "normal"  },
];

const recentTrials = [
  { id: "BIO-2024-01", name: "면역항암제 병용요법", phase: "Phase III", status: "진행중",  enrolled: 680, target: 800 },
  { id: "BIO-2024-02", name: "유전자 치료 프로토콜", phase: "Phase II",  status: "진행중",  enrolled: 210, target: 250 },
  { id: "BIO-2024-03", name: "단클론항체 안전성 평가", phase: "Phase I",  status: "모집완료", enrolled:  50, target:  50 },
  { id: "BIO-2024-04", name: "세포치료제 효능 검증",   phase: "Phase II",  status: "중단",    enrolled:  88, target: 200 },
];

// ─── KPI 카드 ─────────────────────────────────────────────────────

const kpiCards = [
  { label: "총 환자 수",    value: "2,847", change: "+12.4%", up: true,  icon: Users,        color: "bg-blue-50 text-blue-600"    },
  { label: "활성 임상시험", value: "14",    change: "+2",     up: true,  icon: FlaskConical, color: "bg-violet-50 text-violet-600" },
  { label: "평균 심박수",   value: "71 bpm",change: "-1.4%",  up: false, icon: Heart,        color: "bg-rose-50 text-rose-600"    },
  { label: "치료 성공률",   value: "87.3%", change: "+3.1%",  up: true,  icon: Microscope,   color: "bg-emerald-50 text-emerald-600" },
];

// ─── 커스텀 Tooltip ───────────────────────────────────────────────

function BioTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-surface p-3 shadow-md text-xs">
      <div className="font-semibold text-foreground mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-fg">{p.name}:</span>
          <span className="font-medium text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">바이오 통합 대시보드</h1>
        <p className="mt-0.5 text-sm text-muted-fg">임상·연구 데이터 종합 현황 — 예제 데이터</p>
      </div>

      {/* ── KPI 카드 4개 ──────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-fg">{k.label}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{k.value}</p>
                  <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${k.up ? "text-emerald-600" : "text-rose-500"}`}>
                    {k.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {k.change} 전월 대비
                  </div>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${k.color}`}>
                  <k.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Row 2: 활력징후 라인 + 부서별 입원 바 ──────────────────── */}
      <div className="grid gap-4 xl:grid-cols-5">

        {/* 활력징후 12개월 추이 (Line Chart) */}
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" />
              활력징후 12개월 추이
            </CardTitle>
            <CardDescription>심박수 · 수축기/이완기 혈압 (mmHg / bpm)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={vitalTrend} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[60, 140]} tick={{ fontSize: 11 }} />
                <Tooltip content={<BioTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="heartRate"  name="심박수"    stroke={C.rose}    strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="systolic"   name="수축기혈압" stroke={C.blue}    strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="diastolic"  name="이완기혈압" stroke={C.cyan}    strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 부서별 분기 입원 (Bar Chart) */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              부서별 분기 입원
            </CardTitle>
            <CardDescription>Q1–Q4 환자 수</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={admissionBar} layout="vertical" margin={{ top: 4, right: 16, left: 16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="dept" tick={{ fontSize: 10 }} width={52} />
                <Tooltip content={<BioTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="q1" name="Q1" fill={C.blue}    radius={[0,2,2,0]} />
                <Bar dataKey="q2" name="Q2" fill={C.cyan}    radius={[0,2,2,0]} />
                <Bar dataKey="q3" name="Q3" fill={C.violet}  radius={[0,2,2,0]} />
                <Bar dataKey="q4" name="Q4" fill={C.emerald} radius={[0,2,2,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3: 효소 영역 차트 + 도넛 + 레이더 ───────────────────── */}
      <div className="grid gap-4 xl:grid-cols-3">

        {/* 간 효소 수치 추이 (Area Chart) */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dna className="h-4 w-4 text-violet-500" />
              간 효소 수치 추이
            </CardTitle>
            <CardDescription>ALT · AST · ALP · GGT (U/L)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={enzymeTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  {[
                    { id: "alt",  color: C.rose    },
                    { id: "ast",  color: C.orange  },
                    { id: "alp",  color: C.blue    },
                    { id: "ggt",  color: C.emerald },
                  ].map(({ id, color }) => (
                    <linearGradient key={id} id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<BioTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="ALT" stroke={C.rose}    fill="url(#grad-alt)" strokeWidth={2} />
                <Area type="monotone" dataKey="AST" stroke={C.orange}  fill="url(#grad-ast)" strokeWidth={2} />
                <Area type="monotone" dataKey="ALP" stroke={C.blue}    fill="url(#grad-alp)" strokeWidth={2} />
                <Area type="monotone" dataKey="GGT" stroke={C.emerald} fill="url(#grad-ggt)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 환자 상태 분포 (Donut) */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-500" />
              환자 상태 분포
            </CardTitle>
            <CardDescription>전체 등록 환자 {conditionPie.reduce((s, d) => s + d.value, 0).toLocaleString()}명</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={180}>
                <PieChart>
                  <Pie
                    data={conditionPie}
                    cx="50%" cy="50%"
                    innerRadius={48} outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {conditionPie.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}명`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {conditionPie.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
                      <span className="text-muted-fg">{d.name}</span>
                    </div>
                    <span className="font-medium text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 건강 지표 레이더 */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-500" />
              건강 지표 비교
            </CardTitle>
            <CardDescription>그룹 A(치료군) vs 그룹 B(대조군)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={healthRadar} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="치료군" dataKey="A" stroke={C.blue}    fill={C.blue}    fillOpacity={0.25} strokeWidth={2} />
                <Radar name="대조군" dataKey="B" stroke={C.orange}  fill={C.orange}  fillOpacity={0.2}  strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: BMI 산점도 + 임상시험 Composed ───────────────────── */}
      <div className="grid gap-4 xl:grid-cols-2">

        {/* BMI vs 연령 산점도 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-4 w-4 text-orange-500" />
              BMI × 연령 분포
            </CardTitle>
            <CardDescription>그룹별 체질량지수 산포도 (A: 정상 / B: 경계 / C: 비만)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" dataKey="age" name="연령" unit="세" tick={{ fontSize: 11 }} domain={[20, 80]} />
                <YAxis type="number" dataKey="bmi" name="BMI"  tick={{ fontSize: 11 }} domain={[18, 36]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Scatter name="정상(A)" data={bmiScatter.filter(d => d.group === "A")} fill={C.emerald} />
                <Scatter name="경계(B)" data={bmiScatter.filter(d => d.group === "B")} fill={C.orange}  />
                <Scatter name="비만(C)" data={bmiScatter.filter(d => d.group === "C")} fill={C.rose}    />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 임상시험 단계별 현황 (Composed) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-violet-500" />
              임상시험 단계별 현황
            </CardTitle>
            <CardDescription>목표 대비 등록·완료 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={trialProgress} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="phase" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<BioTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="target"    name="목표"   fill="#e2e8f0"   radius={[4,4,0,0]} />
                <Bar dataKey="enrolled"  name="등록"   fill={C.blue}    radius={[4,4,0,0]} />
                <Line type="monotone" dataKey="completed" name="완료" stroke={C.emerald} strokeWidth={2.5} dot={{ r: 5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 5: 검사 결과 카드 + 임상시험 목록 ───────────────────── */}
      <div className="grid gap-4 xl:grid-cols-5">

        {/* 혈액 검사 결과 */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Microscope className="h-4 w-4 text-blue-500" />
              혈액 검사 결과
            </CardTitle>
            <CardDescription>최근 검사일 기준 — 참고치 외 항목 표시</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {labResults.map((r) => {
                const statusMap = {
                  normal:  { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle2,  label: "정상" },
                  caution: { bg: "bg-amber-50",   text: "text-amber-700",   icon: Clock,         label: "경계" },
                  high:    { bg: "bg-rose-50",    text: "text-rose-700",    icon: AlertTriangle, label: "주의" },
                } as const;
                const statusStyle = statusMap[r.status as keyof typeof statusMap];

                return (
                  <div key={r.name} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-12 shrink-0 text-xs font-semibold text-foreground">{r.name}</span>
                      <span className="text-sm font-bold text-foreground">{r.value}</span>
                      <span className="text-xs text-muted-fg">{r.unit}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="hidden sm:block text-xs text-muted-fg">{r.ref}</span>
                      <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                        <statusStyle.icon className="h-3 w-3" />
                        {statusStyle.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 진행 중 임상시험 */}
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-violet-500" />
              임상시험 현황
            </CardTitle>
            <CardDescription>등록 진행률 및 상태</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTrials.map((t) => {
                const pct = Math.round((t.enrolled / t.target) * 100);
                const statusBadge = {
                  "진행중":  "bg-blue-100 text-blue-700",
                  "모집완료": "bg-emerald-100 text-emerald-700",
                  "중단":    "bg-rose-100 text-rose-700",
                }[t.status] ?? "bg-accent text-foreground";

                return (
                  <div key={t.id} className="space-y-1.5 rounded-xl border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-foreground">{t.name}</div>
                        <div className="text-xs text-muted-fg">{t.id} · {t.phase}</div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusBadge}`}>
                        {t.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-accent">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${pct}%`, background: pct >= 100 ? C.emerald : t.status === "중단" ? C.rose : C.blue }}
                        />
                      </div>
                      <span className="shrink-0 text-xs font-medium text-muted-fg">
                        {t.enrolled.toLocaleString()} / {t.target.toLocaleString()} ({pct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
