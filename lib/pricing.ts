export const STORE_CURRENCY = (process.env.STORE_CURRENCY || "USD").toLowerCase();

export type PricingLineInput = {
  productId: string;
  unitPriceCents: number;
  quantity: number;
  discountPercent?: number;
  discountFixedCents?: number;
  taxable?: boolean;
};

export type PricingLine = PricingLineInput & {
  subtotalCents: number;
  discountCents: number;
  taxBaseCents: number;
  itbmsCents: number;
  totalCents: number;
};

export type PricingResult = {
  currency: string;
  lines: PricingLine[];
  subtotalCents: number;
  discountCents: number;
  taxBaseCents: number;
  itbmsCents: number;
  shippingCents: number;
  totalCents: number;
};

export function dollarsToCents(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("El precio del producto no es válido");
  }
  return Math.round(value * 100);
}

export function centsToDollars(value: number): number {
  assertNonNegativeInteger(value, "importe");
  return value / 100;
}

export function getItbmsRateBasisPoints(): number {
  const configuredRate = Number(process.env.NEXT_PUBLIC_ITBMS_RATE ?? "0.07");
  if (!Number.isFinite(configuredRate) || configuredRate < 0 || configuredRate > 1) {
    throw new Error("ITBMS_RATE debe ser un número entre 0 y 1");
  }
  return Math.round(configuredRate * 10_000);
}

export function calculatePricing(
  inputs: PricingLineInput[],
  options: { shippingCents?: number; currency?: string } = {}
): PricingResult {
  if (inputs.length === 0) throw new Error("El carrito está vacío");

  const rateBasisPoints = getItbmsRateBasisPoints();
  const shippingCents = options.shippingCents ?? 0;
  assertNonNegativeInteger(shippingCents, "envío");

  const lines = inputs.map((input): PricingLine => {
    assertNonNegativeInteger(input.unitPriceCents, "precio");
    assertPositiveInteger(input.quantity, "cantidad");
    const discountPercent = input.discountPercent ?? 0;
    if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
      throw new Error("El descuento debe estar entre 0 y 100");
    }

    const discountFixedCents = input.discountFixedCents ?? 0;
    assertNonNegativeInteger(discountFixedCents, "descuento fijo");
    const subtotalCents = input.unitPriceCents * input.quantity;
    const discountCents = Math.min(
      subtotalCents,
      Math.round((subtotalCents * discountPercent) / 100) + discountFixedCents
    );
    const taxBaseCents = subtotalCents - discountCents;
    const itbmsCents = input.taxable === false
      ? 0
      : Math.round((taxBaseCents * rateBasisPoints) / 10_000);

    return {
      ...input,
      discountPercent,
      taxable: input.taxable !== false,
      subtotalCents,
      discountCents,
      taxBaseCents,
      itbmsCents,
      totalCents: taxBaseCents + itbmsCents,
    };
  });

  const sum = (field: keyof Pick<PricingLine, "subtotalCents" | "discountCents" | "taxBaseCents" | "itbmsCents">) =>
    lines.reduce((total, line) => total + line[field], 0);
  const subtotalCents = sum("subtotalCents");
  const discountCents = sum("discountCents");
  const taxBaseCents = sum("taxBaseCents");
  const itbmsCents = sum("itbmsCents");

  return {
    currency: (options.currency || STORE_CURRENCY).toLowerCase(),
    lines,
    subtotalCents,
    discountCents,
    taxBaseCents,
    itbmsCents,
    shippingCents,
    totalCents: taxBaseCents + itbmsCents + shippingCents,
  };
}

export function calculateRefundCents(totalPaidCents: number, requestedCents?: number): number {
  assertNonNegativeInteger(totalPaidCents, "total pagado");
  const refund = requestedCents ?? totalPaidCents;
  assertNonNegativeInteger(refund, "reembolso");
  if (refund > totalPaidCents) throw new Error("El reembolso supera el total pagado");
  return refund;
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${label} debe ser un entero positivo`);
  }
}

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} debe ser un entero no negativo`);
  }
}
