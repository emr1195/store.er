import { ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function EmptyCart() {
  return (
    <section className="mx-auto flex min-h-[55dvh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-brand-blue" aria-hidden="true"><ShoppingBag className="h-9 w-9" /></span>
      <h1 className="mt-6 text-3xl font-black text-brand-navy sm:text-4xl">Tu carrito está vacío</h1>
      <p className="mt-3 max-w-md leading-7 text-slate-600">Explora nuestra tienda y encuentra productos para tu destacamento.</p>
      <Link href="/shop" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-blue px-6 font-black text-white shadow-sm hover:bg-blue-700">Ver productos</Link>
    </section>
  );
}
