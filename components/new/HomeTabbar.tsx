"use client";

import { productType } from "@/constants";

interface Props { selectedTab: string; onTabSelect: (tab: string) => void; }

export default function HomeTabbar({ selectedTab, onTabSelect }: Props) {
  const options = [{ title: "Todos", value: "" }, ...productType];
  return (
    <div className="w-full overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div role="tablist" aria-label="Filtrar productos por categoría" className="flex min-w-max gap-2 px-0.5 sm:justify-center">
        {options.map((item) => {
          const active = selectedTab === item.value;
          return <button type="button" role="tab" aria-selected={active} onClick={() => onTabSelect(item.value)} key={item.title} className={`min-h-11 rounded-full border px-4 text-sm font-bold transition focus-visible:outline-none ${active ? "border-brand-blue bg-brand-blue text-white shadow-sm" : "border-slate-300 bg-white text-slate-700 hover:border-brand-blue hover:text-brand-blue"}`}>{item.title}</button>;
        })}
      </div>
    </div>
  );
}
