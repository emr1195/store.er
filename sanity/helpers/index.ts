import { defineQuery } from "next-sanity";
import { sanityFetch } from "../lib/live";
import { backendClient } from "../lib/backendClient";
import type { Category, Product } from "@/sanity.types";

export const getAllProducts = async () => {
  const PRODUCTS_QUERY = defineQuery(`*[_type=="product"] | order(name asc)`);
  try {
    const products = await sanityFetch({
      query: PRODUCTS_QUERY,
    });
    return products.data || [];
  } catch (error) {
    console.log("Error fetching all products:", error);
    return [];
  }
};

export const getAllCategories = async (quantity?: number) => {
  const CATEGORIES_QUERY = `*[_type=="category"] | order(name asc)${quantity ? `[0...${quantity}]` : ""}`;

  try {
    const categories = await sanityFetch({
      query: CATEGORIES_QUERY,
    });
    return categories?.data || [];
  } catch (error) {
    console.error("Error fetching all categories:", error);
    return [];
  }
};

export const searchProductsByName = async (searchParam: string) => {
  const PRODUCT_SEARCH_QUERY = defineQuery(
    `*[_type == "product" && name match $searchParam] | order(name asc)`
  );

  try {
    const products = await sanityFetch({
      query: PRODUCT_SEARCH_QUERY,
      params: {
        searchParam: `${searchParam}`,
      },
    });
    return products?.data || [];
  } catch (error) {
    console.error("Error fetching products by name:", error);
    return [];
  }
};

export const getProductBySlug = async (slug: string) => {
  const PRODUCT_BY_ID_QUERY = defineQuery(
    `*[_type == "product" && slug.current == $slug] | order(name asc) [0]`
  );

  try {
    const product = await sanityFetch({
      query: PRODUCT_BY_ID_QUERY,
      params: {
        slug,
      },
    });
    return product?.data || null;
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return null;
  }
};

export type ProductCategory = Pick<Category, "_id" | "title" | "slug">;

export const getProductCategory = async (product: Product) => {
  const categoryId = product.categories?.[0]?._ref;
  if (!categoryId) return null;

  const PRODUCT_CATEGORY_QUERY = defineQuery(
    `*[_type == "category" && _id == $categoryId][0]{_id,title,slug}`
  );

  try {
    const category = await sanityFetch({
      query: PRODUCT_CATEGORY_QUERY,
      params: { categoryId },
    });
    return (category.data as ProductCategory | null) ?? null;
  } catch (error) {
    console.error("Error fetching product category:", error);
    return null;
  }
};

export const getRelatedProducts = async (product: Product) => {
  const categoryId = product.categories?.[0]?._ref ?? "";
  const variant = product.variant ?? "";
  const RELATED_PRODUCTS_QUERY = defineQuery(
    `*[_type == "product" && _id != $productId && isActive != false &&
      (($categoryId != "" && references($categoryId)) || ($categoryId == "" && variant == $variant))]
      | order(name asc)[0...4]`
  );

  try {
    const products = await sanityFetch({
      query: RELATED_PRODUCTS_QUERY,
      params: { productId: product._id, categoryId, variant },
    });
    return (products.data as Product[]) ?? [];
  } catch (error) {
    console.error("Error fetching related products:", error);
    return [];
  }
};

export const getProductsByCategory = async (categorySlug: string) => {
  const PRODUCT_BY_CATEGORY_QUERY = defineQuery(
    `*[_type == 'product' && references(*[_type == "category" && slug.current == $categorySlug]._id)] | order(name asc)`
  );
  try {
    const products = await sanityFetch({
      query: PRODUCT_BY_CATEGORY_QUERY,
      params: {
        categorySlug,
      },
    });
    return products?.data || [];
  } catch (error) {
    console.error("Erroor fetching products by category:", error);
    return [];
  }
};

export const getSale = async () => {
  const SALE_QUERY = defineQuery(`*[_type == 'sale'] | order(name asc)`);
  try {
    const products = await sanityFetch({
      query: SALE_QUERY,
    });
    return products?.data || [];
  } catch (error) {
    console.error("Error fetching products by category:", error);
    return [];
  }
};

export const getMyOrders = async (userId: string) => {
  if (!userId) {
    throw new Error("User ID is required");
  }
  const MY_ORDERS_QUERY =
    defineQuery(`*[_type == 'order' && clerkUserId == $userId] | order(orderDate desc){
    ...,products[]{
      ...,product->
    }
  }`);

  try {
    return await backendClient.fetch(MY_ORDERS_QUERY, { userId });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
};
