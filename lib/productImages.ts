import type { Product } from "@/sanity.types";
import { urlFor } from "@/sanity/lib/image";

export const getProductImageUrl = (
  product: Pick<Product, "images">,
  size: number
) => {
  const firstImage = product.images?.[0] as (NonNullable<Product["images"]>[number] & { url?: string }) | undefined;
  if (firstImage?.url?.startsWith("https://")) return firstImage.url;
  if (!firstImage?.asset) {
    return "/product-placeholder.svg";
  }

  return urlFor(firstImage)
    .width(size)
    .height(size)
    .fit("max")
    .auto("format")
    .url();
};

export function editableImageToUrl(value: string | undefined): string {
  if (!value) return "/product-placeholder.svg";
  if (value.startsWith("https://")) return value;
  if (!value.startsWith("sanity:image-")) return "/product-placeholder.svg";
  const match = /^sanity:image-([a-zA-Z0-9]+)-(\d+x\d+)-([a-zA-Z0-9]+)$/.exec(value);
  if (!match) return "/product-placeholder.svg";
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (!projectId || !dataset) return "/product-placeholder.svg";
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${match[1]}-${match[2]}.${match[3]}`;
}
