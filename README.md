# ER Marketplace

Tienda para la organización Exploradores del Rey construida con Next.js 15. El catálogo, inventario, pedidos, auditoría y eventos de pago se almacenan en Sanity; Clerk gestiona las cuentas y Stripe Checkout procesa pagos en USD.

## Requisitos

- Node.js 20 o superior y npm.
- Proyecto Clerk con Google/correo configurados.
- Proyecto Sanity con dataset **privado**.
- Cuenta Stripe en modo prueba o producción.

## Instalación y configuración local

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Completa `.env.local` con credenciales de prueba. `SANITY_API_READ_TOKEN` requiere sólo lectura; `SANITY_API_TOKEN` necesita crear y modificar productos, pedidos, eventos, auditorías y movimientos. Nunca expongas estos tokens como variables `NEXT_PUBLIC_*`.

La aplicación valida las variables obligatorias al iniciar. Consulta [`.env.example`](./.env.example) para la lista y finalidad de cada variable.

## Comandos

```bash
npm run dev          # servidor local
npm run typecheck    # TypeScript estricto
npm run lint         # ESLint
npm test             # Vitest
npm run build        # build de producción
npm run typegen      # extraer esquema y regenerar tipos Sanity
npm run migrate:commerce            # vista previa de la migración
npm run migrate:commerce -- --execute # ejecutar migración aditiva
```

La migración `commerce-v2` añade valores seguros a documentos existentes. Su primera ejecución es siempre dry-run; no elimina campos. Para revertirla, se pueden retirar `isActive`, `taxable`, `totalCents` y `discountCents` de los documentos afectados, aunque no es necesario porque son campos aditivos.

## Flujo de checkout

1. El navegador envía únicamente ID de producto, cantidad y método de entrega.
2. La Server Action obtiene la identidad desde Clerk y vuelve a consultar catálogo, precio, descuento y stock en Sanity.
3. `lib/pricing.ts` calcula en centavos subtotal, descuento, base gravable, ITBMS, envío y total.
4. Una transacción Sanity crea el pedido `pending`, guarda snapshots y reserva inventario con control de revisión.
5. Stripe recibe exclusivamente los importes calculados por el servidor. El pedido pasa a `payment_pending`.
6. Si Stripe no puede crear la sesión, se libera la reserva y queda un movimiento auditable.

Los precios publicados no incluyen ITBMS. La tasa se define en `NEXT_PUBLIC_ITBMS_RATE`; el navegador sólo presenta una estimación y el servidor es definitivo. La moneda permitida es USD.

## Webhook e inventario

Configura Stripe para enviar eventos a `/api/webhook`:

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

Copia el secreto `whsec_...` a `STRIPE_WEBHOOK_SECRET`. Se atienden pagos completados, pagos asíncronos fallidos y sesiones expiradas. La firma se comprueba sobre el cuerpo original. Cada evento se guarda con un ID determinista; los reintentos no duplican pedidos ni inventario.

El stock se reserva al iniciar el pago. Un pago confirmado conserva la reducción. Una sesión expirada, pago fallido o cancelación válida libera la reserva en una operación atómica y crea un `inventoryMovement`.

## Estados y permisos

Flujo principal: `pending → payment_pending → paid → processing → shipped → delivered`. También existen `payment_failed`, `cancelled`, `refunded` y `archived`.

El cliente sólo puede cancelar un pedido propio en `pending` o `payment_pending`. Un pedido pagado requiere un flujo administrativo de reembolso y nunca se elimina físicamente. Las acciones guardan actor, fecha y cambio de estado en `orderAudit`. El rol administrativo se lee de los claims de sesión Clerk (`metadata.role` o `publicMetadata.role`) y siempre se valida en servidor.

## Sanity y privacidad

El dataset debe configurarse como privado porque los pedidos contienen datos personales. El navegador no recibe tokens Sanity ni consulta documentos directamente; `/api/catalog` expone únicamente productos activos. El Studio está montado en `/admin/studio` y exige rol Clerk `admin`, además de los permisos propios de Sanity.

## Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. Configura todas las variables de `.env.example` para Preview y Production.
3. Usa claves Stripe de prueba en Preview y claves reales sólo en Production.
4. Registra la URL de producción `/api/webhook` en Stripe.
5. Ejecuta primero la migración en dry-run y conserva un export del dataset antes de `--execute`.
6. Verifica `npm run typecheck`, `npm run lint`, `npm test` y `npm run build` antes de desplegar.

## Seguridad y operación

- No registres tokens, secretos, payloads completos de Stripe ni datos de tarjeta.
- Rota inmediatamente cualquier credencial que haya sido publicada.
- Conserva pedidos, auditorías y movimientos; cancela o archiva en lugar de borrar.
- Supervisa eventos `payment_amount_mismatch`, fallos de webhook y reservas pendientes.
- Los reembolsos necesitan autorización administrativa y confirmación Stripe antes de cambiar el pedido a `refunded`.

## Contenido pendiente para la tienda

Antes de publicar información comercial definitiva, la administración debe confirmar:

- zonas, modalidad, costos y tiempos de entrega;
- tiempo estimado de preparación;
- política de cambios y devoluciones;
- número oficial de WhatsApp;
- enlaces oficiales de Facebook, Instagram y YouTube;
- métodos de pago que estarán habilitados en Stripe.

El home identifica estos datos como “pendientes de confirmar” para no inventar políticas. Los archivos `images/products/uploaded/dummy_one.png`, `dummy_two.png`, `dummy_three.png` y `dummary_four.png` son recursos provisionales y no deben asignarse a productos publicados. Los productos sin fotografía utilizan `public/product-placeholder.svg`; deben reemplazarse en Sanity por fotografías oficiales, cuadradas, sin marcas de agua y con derechos de uso confirmados.
