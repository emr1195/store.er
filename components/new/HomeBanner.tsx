import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, BadgeCheck } from "lucide-react";
import jacketImage from "@/images/products/uploaded/jacket.png";
import tshirtImage from "@/images/products/uploaded/tshirt_new.png";

const HomeBanner = () => (
  <section aria-labelledby="hero-title" className="relative overflow-hidden bg-brand-navy text-white">
    <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,#2457f5_0,transparent_35%),radial-gradient(circle_at_90%_80%,#ffd23f_0,transparent_22%)]" />
    <div className="relative mx-auto grid max-w-screen-xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:py-20">
      <div className="max-w-3xl">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">
          <BadgeCheck className="h-4 w-4 text-brand-yellow" /> Tienda oficial en Panamá
        </p>
        <h1 id="hero-title" className="text-balance text-[clamp(2.25rem,6vw,4.75rem)] font-black uppercase leading-[.98] tracking-[-0.04em]">
          La tienda oficial de <span className="text-brand-yellow">Exploradores del Rey</span> en Panamá
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
          Encuentra uniformes, accesorios y artículos para exploradores, líderes y destacamentos.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a href="#productos" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 py-3 font-bold text-white shadow-lg shadow-black/20 transition hover:bg-blue-500 active:scale-[.98]">
            Ver productos <ArrowDown className="h-4 w-4" />
          </a>
          <Link href="/shop" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-bold text-white transition hover:bg-white/20 active:scale-[.98]">
            Explorar novedades <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="relative mx-auto h-[300px] w-full max-w-[520px] sm:h-[390px]" aria-label="Selección de ropa disponible en la tienda">
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
