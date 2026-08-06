import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, BadgeCheck } from "lucide-react";
import jacketImage from "@/images/products/uploaded/jacket.png";
import tshirtImage from "@/images/products/uploaded/tshirt_new.png";

const HomeBanner = () => (
  <section aria-labelledby="hero-title" className="relative overflow-hidden bg-page-bg text-brand-navy lg:bg-brand-navy lg:text-white">
    <div aria-hidden="true" className="relative h-9 overflow-hidden bg-brand-navy lg:absolute lg:inset-0 lg:h-auto lg:opacity-30 lg:[background-image:radial-gradient(circle_at_20%_20%,#2457f5_0,transparent_35%),radial-gradient(circle_at_90%_80%,#ffd23f_0,transparent_22%)]">
      <span className="absolute -top-5 left-6 h-8 w-28 -rotate-3 rounded-full bg-white/95 lg:hidden" />
      <span className="absolute -top-6 right-5 h-9 w-36 rotate-3 rounded-full bg-white/95 lg:hidden" />
    </div>
    <div className="relative mx-auto grid max-w-screen-xl items-center gap-10 px-5 pb-7 pt-8 sm:px-6 sm:py-12 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:py-20">
      <div className="max-w-3xl">
        <p className="text-xs font-black uppercase tracking-[.2em] text-brand-blue lg:mb-4 lg:inline-flex lg:items-center lg:gap-2 lg:rounded-full lg:border lg:border-white/20 lg:bg-white/10 lg:px-4 lg:py-2 lg:text-sm lg:normal-case lg:tracking-normal lg:text-white">
          <BadgeCheck aria-hidden="true" className="hidden h-4 w-4 text-brand-yellow lg:block" /> Catálogo oficial
        </p>
        <h1 id="hero-title" className="mt-2 max-w-3xl text-balance text-[clamp(2rem,9vw,2.375rem)] font-black leading-[1.05] tracking-[-0.035em] lg:mt-0 lg:text-[clamp(3.25rem,6vw,4.75rem)] lg:uppercase lg:leading-[.98] lg:tracking-[-0.04em]">
          Encuentra todo para tu destacamento
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base lg:mt-6 lg:max-w-2xl lg:text-lg lg:leading-7 lg:text-white/80">
          Uniformes, accesorios y artículos oficiales para tus actividades.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row lg:mt-8 lg:gap-3">
          <a href="#productos" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 py-3 font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-[.98] motion-reduce:transform-none sm:w-auto lg:shadow-lg lg:shadow-black/20 lg:hover:bg-blue-500">
            Ver productos <ArrowDown aria-hidden="true" className="h-4 w-4" />
          </a>
          <Link href="/shop" className="hidden min-h-12 items-center justify-center gap-2 rounded-xl border border-brand-navy/20 px-6 py-3 font-bold text-brand-navy transition hover:bg-white active:scale-[.98] motion-reduce:transform-none sm:inline-flex lg:border-white/30 lg:bg-white/10 lg:text-white lg:hover:bg-white/20">
            Ver novedades <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="relative mx-auto hidden h-[390px] w-full max-w-[520px] lg:block" aria-label="Selección de ropa disponible en la tienda">
        <div className="absolute left-0 top-12 h-[78%] w-[62%] rotate-[-4deg] overflow-hidden rounded-3xl border border-white/15 bg-white/95 p-4 shadow-2xl motion-safe:transition-transform motion-safe:hover:-rotate-2">
          <Image src={jacketImage} alt="Chaqueta negra, ejemplo de producto de la tienda" fill sizes="(max-width: 640px) 55vw, 300px" className="object-contain p-4" priority />
        </div>
        <div className="absolute bottom-2 right-0 h-[72%] w-[58%] rotate-[5deg] overflow-hidden rounded-3xl border border-white/15 bg-[#edf1ff] p-4 shadow-2xl motion-safe:transition-transform motion-safe:hover:rotate-2">
          <Image src={tshirtImage} alt="Camisetas negras, ejemplo de producto de la tienda" fill sizes="(max-width: 640px) 52vw, 280px" className="object-contain p-5" priority />
        </div>
        <div className="absolute right-2 top-3 rounded-2xl bg-brand-yellow px-4 py-3 font-black text-brand-navy shadow-xl">Productos oficiales</div>
      </div>
    </div>
  </section>
);

export default HomeBanner;
