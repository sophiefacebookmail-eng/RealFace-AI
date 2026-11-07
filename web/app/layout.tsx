import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RealFace AI",
  description: "Consent-first real-time avatar studio"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
