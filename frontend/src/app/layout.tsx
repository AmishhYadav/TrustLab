import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionWrapper from "./SessionWrapper";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "TrustLab — Human–AI Trust Calibration",
  description:
    "An adaptive interface for studying and improving trust calibration between humans and AI systems.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="antialiased font-[var(--font-inter)]">
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}
