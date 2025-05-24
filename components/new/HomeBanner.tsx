import React from "react";
import Title from "../Title";

const HomeBanner = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-5">
      <Title className="uppercase text-3xl md:text-5xl font-bold text-center">
        La Primera tienda Online de{' '} <br /><span className="text-blue-600">Exploradores del Rey</span><br /> en Panamá.
      </Title>
      <p className="text-sm text-center text-lightColor/80 font-medium max-w-[480px] ">
        Bienvenido al Marketplace de Exploradores del Rey en Panamá, Donde podras encontraras todo lo que necesitas para tu destacamento
      </p>
    </div>
  );
};

export default HomeBanner;
