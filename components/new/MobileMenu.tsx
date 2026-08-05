"use client";

import { AlignLeft } from "lucide-react";
import { useState } from "react";
import Sidebar from "./Sidebar";
import { CATEGORIES_QUERYResult } from "@/sanity.types";

const MobileMenu = ({ categories }: { categories: CATEGORIES_QUERYResult }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  return (
    <>
      <button onClick={toggleSidebar} aria-label="Abrir menú" aria-expanded={isSidebarOpen} aria-controls="mobile-navigation" className="flex h-11 w-11 items-center justify-center rounded-xl text-brand-navy hover:bg-blue-50 lg:hidden">
        <AlignLeft aria-hidden="true" className="h-6 w-6" />
      </button>
      <div className="lg:hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          categories={categories}
        />
      </div>
    </>
  );
};

export default MobileMenu;
