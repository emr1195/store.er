"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminSession } from "@/lib/auth-session";
import { createAdminProduct, deleteAdminProduct, updateAdminProduct } from "@/lib/neon/adminProducts";

export type ProductActionState = {
  success: boolean;
  message: string;
  productId?: string;
  fieldErrors?: Record<string, string[]>;
};

const imageUrlSchema = z.string().refine((value) => value.startsWith("sanity:") || /^https:\/\//i.test(value), {
  message: "Cada imagen debe ser una URL HTTPS válida.",
});

const productSchema = z.object({
  name: z.string().trim().min(2, "Escribe un nombre de al menos 2 caracteres.").max(120),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usa minúsculas, números y guiones."),
  imageUrls: z.array(imageUrlSchema).max(6, "Puedes usar hasta 6 imágenes."),
  intro: z.string().trim().max(180),
  description: z.string().trim().max(2000),
  price: z.coerce.number().min(0).max(1_000_000),
  discount: z.coerce.number().min(0).max(100),
  stock: z.coerce.number().int().min(0).max(1_000_000),
  sku: z.string().trim().max(80),
  isActive: z.boolean(),
  taxable: z.boolean(),
  status: z.enum(["", "new", "hot", "sale"]),
  variant: z.enum(["", "tshirt", "jacket", "pants", "pin", "short", "others", "patch", "cap", "mug"]),
});

export async function createProductAction(_previous: ProductActionState, formData: FormData): Promise<ProductActionState> {
  await requireAdmin();
  const parsed = parseProduct(formData);
  if (!parsed.success) return invalidState(parsed.error.flatten().fieldErrors);
  try {
    const productId = await createAdminProduct(parsed.data);
    revalidateProductPaths(parsed.data.slug);
    return { success: true, message: "Producto creado correctamente.", productId };
  } catch (error) {
    return databaseError(error);
  }
}

export async function updateProductAction(productId: string, _previous: ProductActionState, formData: FormData): Promise<ProductActionState> {
  await requireAdmin();
  const parsed = parseProduct(formData);
  if (!parsed.success) return invalidState(parsed.error.flatten().fieldErrors);
  try {
    await updateAdminProduct(productId, parsed.data);
    revalidateProductPaths(parsed.data.slug);
    return { success: true, message: "Cambios guardados correctamente.", productId };
  } catch (error) {
    return databaseError(error);
  }
}

export async function deleteProductAction(productId: string): Promise<ProductActionState> {
  await requireAdmin();
  try {
    await deleteAdminProduct(productId);
    revalidateProductPaths();
    return { success: true, message: "Producto eliminado." };
  } catch (error) {
    return databaseError(error);
  }
}

async function requireAdmin(): Promise<string> {
  const session = await requireAdminSession();
  return session.user.id;
}

function parseProduct(formData: FormData) {
  const imageUrls = String(formData.get("imageUrls") ?? "").split("\n").map((value) => value.trim()).filter(Boolean);
  return productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    imageUrls,
    intro: formData.get("intro") ?? "",
    description: formData.get("description") ?? "",
    price: formData.get("price"),
    discount: formData.get("discount"),
    stock: formData.get("stock"),
    sku: formData.get("sku") ?? "",
    isActive: formData.get("isActive") === "on",
    taxable: formData.get("taxable") === "on",
    status: formData.get("status") ?? "",
    variant: formData.get("variant") ?? "",
  });
}

function invalidState(fieldErrors: Record<string, string[] | undefined>): ProductActionState {
  return {
    success: false,
    message: "Revisa los campos marcados antes de guardar.",
    fieldErrors: Object.fromEntries(Object.entries(fieldErrors).filter((entry): entry is [string, string[]] => Boolean(entry[1]))),
  };
}

function databaseError(error: unknown): ProductActionState {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  if (code === "23505") return { success: false, message: "Ya existe un producto con ese slug." };
  return { success: false, message: "No pudimos guardar el producto. Inténtalo nuevamente." };
}

function revalidateProductPaths(slug?: string) {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin/products");
  if (slug) revalidatePath(`/product/${slug}`);
}
