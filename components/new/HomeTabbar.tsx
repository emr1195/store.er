"use client";

import { productType } from "@/constants";

interface Props {
  selectedTab: string;
  onTabSelect: (tab: string) => void;
}

export default function HomeTabbar({ selectedTab, onTabSelect }: Props) {
  const options = [{ title: "Todos", value: "" }, ...productType];

  return (
    <div
      role="tablist"
      aria-label="Filtrar productos por categoría"
      className="flex flex-wrap justify-center gap-2 pb-2 sm:gap-2.5"
    >
      {options.map((item) => {
        const active = selectedTab === item.value;

        return (
          <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onTabSelect(item.value)}
            key={item.title}
            className={`min-h-11 whitespace-nowrap rounded-full border px-3 text-[13px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 sm:px-4 sm:text-sm ${active ? "border-brand-blue bg-brand-blue text-white shadow-sm" : "border-slate-300 bg-white text-brand-navy hover:border-brand-blue hover:text-brand-blue active:bg-blue-50"}`}
          >
            {item.title}
          </button>
        );
      })}
    </div>
  );
}
