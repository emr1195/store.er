import Container from "@/components/Container";

export default function ProductLoading() {
  return (
    <main className="min-h-screen bg-page-bg" aria-busy="true" aria-label="Cargando producto">
      <Container className="max-w-[1280px] py-8">
        <div className="mb-5 h-5 w-64 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div className="aspect-square animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none" />
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
            <div className="mt-4 h-10 w-4/5 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
            <div className="mt-5 h-8 w-28 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
            <div className="mt-8 h-14 w-full animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none" />
          </div>
        </div>
      </Container>
    </main>
  );
}
