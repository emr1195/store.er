"use client";

import { FormEvent, useRef, useState } from "react";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type AuthMode = "signin" | "signup";
type PendingMethod = "email" | "google" | null;

type AuthActionsProps = {
  redirectUrl: string;
  googleEnabled: boolean;
};

const GoogleIcon = () => (
  <svg aria-hidden="true" className="h-5 w-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function AuthActions({ redirectUrl, googleEnabled }: AuthActionsProps) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState<PendingMethod>(null);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef(false);

  const start = (method: Exclude<PendingMethod, null>) => {
    if (pendingRef.current) return false;
    setError(null);
    if (!navigator.onLine) {
      setError("No hay conexión a internet. Verifica tu red e intenta nuevamente.");
      return false;
    }
    pendingRef.current = true;
    setPending(method);
    return true;
  };

  const finish = () => {
    pendingRef.current = false;
    setPending(null);
  };

  const handleEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!start("email")) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();

    try {
      const result = mode === "signup"
        ? await authClient.signUp.email({ name, email, password, callbackURL: redirectUrl })
        : await authClient.signIn.email({ email, password, callbackURL: redirectUrl });
      if (result.error) {
        setError(readableAuthError(result.error.code));
        finish();
        return;
      }
      window.location.assign(redirectUrl);
    } catch {
      setError("No pudimos completar el acceso. Intenta nuevamente.");
      finish();
    }
  };

  const handleGoogle = async () => {
    if (!googleEnabled || !start("google")) return;
    try {
      const result = await authClient.signIn.social({ provider: "google", callbackURL: redirectUrl });
      if (result.error) {
        setError("No pudimos iniciar el acceso con Google. Intenta nuevamente.");
        finish();
      }
    } catch {
      setError("No pudimos comunicarnos con Google. Intenta nuevamente.");
      finish();
    }
  };

  const switchMode = (nextMode: AuthMode) => {
    if (pendingRef.current) return;
    setMode(nextMode);
    setShowEmailForm(true);
    setError(null);
  };

  const isBusy = pending !== null;

  return (
    <div>
      {error ? <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium leading-5 text-red-800">{error}</div> : null}

      {!showEmailForm ? (
        <button type="button" onClick={() => setShowEmailForm(true)} disabled={isBusy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2">
          <Mail aria-hidden="true" className="h-5 w-5" /> Continuar con correo
        </button>
      ) : (
        <form onSubmit={handleEmail} className="space-y-4 text-left">
          {mode === "signup" ? <label className="block text-sm font-bold text-brand-navy">Nombre<input name="name" autoComplete="name" required minLength={2} className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-300 px-4 font-normal outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100" /></label> : null}
          <label className="block text-sm font-bold text-brand-navy">Correo electrónico<input name="email" type="email" autoComplete="email" required className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-300 px-4 font-normal outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100" /></label>
          <label className="block text-sm font-bold text-brand-navy">Contraseña<span className="relative mt-1.5 block"><input name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={8} className="min-h-12 w-full rounded-xl border border-slate-300 px-4 pr-12 font-normal outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue">{showPassword ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}</button></span></label>
          <button type="submit" disabled={isBusy} aria-busy={pending === "email"} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2">
            {pending === "email" ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin motion-reduce:animate-none" /> : <Mail aria-hidden="true" className="h-5 w-5" />}
            {pending === "email" ? "Procesando…" : mode === "signup" ? "Crear cuenta con correo" : "Ingresar con correo"}
          </button>
        </form>
      )}

      {googleEnabled ? <><div className="my-5 flex items-center gap-3" aria-label="Otras opciones de acceso"><span aria-hidden="true" className="h-px flex-1 bg-slate-200" /><span className="shrink-0 text-xs font-semibold text-slate-500">o continúa con</span><span aria-hidden="true" className="h-px flex-1 bg-slate-200" /></div><button type="button" onClick={handleGoogle} disabled={isBusy} aria-busy={pending === "google"} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-brand-navy shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2">{pending === "google" ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin motion-reduce:animate-none" /> : <GoogleIcon />}{pending === "google" ? "Abriendo acceso…" : "Continuar con Google"}</button></> : null}

      <p className="mt-6 text-sm leading-6 text-slate-600">{mode === "signin" ? "¿Aún no tienes una cuenta?" : "¿Ya tienes una cuenta?"}{" "}<button type="button" onClick={() => switchMode(mode === "signin" ? "signup" : "signin")} disabled={isBusy} className="min-h-11 rounded-lg px-1 font-bold text-brand-blue underline decoration-blue-200 underline-offset-4 hover:text-blue-800 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue">{mode === "signin" ? "Crear cuenta" : "Iniciar sesión"}</button></p>
      {pending ? <p role="status" aria-live="polite" className="sr-only">Procesando el acceso seguro.</p> : null}
    </div>
  );
}

function readableAuthError(code: string | undefined): string {
  if (code === "INVALID_EMAIL_OR_PASSWORD") return "El correo o la contraseña no son correctos.";
  if (code === "USER_ALREADY_EXISTS" || code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") return "Ya existe una cuenta con este correo. Inicia sesión o usa Google.";
  if (code === "PASSWORD_TOO_SHORT") return "La contraseña debe tener al menos 8 caracteres.";
  return "No pudimos completar el acceso. Revisa los datos e intenta nuevamente.";
}
