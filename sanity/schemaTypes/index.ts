import { type SchemaTypeDefinition } from "sanity";

import { blockContentType } from "./blockContentType";
import { categoryType } from "./categoryType";
import { productType } from "./productType";
import { orderType } from "./orderType";
import { webhookEventType } from "./webhookEventType";
import { inventoryMovementType } from "./inventoryMovementType";
import { orderAuditType } from "./orderAuditType";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    blockContentType,
    categoryType,
    productType,
    orderType,
    webhookEventType,
    inventoryMovementType,
    orderAuditType,
  ],
};
