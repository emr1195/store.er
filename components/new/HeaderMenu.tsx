"use client";
import { CATEGORIES_QUERYResult, Category } from "@/sanity.types";
import Link from "next/link";
import Logo from "./Logo";
import { usePathname } from "next/navigation";

const HeaderMenu = ({ categories }: { categories: CATEGORIES_QUERYResult }) => {
  const pathname = usePathname();

  return (
    <div className="hidden md:inline-flex w-1/3 items-center gap-5 text-sm capitalize font-semibold text-lightColor">
      <Link href={""}>
        <Logo children={undefined} />
      </Link>
      
      <Link
        href={"/"}
        className={`hover:text-darkColor hoverEffect relative group ${pathname === "/" && "text-darkColor"}`}
      >
        Inicio
        <span
          className={`absolute -bottom-0.5 left-1/2 w-0 h-0.5 bg-darkColor transition-all duration-300 group-hover:w-1/2 group-hover:left-0 ${
            pathname === "/" && "w-1/2"
          }`}
        />
        <span
          className={`absolute -bottom-0.5 right-1/2 w-0 h-0.5 bg-darkColor transition-all duration-300 group-hover:w-1/2 group-hover:right-0 ${
            pathname === "/" && "w-1/2"
          }`}
        />
      </Link>
      {/* {categories?.map((category: Category) => (
        <Link
          key={category?._id}
          href={`/category/${category?.slug?.current}`}
          className={`hover:text-darkColor hoverEffect relative group ${pathname === `/category/${category?.slug?.current}` && "text-darkColor"}`}
        >
          {category?.title}
          <span
            className={`absolute -bottom-0.5 left-1/2 w-0 h-0.5 bg-darkColor transition-all duration-300 group-hover:w-1/2 group-hover:left-0 ${
              pathname === `/category/${category?.slug?.current}` && "w-1/2"
            }`}
          />
          <span
            className={`absolute -bottom-0.5 right-1/2 w-0 h-0.5 bg-darkColor transition-all duration-300 group-hover:w-1/2 group-hover:right-0 ${
              pathname === `/category/${category?.slug?.current}` && "w-1/2"
            }`}
          />
        </Link>
      ))} */}
      <Link
        href={"/shop"}
        className={`hover:text-darkColor hoverEffect relative group ${pathname === "/" && "text-darkColor"}`}
      >
        Novedades
        <span
          className={`absolute -bottom-0.5 left-1/2 w-0 h-0.5 bg-darkColor transition-all duration-300 group-hover:w-1/2 group-hover:left-0 ${
            pathname === "/shop" && "w-1/2"
          }`}
        />
        <span
          className={`absolute -bottom-0.5 right-1/2 w-0 h-0.5 bg-darkColor transition-all duration-300 group-hover:w-1/2 group-hover:right-0 ${
            pathname === "/shop" && "w-1/2"
          }`}
        />
      </Link>
    </div>
  );
};

export default HeaderMenu;
