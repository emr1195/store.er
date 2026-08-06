import { describe, expect, it } from "vitest";

import { getSafeErrorDetails } from "./checkout";

describe("getSafeErrorDetails", () => {
  it("extrae nombre, código y estado HTTP sin incluir el stack", () => {
    const error = Object.assign(new Error("Mutation rejected"), {
      name: "ClientError",
      code: "SANITY_MUTATION_FAILED",
      statusCode: 403,
    });

    expect(getSafeErrorDetails(error)).toEqual({
      errorName: "ClientError",
      errorMessage: "Mutation rejected",
      errorCode: "SANITY_MUTATION_FAILED",
      httpStatus: 403,
    });
  });

  it("redacta credenciales y limita mensajes demasiado largos", () => {
    const details = getSafeErrorDetails(new Error(
      `Bearer abc.def.ghi sk_live_should_not_leak ${"x".repeat(600)}`
    ));

    expect(details.errorMessage).not.toContain("abc.def.ghi");
    expect(details.errorMessage).not.toContain("sk_live_should_not_leak");
    expect(details.errorMessage.length).toBeLessThanOrEqual(500);
  });

  it("normaliza valores que no son Error", () => {
    expect(getSafeErrorDetails("fallo desconocido")).toEqual({
      errorName: "UnknownError",
      errorMessage: "fallo desconocido",
      errorCode: "UNKNOWN",
    });
  });
});
