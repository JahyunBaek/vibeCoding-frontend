import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AlertCircle, Bell, CheckCircle2, KeyRound, User as UserIcon } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function avatarColor(name: string): string {
  const colors = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-orange-500", "bg-rose-500"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function MyInfoPage() {
  const { t } = useTranslation();

  const myInfoSchema = z
    .object({
      name: z.string().min(1, t("myInfo.nameRequired")),
      changePassword: z.boolean(),
      currentPassword: z.string(),
      newPassword: z.string(),
      confirmPassword: z.string(),
    })
    .superRefine((data, ctx) => {
      if (data.changePassword) {
        if (!data.currentPassword) {
          ctx.addIssue({ code: "custom", message: t("myInfo.currentPasswordRequired"), path: ["currentPassword"] });
        }
        if (!data.newPassword) {
          ctx.addIssue({ code: "custom", message: t("myInfo.newPasswordRequired"), path: ["newPassword"] });
        } else if (data.newPassword.length < 8) {
          ctx.addIssue({ code: "custom", message: t("myInfo.newPasswordMinLength"), path: ["newPassword"] });
        } else if (data.newPassword === data.currentPassword) {
          ctx.addIssue({ code: "custom", message: t("myInfo.newPasswordSameAsCurrent"), path: ["newPassword"] });
        }
        if (data.newPassword && data.confirmPassword !== data.newPassword) {
          ctx.addIssue({ code: "custom", message: t("myInfo.newPasswordMismatch"), path: ["confirmPassword"] });
        }
      }
    });
  type MyInfoFormData = z.infer<typeof myInfoSchema>;
  const { data, refetch } = useQuery({ queryKey: ["me"], queryFn: api.me });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MyInfoFormData>({
    resolver: zodResolver(myInfoSchema),
    defaultValues: {
      name: "",
      changePassword: false,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePassword = watch("changePassword");
  const newPassword = watch("newPassword");
  const confirmPassword = watch("confirmPassword");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const saveMut = useMutation({
    mutationFn: (formData: MyInfoFormData) =>
      api.updateMe(
        formData.name || data?.name,
        formData.changePassword ? formData.currentPassword : undefined,
        formData.changePassword ? formData.newPassword : undefined,
      ),
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      toast.success(changePassword ? t("myInfo.passwordChanged") : t("myInfo.profileSaved"));
      reset({
        name: "",
        changePassword: false,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      refetch();
    },
    onError: (e: Error) => {
      setError(e.message ?? t("myInfo.saveFailed"));
      toast.error(e.message ?? t("myInfo.saveFailed"));
    },
  });

  const onSave = handleSubmit((formData) => {
    setError(null);
    setSuccess(false);
    saveMut.mutate(formData);
  });

  const displayName = data?.name ?? "";
  const initials = displayName ? displayName.charAt(0).toUpperCase() : "?";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-xl font-bold text-foreground">{t("myInfo.title")}</h1>

      {/* Profile card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserIcon className="h-4 w-4 text-muted-fg" />
            {t("myInfo.profile")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar + Login ID */}
          <div className="flex items-center gap-4">
            <div
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white ${avatarColor(displayName)}`}
            >
              {initials}
            </div>
            <div>
              <div className="text-xs text-muted-fg">{t("myInfo.loginIdLabel")}</div>
              <div className="mt-0.5 font-mono text-sm font-semibold text-foreground">{data?.username}</div>
              <div className="mt-1 text-xs text-muted-fg">
                {t("myInfo.roleLabel")}: {data?.roleKey}
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-fg">{t("myInfo.nameLabel")}</label>
            <Input
              {...register("name")}
              placeholder={data?.name ?? t("myInfo.namePlaceholder")}
              disabled={saveMut.isPending}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Password card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-muted-fg" />
            {t("myInfo.passwordSection")}
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
                  setValue("changePassword", e.target.checked);
                  if (!e.target.checked) {
                    setValue("currentPassword", "");
                    setValue("newPassword", "");
                    setValue("confirmPassword", "");
                  }
                  setError(null);
                }}
                disabled={saveMut.isPending}
              />
              <div
                className={`h-5 w-9 rounded-full transition-colors ${changePassword ? "bg-slate-800" : "bg-accent"}`}
              />
              <div
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-surface shadow transition-transform ${changePassword ? "translate-x-4" : "translate-x-0.5"}`}
              />
            </div>
            <span className="text-sm font-medium text-foreground">{t("myInfo.passwordChange")}</span>
          </label>

          {changePassword && (
            <div className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-muted p-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-fg">{t("myInfo.currentPassword")}</label>
                <Input
                  type="password"
                  {...register("currentPassword")}
                  placeholder={t("myInfo.currentPasswordPlaceholder")}
                  disabled={saveMut.isPending}
                  autoComplete="current-password"
                />
                {errors.currentPassword && (
                  <p className="text-xs text-red-500 mt-1">{errors.currentPassword.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-fg">{t("auth.newPassword")}</label>
                <Input
                  type="password"
                  {...register("newPassword")}
                  placeholder={t("myInfo.newPasswordPlaceholder")}
                  disabled={saveMut.isPending}
                  autoComplete="new-password"
                />
                {errors.newPassword && <p className="text-xs text-red-500 mt-1">{errors.newPassword.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-fg">{t("auth.confirmPassword")}</label>
                <Input
                  type="password"
                  {...register("confirmPassword")}
                  placeholder={t("myInfo.confirmPasswordPlaceholder")}
                  disabled={saveMut.isPending}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
                )}
                {!errors.confirmPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-400">{t("auth.passwordMismatch")}</p>
                )}
                {!errors.confirmPassword &&
                  confirmPassword &&
                  newPassword === confirmPassword &&
                  newPassword.length >= 8 && (
                    <p className="flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" /> {t("myInfo.passwordMatch")}
                    </p>
                  )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {t("myInfo.saved")}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saveMut.isPending}>
          {saveMut.isPending ? t("common.saving") : t("common.save")}
        </Button>
      </div>

      {/* Notification Preferences */}
      <NotificationPreferencesCard />
    </div>
  );
}

const CHANNEL_LABELS: Record<string, string> = {
  EMAIL: "notification.preferences.email",
  SMS: "notification.preferences.sms",
  KAKAO: "notification.preferences.kakao",
  PUSH: "notification.preferences.push",
};

function NotificationPreferencesCard() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: prefs = [] } = useQuery({
    queryKey: ["notification", "preferences"],
    queryFn: () => api.notificationPreferences(),
  });

  const updateMut = useMutation({
    mutationFn: (data: { channel: string; enabled: boolean; consented: boolean }) =>
      api.notificationPreferenceUpdate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification", "preferences"] });
      toast.success(t("notification.preferences.saved"));
    },
  });

  const toggleConsent = (pref: any) => {
    const newConsented = !pref.consented;
    updateMut.mutate({
      channel: pref.channel,
      enabled: newConsented ? pref.enabled : false,
      consented: newConsented,
    });
  };

  const toggleEnabled = (pref: any) => {
    if (!pref.consented) {
      toast.error(t("notification.preferences.consentDesc"));
      return;
    }
    updateMut.mutate({
      channel: pref.channel,
      enabled: !pref.enabled,
      consented: pref.consented,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4 text-muted-fg" />
          {t("notification.preferences.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {prefs.map((pref: any) => (
            <div key={pref.channel} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{t(CHANNEL_LABELS[pref.channel] ?? pref.channel)}</span>
                {!pref.available && (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    {t("notification.preferences.unavailable")}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={pref.consented}
                    onChange={() => toggleConsent(pref)}
                    disabled={updateMut.isPending}
                  />
                  {t("notification.preferences.consented")}
                </label>
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={pref.enabled}
                    onChange={() => toggleEnabled(pref)}
                    disabled={updateMut.isPending || !pref.consented || !pref.available}
                  />
                  {t("notification.preferences.enabled")}
                </label>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
