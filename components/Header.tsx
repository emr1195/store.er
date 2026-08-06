import Link from "next/link";
import { ClerkLoaded, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { CircleUserRound } from "lucide-react";
import Container from "./Container";
import { getAllCategories } from "@/sanity/helpers";
import HeaderMenu from "./new/HeaderMenu";
import CartIcon from "./new/CartIcon";
import MobileMenu from "./new/MobileMenu";
import SearchBar from "./new/SearchBar";
import Logo from "./new/Logo";

const Header = async () => {
  const categories = await getAllCategories(8);
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md">
      <Container className="relative flex min-h-16 items-center justify-between gap-3 pb-0 lg:min-h-18">
        <div className="lg:hidden"><MobileMenu categories={categories} /></div>
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:hidden">
          <Logo className="pointer-events-auto min-h-0 [&_img]:h-11" />
        </div>
        <HeaderMenu />
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <SearchBar />
          <ClerkLoaded>
            <SignedIn>
              <Link href="/orders" className="hidden min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-brand-navy transition hover:bg-blue-50 hover:text-brand-blue lg:flex">
                <CircleUserRound aria-hidden="true" className="h-5 w-5" /> Mi cuenta
              </Link>
              <span className="hidden lg:inline-flex"><UserButton /></span>
            </SignedIn>
            <SignedOut>
              <Link href="/signin" className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-bold text-brand-navy transition hover:bg-blue-50 hover:text-brand-blue lg:flex">Ingresar</Link>
            </SignedOut>
          </ClerkLoaded>
          <CartIcon />
        </div>
      </Container>
    </header>
  );
};

export default Header;
