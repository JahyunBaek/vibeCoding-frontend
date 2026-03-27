import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Save, Sliders } from "lucide-react";
import TenantSelector from "@/components/TenantSelector";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);

  const LOCALE_OPTIONS = [
    { value: "ko", label: "한국어 (Korean)" },
    { value: "en", label: "English" },
  ];

  const CONFIG_META: { key: string; label: string; placeholder: string; type?: string }[] = [
    { key: "company_name", label: t("admin.settingsCompanyName"), placeholder: "My Company" },
    { key: "logo_url",     label: t("admin.settingsLogoUrl"),     placeholder: "https://..." },
    { key: "timezone",     label: t("admin.settingsTimezone"),    placeholder: "Asia/Seoul" },
    { key: "locale",       label: t("admin.settingsLocale"),      placeholder: "ko", type: "locale" },
  ];

  const { data, refetch } = useQuery({
    queryKey: ["admin", "settings", selectedTenantId],
    queryFn: () => api.settingsGet(selectedTenantId),
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    const map: Record<string, string> = {};
    data.forEach((c) => { map[c.configKey] = c.configValue ?? ""; });
    setForm(map);
    setSuccess(false);
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () => api.settingsSave(form, selectedTenantId),
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      refetch();
      toast.success(t("admin.settingsSaved"));
    },
    onError: (e: Error) => {
      setError(e.message ?? t("common.saveFailed"));
      toast.error(e.message ?? t("common.saveFailed"));
    },
    onMutate: () => {
      setError(null);
      setSuccess(false);
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">{t("admin.settingsPageTitle")}</div>
        <TenantSelector value={selectedTenantId} onChange={(id) => { setSelectedTenantId(id); setSuccess(false); }} />
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sliders className="h-4 w-4 text-muted-fg" />
            {t("admin.tenantSettings")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {CONFIG_META.map(({ key, label, placeholder, type }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-fg">{label}</label>
              {type === "locale" ? (
                <select
                  className="h-9 w-full rounded-md border bg-surface px-3 text-sm"
                  value={form[key] ?? "ko"}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  disabled={saveMut.isPending}
                >
                  {LOCALE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <Input
                  value={form[key] ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  disabled={saveMut.isPending}
                />
              )}
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
          {t("admin.settingsSaved")}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="gap-1.5">
          <Save className="h-4 w-4" />
          {saveMut.isPending ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </div>
  );
}
