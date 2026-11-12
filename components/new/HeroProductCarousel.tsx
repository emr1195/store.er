"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pause, Play } from "lucide-react";
import ProductImage from "./ProductImage";

export type HeroProductSlide = {
  id: string;
  name: string;
  image: string;
  href: string;
};

const ROTATION_INTERVAL_MS = 7_000;

export default function HeroProductCarousel({ products }: { products: HeroProductSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const primaryProduct = products.length ? products[activeIndex % products.length] : undefined;
  const secondaryProduct = products.length ? products[(activeIndex + 1) % products.length] : undefined;

  useEffect(() => {
    if (paused || products.length < 2) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    const step = products.length > 2 ? 2 : 1;
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + step) % products.length);
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [paused, products.length]);

  if (!primaryProduct || !secondaryProduct) return null;

  return (
    <div className="relative mx-auto hidden h-[390px] w-full max-w-[520px] lg:block" role="group" aria-label="Productos disponibles en la tienda">
      <Link href={primaryProduct.href} aria-label={`Ver ${primaryProduct.name}`} className="absolute left-0 top-12 h-[78%] w-[62%] rotate-[-4deg] overflow-hidden rounded-3xl border border-white/15 bg-white/95 p-4 shadow-2xl motion-safe:transition-transform motion-safe:hover:-rotate-2">
        <ProductImage key={primaryProduct.id} src={primaryProduct.image} alt={primaryProduct.name} sizes="300px" className="h-full w-full bg-transparent" imageClassName="object-contain p-4" priority />
      </Link>
      <Link href={secondaryProduct.href} aria-label={`Ver ${secondaryProduct.name}`} className="absolute bottom-2 right-0 h-[72%] w-[58%] rotate-[5deg] overflow-hidden rounded-3xl border border-white/15 bg-[#edf1ff] p-4 shadow-2xl motion-safe:transition-transform motion-safe:hover:rotate-2">
        <ProductImage key={secondaryProduct.id} src={secondaryProduct.image} alt={secondaryProduct.name} sizes="280px" className="h-full w-full bg-transparent" imageClassName="object-contain p-5" priority />
      </Link>
      <div className="absolute right-2 top-3 flex items-center gap-2">
        <div className="rounded-2xl bg-brand-yellow px-4 py-3 font-black text-brand-navy shadow-xl">Productos oficiales</div>
        <button type="button" onClick={() => setPaused((current) => !current)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-brand-navy/90 text-white shadow-xl transition hover:bg-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow motion-reduce:hidden" aria-label={paused ? "Reanudar carrusel de productos" : "Pausar carrusel de productos"}>
          {paused ? <Play aria-hidden="true" className="h-4 w-4" /> : <Pause aria-hidden="true" className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
