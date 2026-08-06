export type InventoryAvailability = {
  productId: string;
  availableQuantity: number;
};

export type CheckoutStage =
  | "initializing"
  | "loading_existing_checkout"
  | "loading_user"
  | "loading_cart"
  | "validating_cart"
  | "validating_stock"
  | "calculating_totals"
  | "creating_order"
  | "reserving_inventory"
  | "creating_payment_session"
  | "updating_order"
  | "releasing_inventory"
  | "completed";

export type SafeErrorDetails = {
  errorName: string;
  errorMessage: string;
  errorCode: string;
  httpStatus?: number;
};

export function getSafeErrorDetails(error: unknown): SafeErrorDetails {
  if (!(error instanceof Error) && (!error || typeof error !== "object")) {
    return {
      errorName: "UnknownError",
      errorMessage: typeof error === "string" ? sanitizeErrorMessage(error) : "Se recibió un error no identificable",
      errorCode: "UNKNOWN",
    };
  }

  const candidate = error as {
    name?: unknown;
    message?: unknown;
    code?: unknown;
    statusCode?: unknown;
    response?: { statusCode?: unknown; status?: unknown };
  };
  const httpStatus = firstHttpStatus(candidate.statusCode, candidate.response?.statusCode, candidate.response?.status);
  const explicitCode = typeof candidate.code === "string" || typeof candidate.code === "number"
    ? String(candidate.code)
    : undefined;

  return {
    errorName: typeof candidate.name === "string" && candidate.name ? candidate.name : "UnknownError",
    errorMessage: sanitizeErrorMessage(
      typeof candidate.message === "string" && candidate.message
        ? candidate.message
        : "Se recibió un error sin mensaje"
    ),
    errorCode: explicitCode ?? (httpStatus ? `HTTP_${httpStatus}` : "UNKNOWN"),
    httpStatus,
  };
}

function firstHttpStatus(...values: unknown[]): number | undefined {
  return values.find((value): value is number => Number.isInteger(value) && Number(value) >= 100 && Number(value) <= 599);
}

function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/(?:sk|pk|whsec)_(?:test|live)_[A-Za-z0-9_-]+/gi, "[REDACTED]")
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
    .replace(/([?&](?:token|key|secret|signature)=)[^&\s]+/gi, "$1[REDACTED]")
    .slice(0, 500);
}

export class StockChangedError extends Error {
  readonly code = "STOCK_CHANGED" as const;

  constructor(
    readonly inventory: InventoryAvailability[],
    message = "La disponibilidad de uno de los productos cambió."
  ) {
    super(message);
    this.name = "StockChangedError";
  }
}

export type CheckoutFailureCode =
  | "STOCK_CHANGED"
  | "EMPTY_CART"
  | "INVALID_CART"
  | "UNAUTHORIZED"
  | "CHECKOUT_IN_PROGRESS"
  | "PAYMENT_PROVIDER_ERROR"
  | "CHECKOUT_FAILED";

export type CheckoutResult =
  | { success: true; checkoutUrl: string; orderId: string }
  | {
      success: false;
      code: CheckoutFailureCode;
      message: string;
      inventory?: InventoryAvailability[];
    };
