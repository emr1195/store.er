import Link from "next/link";
import { ArrowDown, ArrowRight, BadgeCheck } from "lucide-react";
import jacketImage from "@/images/products/uploaded/jacket.png";
import tshirtImage from "@/images/products/uploaded/tshirt_new.png";
import { getCatalogProducts } from "@/lib/neon/catalog";
import { getProductImageUrl } from "@/lib/productImages";
import HeroProductCarousel, { type HeroProductSlide } from "./HeroProductCarousel";

const HomeBanner = async () => {
  const products = await loadHeroProducts();

  return (
  <section aria-labelledby="hero-title" className="relative overflow-hidden bg-page-bg text-brand-navy lg:bg-brand-navy lg:text-white">
    <div aria-hidden="true" className="h-9 bg-brand-navy lg:absolute lg:inset-0 lg:h-auto lg:opacity-30 lg:[background-image:radial-gradient(circle_at_20%_20%,#2457f5_0,transparent_35%),radial-gradient(circle_at_90%_80%,#ffd23f_0,transparent_22%)]" />
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

      <HeroProductCarousel products={products} />
    </div>
  </section>
  );
};

async function loadHeroProducts(): Promise<HeroProductSlide[]> {
  try {
    const products = await getCatalogProducts({});
    const slides = products.flatMap((product) => {
      const slug = product.slug?.current;
      const name = product.name?.trim();
      const image = getProductImageUrl(product, 900);
      if (!slug || !name || image === "/product-placeholder.svg") return [];
      return [{ id: product._id, name, image, href: `/product/${encodeURIComponent(slug)}` }];
    });
    if (slides.length >= 2) return slides.slice(0, 12);
  } catch (error) {
    console.error("No se pudieron cargar los productos del hero", error instanceof Error ? error.message : "Error desconocido");
  }

  return [
    { id: "fallback-jacket", name: "Chaqueta oficial", image: jacketImage.src, href: "/shop" },
    { id: "fallback-tshirt", name: "Camiseta oficial", image: tshirtImage.src, href: "/shop" },
  ];
}

export default HomeBanner;
