import React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import localFont from "next/font/local";
import { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ER Panamá",
  description: "Tienda de Exploradores del Rey en Panamá",
};

const poppins = localFont({
  src: "./fonts/Poppins.woff2",
  variable: "--font-poppins",
  weight: "400",
  preload: false,
});
const raleway = localFont({
  src: "./fonts/Raleway.woff2",
  variable: "--font-raleway",
  weight: "100 900",
});

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className={`${poppins.variable} ${raleway.variable} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
};

export default RootLayout;
