import { NextRequest, NextResponse } from "next/server";
import { backendClient } from "@/sanity/lib/backendClient";

export async function GET(request: NextRequest) {
  const variant = request.nextUrl.searchParams.get("variant")?.slice(0, 50);
  const category = request.nextUrl.searchParams.get("category")?.slice(0, 100);
  const search = request.nextUrl.searchParams.get("search")?.trim().slice(0, 100);

  const filters = ["_type == 'product'", "isActive != false"];
  const params: Record<string, string> = {};
  if (variant) { filters.push("variant == $variant"); params.variant = variant; }
  if (category) {
    filters.push("references(*[_type == 'category' && slug.current == $category]._id)");
    params.category = category;
  }
  if (search) { filters.push("name match $search"); params.search = `${search}*`; }

  const products = await backendClient.fetch(
    `*[${filters.join(" && ")}] | order(name asc)[0...100]{_id,_type,_createdAt,_updatedAt,name,slug,images,intro,description,price,discount,categories,stock,status,variant,sku,isActive,taxable}`,
    params
  );
  return NextResponse.json(products, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
