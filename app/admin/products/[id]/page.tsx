import Link from "next/link";
import { notFound } from "next/navigation";
import ProductEditor from "@/components/admin/ProductEditor";
import { getAdminProduct } from "@/lib/neon/adminProducts";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getAdminProduct(decodeURIComponent(id));
  if (!product) notFound();
  return <div><Link href="/admin/products" className="mb-5 inline-flex min-h-11 items-center font-bold text-slate-500 hover:text-brand-blue">← Volver a productos</Link><ProductEditor product={product} /></div>;
}
