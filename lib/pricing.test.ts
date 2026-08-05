import { beforeEach, describe, expect, it } from "vitest";
import { calculatePricing, calculateRefundCents, dollarsToCents } from "./pricing";

describe("calculatePricing", () => {
  beforeEach(() => { process.env.NEXT_PUBLIC_ITBMS_RATE = "0.07"; });

  it("calcula subtotal, ITBMS y total con cantidades múltiples", () => {
    const result = calculatePricing([{ productId: "a", unitPriceCents: 1000, quantity: 2 }]);
    expect(result).toMatchObject({ subtotalCents: 2000, taxBaseCents: 2000, itbmsCents: 140, totalCents: 2140 });
  });

  it("aplica descuento porcentual antes del impuesto", () => {
    const result = calculatePricing([{ productId: "a", unitPriceCents: 1000, quantity: 1, discountPercent: 10 }]);
    expect(result).toMatchObject({ discountCents: 100, taxBaseCents: 900, itbmsCents: 63, totalCents: 963 });
  });

  it("aplica descuento fijo y lo limita al subtotal", () => {
    expect(calculatePricing([{ productId: "a", unitPriceCents: 500, quantity: 1, discountFixedCents: 200 }]).totalCents).toBe(321);
    expect(calculatePricing([{ productId: "a", unitPriceCents: 500, quantity: 1, discountFixedCents: 900 }]).totalCents).toBe(0);
  });

  it("respeta productos exentos y envío", () => {
    const result = calculatePricing([{ productId: "a", unitPriceCents: 1000, quantity: 1, taxable: false }], { shippingCents: 250 });
    expect(result).toMatchObject({ itbmsCents: 0, shippingCents: 250, totalCents: 1250 });
  });

  it("redondea dólares a centavos consistentemente", () => {
    expect(dollarsToCents(10.235)).toBe(1024);
  });

  it.each([
    [[], "vacío"],
    [[{ productId: "a", unitPriceCents: 100, quantity: 0 }], "entero positivo"],
    [[{ productId: "a", unitPriceCents: -1, quantity: 1 }], "entero no negativo"],
  ])("rechaza entradas inválidas", (lines, message) => {
    expect(() => calculatePricing(lines as never)).toThrow(message);
  });
});

describe("calculateRefundCents", () => {
  it("admite reembolsos totales y parciales", () => {
    expect(calculateRefundCents(1000)).toBe(1000);
    expect(calculateRefundCents(1000, 250)).toBe(250);
  });
  it("rechaza un reembolso superior al pago", () => {
    expect(() => calculateRefundCents(1000, 1001)).toThrow();
  });
});
