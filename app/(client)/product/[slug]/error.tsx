"use client";

import Link from "next/link";

export default function ProductError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[60dvh] items-center justify-center bg-page-bg px-4">
      <section role="alert" className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-black uppercase tracking-widest text-brand-blue">No pudimos cargar el producto</p>
        <h1 className="mt-3 text-2xl font-black text-brand-navy">Inténtalo nuevamente</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">La información no está disponible en este momento. Tus datos y tu carrito no se han modificado.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="min-h-11 rounded-xl bg-brand-blue px-5 font-bold text-white hover:bg-blue-700">Volver a intentar</button>
          <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 font-bold text-brand-navy hover:bg-slate-50">Volver a la tienda</Link>
        </div>
      </section>
    </main>
  );
}
