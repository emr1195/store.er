"use client";
import { productType } from "@/constants";
import { Home } from "lucide-react";

interface Props {
  selectedTab: string;
  onTabSelect: (tab: string | null) => void; // Cambiado para aceptar null
}

const HomeTabbar = ({ selectedTab, onTabSelect }: Props) => {
  return (
    <div className="w-full px-2 flex justify-center">
      <div className="flex flex-wrap justify-center items-center gap-2 text-sm font-semibold max-w-screen-lg">
        <button 
          onClick={() => onTabSelect(null)} // Llama a onTabSelect con null para limpiar filtros
          className={`border border-darkColor px-2 py-2 rounded-full hover:bg-darkColor hover:text-white transition ${
            !selectedTab ? "bg-darkColor text-white" : "" // Resalta si no hay filtro seleccionado
          }`}
        >
          <Home className="w-5 h-5" />
        </button>
        {productType?.map((item) => (
          <button
            onClick={() => onTabSelect(item?.value)}
            key={item?.title}
            className={`border border-darkColor px-4 py-1.5 rounded-full hover:bg-darkColor hover:text-white transition ${
              selectedTab === item?.value ? "bg-darkColor text-white" : ""
            }`}
          >
            {item?.title}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomeTabbar;