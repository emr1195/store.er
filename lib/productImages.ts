import type { Product } from "@/sanity.types";
import { urlFor } from "@/sanity/lib/image";

export const getProductImageUrl = (
  product: Pick<Product, "images">,
  size: number
) => {
  if (!product.images?.[0]?.asset) {
    return "/product-placeholder.svg";
  }

  return urlFor(product.images[0])
    .width(size)
    .height(size)
    .fit("max")
    .auto("format")
    .url();
};
