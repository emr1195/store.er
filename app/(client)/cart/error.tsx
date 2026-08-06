"use client";

import { useEffect } from "react";
import Link from "next/link";

type CartErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function CartError({ error, reset }: CartErrorProps) {
  useEffect(() => {
    console.error("Cart error", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <main className="flex min-h-[60dvh] items-center justify-center bg-page-bg px-4 py-12">
      <section role="alert" className="w-full max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-widest text-brand-red">Error inesperado</p>
        <h1 className="mt-2 text-2xl font-black text-red-950">No pudimos cargar tu carrito</h1>
        <p className="mt-3 text-sm leading-6 text-red-800">Ocurrió un inconveniente inesperado. Intenta nuevamente.</p>
        {error.digest && <p className="mt-2 text-xs text-red-700">Referencia: {error.digest}</p>}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="min-h-11 rounded-xl bg-red-700 px-5 font-bold text-white hover:bg-red-800">Intentar nuevamente</button>
          <Link href="/shop" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-300 px-5 font-bold text-red-900 hover:bg-red-100">Volver a la tienda</Link>
        </div>
      </section>
    </main>
  );
}
