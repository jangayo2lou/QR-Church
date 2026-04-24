import { Cormorant_Garamond, Manrope, UnifrakturMaguntia, Orbitron } from "next/font/google";
import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

const gothicFont = UnifrakturMaguntia({
  variable: "--font-gothic",
  weight: "400",
  subsets: ["latin"],
});

const orbitronFont = Orbitron({
  variable: "--font-tech",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata = {
  title: "Church QR Attendance",
  description: "Admin-managed church attendance with QR cards, scanner, and offline sync.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable} ${gothicFont.variable} ${orbitronFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
