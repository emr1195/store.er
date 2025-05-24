import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";


interface Props {children: React.ReactNode; className?: string;}

const Logo = ({ children, className }: Props) => {
  return (
    <Link href={"/"}>
      <img src="/emblema.png" className="w-26 h-24" alt="" />
        {children}
      
    </Link>
  );
};

export default Logo;
