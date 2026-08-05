import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { LockKeyhole } from "lucide-react";
import Logo from "./new/Logo";

export default function NoAccessToCart() {
  return (
    <main className="flex min-h-[65dvh] items-center justify-center bg-page-bg px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-8">
        <div className="flex justify-center"><Logo /></div>
        <span className="mx-auto mt-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-brand-blue" aria-hidden="true"><LockKeyhole className="h-6 w-6" /></span>
        <h1 className="mt-4 text-2xl font-black text-brand-navy">Inicia sesión para ver tu carrito</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Accede a tu cuenta para revisar tus productos y continuar con el pago.</p>
        <div className="mt-6 space-y-3">
          <SignInButton mode="modal"><button type="button" className="min-h-12 w-full rounded-xl bg-brand-blue px-5 font-black text-white hover:bg-blue-700">Iniciar sesión</button></SignInButton>
          <SignUpButton mode="modal"><button type="button" className="min-h-12 w-full rounded-xl border border-slate-300 px-5 font-bold text-brand-navy hover:bg-slate-50">Crear cuenta</button></SignUpButton>
        </div>
      </section>
    </main>
  );
}
