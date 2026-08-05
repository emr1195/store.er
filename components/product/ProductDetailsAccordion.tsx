import type { Product } from "@/sanity.types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const variantLabels: Record<string, string> = {
  tshirt: "Camiseta", jacket: "Chaqueta", pants: "Pantalón", pin: "Pin",
  patch: "Parche", cap: "Gorra", mug: "Taza", short: "Pantalón corto", others: "Otro",
};

export default function ProductDetailsAccordion({ product }: { product: Product }) {
  const hasDescription = Boolean(product.description?.trim());
  const hasDetails = Boolean(product.variant);
  if (!hasDescription && !hasDetails) return null;

  return (
    <Accordion type="single" collapsible defaultValue={hasDescription ? "description" : "details"} className="border-t border-slate-200">
      {hasDescription && (
        <AccordionItem value="description">
          <AccordionTrigger className="min-h-12 text-left font-bold text-brand-navy">Descripción del producto</AccordionTrigger>
          <AccordionContent className="text-sm leading-6 text-slate-600">{product.description}</AccordionContent>
        </AccordionItem>
      )}
      {hasDetails && (
        <AccordionItem value="details">
          <AccordionTrigger className="min-h-12 text-left font-bold text-brand-navy">Detalles del producto</AccordionTrigger>
          <AccordionContent className="text-sm leading-6 text-slate-600">
            Tipo: <span className="font-semibold text-brand-navy">{variantLabels[String(product.variant)] ?? product.variant}</span>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
}
