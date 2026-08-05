import Image from "next/image";
import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";

interface Props {
  children?: React.ReactNode;
  className?: string;
}

const Logo = ({ children, className }: Props) => (
  <Link href="/" className={cn("inline-flex min-h-11 items-center", className)} aria-label="ER Marketplace - Inicio">
    <Image src="/emblema.png" width={72} height={64} className="h-12 w-auto object-contain lg:h-14" alt="Emblema de Exploradores del Rey" priority />
    {children}
  </Link>
);

export default Logo;
