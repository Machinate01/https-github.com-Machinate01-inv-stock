import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inventory Stock System - Atlanta Medicare",
  description: "ระบบจัดการสต็อกสินค้า Atlanta Medicare",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className="h-full">
      <body className="min-h-full bg-slate-100">{children}</body>
    </html>
  );
}
