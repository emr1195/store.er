import Link from "next/link";
import { Product } from "@/sanity.types";
import { getProductImageUrl } from "@/lib/productImages";
import PriceView from "./PriceView";
import AddToCartButton from "./AddToCartButton";
import ProductImage from "./new/ProductImage";

const variantLabels: Record<string, string> = { tshirt: "Camisetas", jacket: "Chaquetas", pants: "Pantalones", pin: "Pines", patch: "Parches", cap: "Gorras", mug: "Tazas", short: "Pantalones cortos", others: "Otros" };
const statusLabels: Record<string, string> = { new: "Nuevo", hot: "Destacado", sale: "Oferta" };

export default function ProductCard({ product }: { product: Product }) {
  const image = getProductImageUrl(product, 700);
  const stock = product.stock ?? 0;
  const category = variantLabels[String(product.variant)] ?? "Artículo oficial";
  const badge = product.status ? statusLabels[product.status] : stock > 0 && stock <= 3 ? "Pocas unidades" : null;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg">
      <Link href={`/product/${product.slug?.current}`} className="relative block aspect-square overflow-hidden bg-slate-100 focus-visible:outline-none" aria-label={`Ver ${product.name ?? "producto"}`}>
        <ProductImage src={image} alt={`${product.name ?? "Producto"} de la tienda de Exploradores del Rey`} sizes="(max-width: 389px) 100vw, (max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw" className="h-full w-full" imageClassName="object-contain p-4 transition duration-300 motion-safe:group-hover:scale-[1.03]" />
        {badge && <span className="absolute left-3 top-3 rounded-full bg-brand-navy px-3 py-1 text-xs font-black text-white shadow-sm">{badge}</span>}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-blue">{category}</p>
        <Link href={`/product/${product.slug?.current}`} className="mt-1 line-clamp-2 min-h-12 text-base font-black leading-6 text-brand-navy hover:text-brand-blue">{product.name ?? "Producto sin nombre"}</Link>
        <div className="mt-2"><PriceView price={product.price} discount={product.discount} className="text-lg font-black text-ink" /></div>
        <p className={`mt-2 inline-flex items-center gap-2 text-sm font-bold ${stock > 0 ? "text-emerald-700" : "text-slate-500"}`}><span className={`h-2 w-2 rounded-full ${stock > 0 ? "bg-emerald-500" : "bg-slate-400"}`} />{stock > 0 ? "Disponible" : "Agotado"}</p>
        <div className="mt-auto pt-4"><AddToCartButton product={product} /></div>
      </div>
    </article>
  );
}
