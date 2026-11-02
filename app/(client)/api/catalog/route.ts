import { NextRequest, NextResponse } from "next/server";
import { getCatalogProducts } from "@/lib/neon/catalog";

export async function GET(request: NextRequest) {
  const variant = request.nextUrl.searchParams.get("variant")?.slice(0, 50);
  const category = request.nextUrl.searchParams.get("category")?.slice(0, 100);
  const search = request.nextUrl.searchParams.get("search")?.trim().slice(0, 100);

  const products = await getCatalogProducts({ variant, category, search });
  return NextResponse.json(products, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
