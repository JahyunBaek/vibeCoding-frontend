import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Lock, User, Dna, CheckCircle2, Mail, UserCircle } from "lucide-react";
import { api } from "@/lib/api";

export default function SignupPage() {
  const { t } = useTranslation();

  const signupSchema = z.object({
    username: z.string().min(3, t("auth.usernameMinLength")),
    password: z.string().min(8, t("auth.passwordMinLength")),
    confirmPassword: z.string().min(1, t("auth.confirmPasswordRequired")),
    name: z.string().min(1, t("auth.nameRequired")),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t("auth.passwordMismatch"),
    path: ["confirmPassword"],
  });
  type SignupFormData = z.infer<typeof signupSchema>;
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const token = searchParams.get("token") ?? "";

  // Invitation validation
  const [validating, setValidating] = useState(true);
  const [invitationEmail, setInvitationEmail] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [invalidToken, setInvalidToken] = useState(false);

  // Form
  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { username: "", password: "", confirmPassword: "", name: "" },
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setInvalidToken(true);
      setValidating(false);
      return;
    }
    (async () => {
      try {
        const data = await api.invitationValidate(token);
        setInvitationEmail(data.email);
        setTenantName(data.tenantName);
      } catch {
        setInvalidToken(true);
      } finally {
        setValidating(false);
      }
    })();
  }, [token]);

  const onSubmit = handleSubmit(async (data) => {
    setError(null);
    setLoading(true);
    try {
      await api.signup(token, data.username, data.password, data.name);
      setSuccess(true);
      toast.success(t("auth.signupSuccess"));
    } catch (err: any) {
      const msg = err?.message ?? t("auth.signupFailed");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  });

  const inputClass =
    "h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.06] pl-9 pr-4 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:border-blue-500/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50";

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

            {validating ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                <p className="text-sm text-slate-500">{t("auth.validatingInvite")}</p>
              </div>
            ) : invalidToken ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 ring-4 ring-red-500/20">
                  <span className="text-2xl text-red-400">!</span>
                </div>
                <div className="text-center">
                  <h2 className="text-lg font-bold text-white">{t("auth.invalidInviteTitle")}</h2>
                  <p className="mt-1.5 text-[13px] text-slate-500">
                    {t("auth.invalidInviteDesc")}
                  </p>
                </div>
                <Link
                  to="/login"
                  className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 hover:shadow-blue-500/30 active:scale-[0.98]"
                >
                  {t("auth.goToLogin")}
                </Link>
              </div>
            ) : success ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-4 ring-emerald-500/20">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
                <div className="text-center">
                  <h2 className="text-lg font-bold text-white">{t("auth.signupComplete")}</h2>
                  <p className="mt-1.5 text-[13px] text-slate-500">
                    {t("auth.signupCompleteDesc")}
                  </p>
                </div>
                <Link
                  to="/login"
                  className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 hover:shadow-blue-500/30 active:scale-[0.98]"
                >
                  {t("auth.goToLogin")}
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-[22px] font-bold text-white">{t("auth.signup")}</h2>
                  <p className="mt-1 text-[13px] text-slate-500">{t("auth.signupDescription")}</p>
                  {tenantName && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-medium text-blue-400">
                      {tenantName}
                    </div>
                  )}
                </div>

                <form className="space-y-3.5" onSubmit={onSubmit}>

                  {/* Email (read-only) */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {t("auth.email")}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                      <input
                        value={invitationEmail}
                        readOnly
                        disabled
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Username */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {t("auth.username")}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                      <input
                        {...register("username")}
                        placeholder={t("auth.usernamePlaceholder")}
                        autoComplete="username"
                        disabled={loading}
                        className={inputClass}
                      />
                    </div>
                    {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {t("auth.password")}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                      <input
                        type="password"
                        {...register("password")}
                        placeholder={t("auth.passwordPlaceholder")}
                        autoComplete="new-password"
                        disabled={loading}
                        className={inputClass}
                      />
                    </div>
                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {t("auth.confirmPassword")}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                      <input
                        type="password"
                        {...register("confirmPassword")}
                        placeholder={t("auth.confirmPasswordPlaceholder")}
                        autoComplete="new-password"
                        disabled={loading}
                        className={inputClass}
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
                  </div>

                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {t("auth.name")}
                    </label>
                    <div className="relative">
                      <UserCircle className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
                      <input
                        {...register("name")}
                        placeholder={t("auth.namePlaceholder")}
                        disabled={loading}
                        className={inputClass}
                      />
                    </div>
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
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
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("auth.processing")}</>
                      : t("auth.signupArrow")
                    }
                  </button>
                </form>

                {/* Link to login */}
                <div className="mt-5 text-center">
                  <Link to="/login" className="text-[13px] text-slate-500 transition-colors hover:text-blue-400">
                    {t("auth.backToLogin")}
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
