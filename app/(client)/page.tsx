import Container from "@/components/Container";
import HomeBanner from "@/components/new/HomeBanner";
import ProductGrid from "@/components/ProductGrid";
import StoreBenefits from "@/components/StoreBenefits";
import StoreInformation from "@/components/StoreInformation";

export default function Home() {
  return (
    <main>
      <HomeBanner />
      <Container className="py-12 sm:py-16">
        <ProductGrid />
      </Container>
      <StoreBenefits />
      <StoreInformation />
    </main>
  );
}
