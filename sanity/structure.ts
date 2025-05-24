import type { StructureResolver } from "sanity/structure";

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Ecommerce Admin")
    .items([
      S.documentTypeListItem("product").title("Products"),

      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) => item.getId() && !["product"].includes(item.getId()!)
      ),
    ]);
