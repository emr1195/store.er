"use client";
import { productType } from "@/constants";
import { Repeat } from "lucide-react";

interface Props {
  selectedTab: string;
  onTabSelect: (tab: string) => void;
}

const HomeTabbar = ({ selectedTab, onTabSelect }: Props) => {
  return (
    <div className="w-full px-2 flex justify-center">
      <div className="flex flex-wrap justify-center items-center gap-2 text-sm font-semibold max-w-screen-lg">
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
        <button className="border border-darkColor px-2 py-2 rounded-full hover:bg-darkColor hover:text-white transition">
          <Repeat className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default HomeTabbar;
