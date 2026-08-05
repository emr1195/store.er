import { defineField, defineType } from "sanity";

export const inventoryMovementType = defineType({
  name: "inventoryMovement",
  title: "Inventory movement",
  type: "document",
  fields: [
    defineField({ name: "productId", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "orderId", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "quantity", type: "number", validation: (Rule) => Rule.required().integer() }),
    defineField({ name: "reason", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "createdAt", type: "datetime", validation: (Rule) => Rule.required() }),
  ],
});
