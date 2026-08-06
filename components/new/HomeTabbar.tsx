"use client";

import { productType } from "@/constants";

interface Props { selectedTab: string; onTabSelect: (tab: string) => void; }

export default function HomeTabbar({ selectedTab, onTabSelect }: Props) {
  const options = [{ title: "Todos", value: "" }, ...productType];
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div role="tablist" aria-label="Filtrar productos por categoría" className="flex min-w-max snap-x snap-proximity flex-nowrap gap-2.5">
        {options.map((item) => {
          const active = selectedTab === item.value;
          return <button type="button" role="tab" aria-selected={active} onClick={() => onTabSelect(item.value)} key={item.title} className={`min-h-11 flex-none snap-start whitespace-nowrap rounded-full border px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 ${active ? "border-brand-blue bg-brand-blue text-white shadow-sm" : "border-slate-300 bg-white text-brand-navy hover:border-brand-blue hover:text-brand-blue active:bg-blue-50"}`}>{item.title}</button>;
        })}
      </div>
    </div>
  );
}
