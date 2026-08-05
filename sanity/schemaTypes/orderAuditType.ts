import { defineField, defineType } from "sanity";

export const orderAuditType = defineType({
  name: "orderAudit",
  title: "Order audit",
  type: "document",
  fields: [
    defineField({ name: "orderId", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "actorId", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "action", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "previousStatus", type: "string" }),
    defineField({ name: "newStatus", type: "string" }),
    defineField({ name: "createdAt", type: "datetime", validation: (Rule) => Rule.required() }),
  ],
});
