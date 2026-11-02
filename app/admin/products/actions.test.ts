import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/neon/adminProducts", () => ({
  createAdminProduct: mocks.create,
  updateAdminProduct: mocks.update,
  deleteAdminProduct: mocks.remove,
}));

import { createProductAction, deleteProductAction, updateProductAction } from "./actions";

const initialState = { success: false, message: "" };

describe("admin product actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "admin_1", sessionClaims: { metadata: { role: "admin" } } });
    mocks.create.mockResolvedValue("product.1");
    mocks.update.mockResolvedValue(undefined);
    mocks.remove.mockResolvedValue(undefined);
  });

  it("crea un producto validado y actualiza las rutas públicas", async () => {
    const result = await createProductAction(initialState, validProductForm());
    expect(result).toMatchObject({ success: true, productId: "product.1" });
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      name: "Camiseta oficial",
      slug: "camiseta-oficial",
      price: 12,
      stock: 8,
      isActive: true,
      taxable: true,
    }));
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/shop");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/product/camiseta-oficial");
  });

  it("rechaza slugs inválidos antes de escribir en Neon", async () => {
    const form = validProductForm();
    form.set("slug", "Slug con espacios");
    const result = await createProductAction(initialState, form);
    expect(result.success).toBe(false);
    expect(result.fieldErrors?.slug?.[0]).toBeTruthy();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("exige rol administrador para crear, editar y eliminar", async () => {
    mocks.auth.mockResolvedValue({ userId: "customer_1", sessionClaims: { metadata: { role: "customer" } } });
    await expect(createProductAction(initialState, validProductForm())).rejects.toThrow("ADMIN_REQUIRED");
    await expect(updateProductAction("product.1", initialState, validProductForm())).rejects.toThrow("ADMIN_REQUIRED");
    await expect(deleteProductAction("product.1")).rejects.toThrow("ADMIN_REQUIRED");
  });

  it("elimina el producto solicitado y revalida el catálogo", async () => {
    const result = await deleteProductAction("product.1");
    expect(result).toEqual({ success: true, message: "Producto eliminado." });
    expect(mocks.remove).toHaveBeenCalledWith("product.1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/products");
  });
});

function validProductForm(): FormData {
  const form = new FormData();
  form.set("name", "Camiseta oficial");
  form.set("slug", "camiseta-oficial");
  form.set("imageUrls", "https://images.example.com/camiseta.jpg");
  form.set("intro", "Artículo oficial");
  form.set("description", "Camiseta para actividades.");
  form.set("price", "12");
  form.set("discount", "0");
  form.set("stock", "8");
  form.set("sku", "ER-CAM-01");
  form.set("isActive", "on");
  form.set("taxable", "on");
  form.set("status", "new");
  form.set("variant", "tshirt");
  return form;
}
