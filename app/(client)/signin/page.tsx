import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import AuthActions from "@/components/auth/AuthActions";

export const metadata: Metadata = {
  title: "Ingresar | ER Panamá",
  description: "Ingresa a tu cuenta de la tienda de Exploradores del Rey en Panamá.",
};

type SignInPageProps = {
  searchParams: Promise<{ redirect_url?: string }>;
};

const getSafeRedirectUrl = (redirectUrl?: string) => {
  if (!redirectUrl?.startsWith("/") || redirectUrl.startsWith("//")) return "/";
  return redirectUrl;
};

const SignInPage = async ({ searchParams }: SignInPageProps) => {
  const user = await currentUser();
  if (user) redirect("/");

  const { redirect_url: requestedRedirectUrl } = await searchParams;
  const redirectUrl = getSafeRedirectUrl(requestedRedirectUrl);

  return (
    <main className="relative isolate flex min-h-[calc(100dvh-81px)] items-center justify-center overflow-hidden bg-auth-page px-4 py-10 sm:px-6 sm:py-14">
      <div
        aria-hidden="true"
        className="absolute -left-24 top-8 -z-10 h-64 w-64 rounded-full bg-brand-blue/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-20 bottom-4 -z-10 h-56 w-56 rounded-full bg-brand-yellow/15 blur-3xl"
      />

      <section
        aria-labelledby="signin-title"
        className="w-full max-w-[440px] rounded-[18px] border border-slate-200 bg-white px-6 py-7 text-center shadow-[0_16px_40px_rgba(17,29,58,0.08)] min-[375px]:px-8 min-[375px]:py-8"
      >
        <Image
          src="/emblema.png"
          width={80}
          height={74}
          alt="Emblema oficial de Exploradores del Rey"
          className="mx-auto h-auto w-20 object-contain"
          priority
        />

        <div className="mt-5">
          <h1 id="signin-title" className="text-2xl font-black tracking-tight text-brand-navy sm:text-[1.75rem]">
            Bienvenido de nuevo
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
            Elige cómo deseas ingresar a tu cuenta.
          </p>
        </div>

        <div className="mt-7">
          <AuthActions redirectUrl={redirectUrl} />
        </div>

        <p className="mt-6 text-xs leading-5 text-slate-500">
          Al continuar, aceptas nuestros{" "}
          <Link href="/terms" className="font-semibold text-brand-navy underline decoration-slate-300 underline-offset-2 hover:text-brand-blue focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue">
            Términos y Condiciones
          </Link>{" "}
          y la{" "}
          <Link href="/privacy" className="font-semibold text-brand-navy underline decoration-slate-300 underline-offset-2 hover:text-brand-blue focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue">
            Política de Privacidad
          </Link>
          .
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Volver a la tienda
        </Link>
      </section>
    </main>
  );
};

export default SignInPage;
