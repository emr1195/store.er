import Link from "next/link";
import { CheckCircle2, ChevronRight, PackageCheck, ShieldCheck } from "lucide-react";
import Container from "@/components/Container";
import PriceView from "@/components/PriceView";
import ProductCard from "@/components/ProductCard";
import ProductDetailsAccordion from "@/components/product/ProductDetailsAccordion";
import ProductGallery from "@/components/product/ProductGallery";
import ProductPurchaseActions from "@/components/product/ProductPurchaseActions";
import { getProductBySlug, getProductCategory, getRelatedProducts } from "@/sanity/helpers";
import { notFound } from "next/navigation";

const variantLabels: Record<string, string> = {
  tshirt: "Camisetas", jacket: "Chaquetas", pants: "Pantalones", pin: "Pines",
  patch: "Parches", cap: "Gorras", mug: "Tazas", short: "Pantalones cortos", others: "Productos",
};

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [category, relatedProducts] = await Promise.all([
    getProductCategory(product),
    getRelatedProducts(product),
  ]);
  const categoryName = category?.title ?? variantLabels[String(product.variant)] ?? "Producto oficial";
  const categoryHref = category?.slug?.current ? `/category/${category.slug.current}` : null;
  const stock = Math.max(0, product.stock ?? 0);
  const lowStock = stock > 0 && stock <= 3;

  return (
    <main className="min-h-screen bg-page-bg pb-24 md:pb-12">
      <Container className="max-w-[1280px] py-5 sm:py-8">
        <nav aria-label="Ruta de navegación" className="mb-5 text-sm text-slate-500">
          <ol className="flex min-w-0 flex-wrap items-center gap-1.5">
            <li><Link href="/" className="rounded-sm hover:text-brand-blue">Inicio</Link></li>
            <li aria-hidden="true"><ChevronRight className="h-4 w-4" /></li>
            <li>
              {categoryHref ? <Link href={categoryHref} className="rounded-sm hover:text-brand-blue">{categoryName}</Link> : <span>{categoryName}</span>}
            </li>
            <li aria-hidden="true"><ChevronRight className="h-4 w-4" /></li>
            <li className="min-w-0 max-w-full truncate font-semibold text-brand-navy" aria-current="page">{product.name ?? "Producto"}</li>
          </ol>
        </nav>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(23rem,.88fr)] lg:gap-12 xl:gap-16">
          <ProductGallery images={product.images} productName={product.name ?? "Producto"} />

          <section aria-labelledby="product-title" className="min-w-0 rounded-[1.125rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:sticky lg:top-24">
            <p className="text-xs font-black uppercase tracking-[.14em] text-brand-blue">{categoryName}</p>
            <h1 id="product-title" className="mt-2 text-3xl font-black leading-tight tracking-tight text-brand-navy sm:text-4xl">{product.name ?? "Producto sin nombre"}</h1>
            <div className="mt-4">
              <PriceView price={product.price} discount={product.discount} className="text-3xl font-black text-brand-ink" />
            </div>
            <p className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              {stock <= 0 ? "Agotado" : lowStock ? "Pocas unidades disponibles" : "Disponible"}
            </p>

            {product.intro?.trim() && <p className="mt-5 line-clamp-3 text-base leading-7 text-slate-600">{product.intro}</p>}

            <div className="mt-6 border-t border-slate-200 pt-6">
              <ProductPurchaseActions product={product} />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2" aria-label="Información de compra">
              <div className="flex gap-3 rounded-xl bg-slate-50 p-3.5">
                <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
                <div><p className="text-sm font-bold text-brand-navy">Compra segura</p><p className="mt-0.5 text-xs leading-5 text-slate-500">El pago se procesa mediante el proveedor seguro de la tienda.</p></div>
              </div>
              <div className="flex gap-3 rounded-xl bg-slate-50 p-3.5">
                <PackageCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
                <div><p className="text-sm font-bold text-brand-navy">Stock verificado</p><p className="mt-0.5 text-xs leading-5 text-slate-500">La disponibilidad se valida nuevamente antes del pago.</p></div>
              </div>
            </div>

            <div className="mt-6"><ProductDetailsAccordion product={product} /></div>
          </section>
        </div>

        {relatedProducts.length > 0 && (
          <section aria-labelledby="related-title" className="mt-14 sm:mt-20">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[.14em] text-brand-blue">Más para explorar</p>
                <h2 id="related-title" className="mt-1 text-2xl font-black text-brand-navy sm:text-3xl">También podría interesarte</h2>
              </div>
              {categoryHref && <Link href={categoryHref} className="rounded-lg text-sm font-bold text-brand-blue hover:underline">Ver más productos</Link>}
            </div>
            <div className="grid grid-cols-1 gap-4 min-[390px]:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((relatedProduct) => <ProductCard key={relatedProduct._id} product={relatedProduct} />)}
            </div>
          </section>
        )}
      </Container>
    </main>
  );
}
