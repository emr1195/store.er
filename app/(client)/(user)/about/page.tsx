import Container from "@/components/Container";

const AboutPage = () => {
  return (
    <div className="">
      <Container className="max-w-6xl lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-6">About Us</h1>
        <p className="mb-4">
          a cutting-edge technology company dedicated to providing
          innovative solutions for modern businesses. Founded in 2020,
          we&apos;ve quickly established ourselves as a leader in digital
          transformation and software development.
        </p>
        <p className="mb-4">
          Our team of expert developers, designers, and strategists work
          tirelessly to create custom solutions that help our clients streamline
          their operations, increase efficiency, and drive growth.
        </p>
        <p>
          we believe in the power of technology to transform
          businesses and improve lives. We&apos;re committed to staying at the
          forefront of technological advancements and delivering exceptional
          value to our clients.
        </p>
      </Container>
    </div>
  );
};

export default AboutPage;
