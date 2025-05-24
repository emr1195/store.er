import Container from "@/components/Container";
import HomeBanner from "@/components/new/HomeBanner";
import ProductGrid from "@/components/ProductGrid";

export default function Home() {
  return (
    <Container className="py-10">
      <HomeBanner />
      <ProductGrid />
    </Container>
  );
}
