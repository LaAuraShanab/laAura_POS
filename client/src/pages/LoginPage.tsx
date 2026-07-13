import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/label";
import { Sparkline } from "../components/dashboard/Sparkline";
import { ApiError } from "../types/api";

interface LoginFormValues {
  email: string;
  password: string;
}

const PREVIEW_SERIES = [
  { label: "Mon", value: 20 },
  { label: "Tue", value: 35 },
  { label: "Wed", value: 28 },
  { label: "Thu", value: 52 },
  { label: "Fri", value: 46 },
  { label: "Sat", value: 60 },
  { label: "Sun", value: 54 },
];

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>();

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      await login(values.email, values.password);
      navigate("/", { replace: true });
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t("login.genericError"));
    }
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <div className="relative flex w-full flex-col lg:w-1/2">
        <div
          className="pointer-events-none absolute -top-24 -start-24 h-72 w-72 rounded-full bg-gold-soft/25 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center gap-2 p-8 sm:p-12">
          <img src="/logo.png" alt="La Aura" className="h-7 w-7 rounded-full object-cover" />
          <span className="font-serif text-base italic text-forest">La Aura</span>
        </div>

        <div className="relative z-10 flex flex-1 items-center justify-center px-8 pb-16 sm:px-12">
          <div className="w-full max-w-sm">
            <h1 className="mb-1.5 text-3xl font-heading font-medium text-ink">{t("login.signIn")}</h1>
            <p className="mb-8 text-sm text-ink/60">{t("login.subtitle")}</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="login-email" className="sr-only">
                  {t("login.email")}
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder={t("login.email")}
                  autoComplete="username"
                  error={errors.email?.message}
                  {...register("email", { required: t("login.emailRequired") })}
                />
              </div>
              <div>
                <Label htmlFor="login-password" className="sr-only">
                  {t("login.password")}
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder={t("login.password")}
                  autoComplete="current-password"
                  error={errors.password?.message}
                  {...register("password", { required: t("login.passwordRequired") })}
                />
              </div>

              {serverError && <p className="text-sm text-destructive">{serverError}</p>}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t("login.signingIn") : t("login.signInButton")}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/*
        This showcase panel is deliberately theme-independent — always the
        dark espresso brand panel regardless of the app's light/dark toggle,
        like Stripe/Linear-style split login screens. Elements sitting
        directly on it (not inside the theme-following glass-surface-strong
        cards) use fixed literal colors rather than theme tokens, since
        tokens like cream/sage/gold-soft intentionally flip with the app
        theme and would lose contrast here.
      */}
      <div className="relative hidden overflow-hidden bg-forest-deep px-10 lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center">
        <div className="absolute top-8 end-9 h-9 w-9 rounded-lg bg-white/[0.06]" />
        <div className="absolute top-24 end-24 h-4 w-4 rounded-md bg-[#d9c08f]/10" />
        <div className="absolute bottom-12 start-8 h-6 w-6 rounded-md bg-white/[0.08]" />
        <div className="absolute top-36 start-10 h-3 w-3 rounded bg-[#d9c08f]/10" />

        <div className="z-10 flex flex-col items-center">
          <img src="/logo.png" alt="La Aura" className="mb-3.5 h-16 w-16 rounded-full object-cover shadow-raised" />
          <p className="mb-0.5 font-serif text-2xl italic text-white/95">La Aura</p>
          <p className="text-[10.5px] tracking-[0.16em] text-[#d9c08f]">{t("login.coffeeHouse")}</p>
        </div>

        <div className="relative z-10 mt-11 w-full max-w-xs">
          <div className="rounded-3xl glass-surface-strong px-5 pt-5 pb-3 shadow-raised transition-transform duration-300 ease-[var(--ease-standard)] hover:-translate-y-1">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-medium text-ink">{t("login.salesTrend")}</span>
              <span className="text-[9.5px] text-ink/45">{t("login.thisWeek")}</span>
            </div>
            <Sparkline data={PREVIEW_SERIES} height={56} />
            <div className="mt-0.5 flex justify-between text-[9px] text-ink/40">
              <span>{t("login.mon")}</span>
              <span>{t("login.wed")}</span>
              <span>{t("login.fri")}</span>
              <span>{t("login.sun")}</span>
            </div>
          </div>

          <div className="absolute -bottom-5 -end-4 flex h-[118px] w-[118px] flex-col items-center justify-center gap-1 rounded-3xl glass-surface-strong shadow-raised transition-transform duration-300 ease-[var(--ease-standard)] hover:-translate-y-1">
            <svg viewBox="0 0 36 36" className="h-14 w-14">
              <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-sage" strokeWidth={3} />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                className="stroke-gold"
                strokeWidth={3}
                strokeDasharray="68 100"
                strokeLinecap="round"
                transform="rotate(-90 18 18)"
              />
            </svg>
            <p className="-mt-1.5 text-[9px] text-ink/55">{t("login.dailyTarget")}</p>
            <p className="text-sm font-medium text-ink">68%</p>
          </div>
        </div>

        <div className="z-10 mt-14 max-w-xs text-center">
          <p className="mb-2 text-[15px] font-medium text-white/95">{t("login.tagline")}</p>
          <p className="text-xs leading-relaxed text-white/70">{t("login.taglineBody")}</p>
        </div>
      </div>
    </div>
  );
}
