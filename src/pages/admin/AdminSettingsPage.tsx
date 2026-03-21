import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Save, Sliders } from "lucide-react";
import TenantSelector from "@/components/TenantSelector";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CONFIG_META: { key: string; label: string; placeholder: string; type?: string }[] = [
  { key: "company_name", label: "회사/서비스 이름",   placeholder: "My Company" },
  { key: "logo_url",     label: "로고 이미지 URL",   placeholder: "https://..." },
  { key: "timezone",     label: "시간대 (Timezone)", placeholder: "Asia/Seoul" },
  { key: "locale",       label: "언어/지역 (Locale)", placeholder: "ko" },
];

export default function AdminSettingsPage() {
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);

  const { data, refetch } = useQuery({
    queryKey: ["admin", "settings", selectedTenantId],
    queryFn: () => api.settingsGet(selectedTenantId),
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 서버 데이터 → form 동기화
  useEffect(() => {
    if (!data) return;
    const map: Record<string, string> = {};
    data.forEach((c) => { map[c.configKey] = c.configValue ?? ""; });
    setForm(map);
    setSuccess(false);
  }, [data]);

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await api.settingsSave(form, selectedTenantId);
      setSuccess(true);
      await refetch();
    } catch (e: any) {
      setError(e.message ?? "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">Admin · Settings</div>
        <TenantSelector value={selectedTenantId} onChange={(id) => { setSelectedTenantId(id); setSuccess(false); }} />
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sliders className="h-4 w-4 text-muted-fg" />
            테넌트 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {CONFIG_META.map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-fg">{label}</label>
              <Input
                value={form[key] ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={placeholder}
                disabled={saving}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
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

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving} className="gap-1.5">
          <Save className="h-4 w-4" />
          {saving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
}
