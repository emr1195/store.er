import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock("@/lib/db", () => ({
  getSql: () => ({ query: mocks.query }),
}));

import { getCatalogProducts } from "./catalog";

describe("storefront catalog order", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.query.mockResolvedValue([]);
  });

  it("prioriza el suéter oficial y conserva el orden alfabético del resto", async () => {
    await getCatalogProducts({});

    const [query] = mocks.query.mock.calls[0] as [string, string[]];
    expect(query).toMatch(
      /order by\s+case when p\.slug = 'sueter-exploradores-del-rey' then 0 else 1 end,\s+p\.name asc/i,
    );
  });
});
