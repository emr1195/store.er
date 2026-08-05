import type { Product } from "@/sanity.types";
import { urlFor } from "@/sanity/lib/image";

const provisionalProductNames = new Set([
  "camiseta deportiva er",
  "gorra exploradores",
  "gorra exploradores del rey",
  "gorra navegantes",
]);

const normalizeProductName = (name?: string | null) =>
  name?.trim().toLocaleLowerCase("es") ?? "";

export const needsFinalProductImage = (product: Pick<Product, "name">) =>
  provisionalProductNames.has(normalizeProductName(product.name));

export const getProductImageUrl = (
  product: Pick<Product, "name" | "images">,
  size: number
) => {
  if (needsFinalProductImage(product) || !product.images?.[0]?.asset) {
    return "/product-placeholder.svg";
  }

  return urlFor(product.images[0])
    .width(size)
    .height(size)
    .fit("max")
    .auto("format")
    .url();
};
