import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BukuKAS — Catatan Utang Piutang & Bunga Flat",
  description:
    "Aplikasi pencatatan utang dan piutang modern, minimalis, dan terstruktur dengan perhitungan bunga flat serta fitur tutup buku bulanan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
