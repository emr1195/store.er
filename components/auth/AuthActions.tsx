"use client";

import { useEffect, useRef, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { Loader2, Mail } from "lucide-react";

type AuthMethod = "email" | "google" | "signup";

type AuthActionsProps = {
  redirectUrl: string;
};

const clerkAppearance = {
  variables: {
    colorPrimary: "#2457F5",
    colorText: "#15171A",
    colorBackground: "#FFFFFF",
    borderRadius: "0.875rem",
  },
};

const GoogleIcon = () => (
  <svg aria-hidden="true" className="h-5 w-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function AuthActions({ redirectUrl }: AuthActionsProps) {
  const clerk = useClerk();
  const [pending, setPending] = useState<AuthMethod | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef<AuthMethod | null>(null);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
  }, []);

  const finishLaunching = () => {
    resetTimer.current = window.setTimeout(() => {
      pendingRef.current = null;
      setPending(null);
    }, 800);
  };

  const begin = (method: AuthMethod) => {
    if (pendingRef.current || !clerk.loaded) return false;

    setError(null);
    if (!navigator.onLine) {
      setError("No hay conexión a internet. Verifica tu red e intenta nuevamente.");
      return false;
    }

    pendingRef.current = method;
    setPending(method);
    return true;
  };

  const openSignIn = (method: Exclude<AuthMethod, "signup">) => {
    if (!begin(method)) return;
    try {
      clerk.openSignIn({
        fallbackRedirectUrl: redirectUrl,
        signUpFallbackRedirectUrl: redirectUrl,
        appearance: clerkAppearance,
      });
      finishLaunching();
    } catch {
      pendingRef.current = null;
      setPending(null);
      setError("No pudimos abrir el inicio de sesión. Intenta nuevamente.");
      console.error("No se pudo abrir el modal administrado de inicio de sesión.");
    }
  };

  const openSignUp = () => {
    if (!begin("signup")) return;
    try {
      clerk.openSignUp({
        fallbackRedirectUrl: redirectUrl,
        signInFallbackRedirectUrl: redirectUrl,
        appearance: clerkAppearance,
      });
      finishLaunching();
    } catch {
      pendingRef.current = null;
      setPending(null);
      setError("No pudimos abrir el registro. Intenta nuevamente.");
      console.error("No se pudo abrir el modal administrado de registro.");
    }
  };

  const isBusy = pending !== null || !clerk.loaded;

  return (
    <div>
      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium leading-5 text-red-800">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={() => openSignIn("email")}
        disabled={isBusy}
        aria-busy={pending === "email"}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
      >
        {pending === "email" ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin motion-reduce:animate-none" /> : <Mail aria-hidden="true" className="h-5 w-5" />}
        {pending === "email" ? "Abriendo acceso…" : "Continuar con correo"}
      </button>

      <div className="my-5 flex items-center gap-3" aria-label="Otras opciones de acceso">
        <span aria-hidden="true" className="h-px flex-1 bg-slate-200" />
        <span className="shrink-0 text-xs font-semibold text-slate-500">o continúa con</span>
        <span aria-hidden="true" className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        type="button"
        onClick={() => openSignIn("google")}
        disabled={isBusy}
        aria-busy={pending === "google"}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-brand-navy shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
      >
        {pending === "google" ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin motion-reduce:animate-none" /> : <GoogleIcon />}
        {pending === "google" ? "Abriendo acceso…" : "Continuar con Google"}
      </button>

      <p className="mt-6 text-sm leading-6 text-slate-600">
        ¿Aún no tienes una cuenta?{" "}
        <button
          type="button"
          onClick={openSignUp}
          disabled={isBusy}
          className="min-h-11 rounded-lg px-1 font-bold text-brand-blue underline decoration-blue-200 underline-offset-4 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
        >
          {pending === "signup" ? "Abriendo registro…" : "Crear cuenta"}
        </button>
      </p>

      {pending && (
        <p role="status" aria-live="polite" className="sr-only">
          {pending === "signup" ? "Abriendo el registro seguro." : "Abriendo el inicio de sesión seguro."}
        </p>
      )}
    </div>
  );
}
