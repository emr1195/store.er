import Image from "next/image";
import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";

interface Props {
  children?: React.ReactNode;
  className?: string;
}

const Logo = ({ children, className }: Props) => (
  <Link href="/" className={cn("inline-flex items-center", className)} aria-label="ER Marketplace - Inicio">
    <Image src="/emblema.png" width={104} height={96} className="w-26 h-24" alt="Emblema de Exploradores del Rey" priority />
    {children}
  </Link>
);

export default Logo;
