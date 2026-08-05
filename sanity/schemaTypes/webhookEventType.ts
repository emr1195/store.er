import { defineField, defineType } from "sanity";

export const webhookEventType = defineType({
  name: "webhookEvent",
  title: "Processed webhook event",
  type: "document",
  fields: [
    defineField({ name: "provider", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "eventId", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "eventType", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "orderId", type: "string" }),
    defineField({ name: "processedAt", type: "datetime", validation: (Rule) => Rule.required() }),
  ],
});
