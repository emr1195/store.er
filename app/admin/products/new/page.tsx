import Link from "next/link";
import ProductEditor from "@/components/admin/ProductEditor";

export default function NewProductPage() {
  return <div><Link href="/admin/products" className="mb-5 inline-flex min-h-11 items-center font-bold text-slate-500 hover:text-brand-blue">← Volver a productos</Link><ProductEditor /></div>;
}
