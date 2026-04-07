import type { Metadata } from "next";
import "./globals.css";
import SessionWrapper from "./SessionWrapper";

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
    <html lang="en">
      <body className="antialiased">
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}
