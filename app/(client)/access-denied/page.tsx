import Link from "next/link";

export default function AccessDeniedPage() {
  return <main className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
    <h1 className="text-3xl font-bold">Acceso denegado</h1>
    <p>No tienes permisos para abrir esta sección.</p>
    <Link className="underline font-semibold" href="/">Volver al inicio</Link>
  </main>;
}
