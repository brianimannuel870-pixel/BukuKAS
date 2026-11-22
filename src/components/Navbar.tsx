"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Wallet,
  LayoutDashboard,
  ReceiptText,
  CalendarCheck2,
  PlusCircle,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { UserSession } from "@/types";
import { useToast } from "@/components/ToastContext";

interface NavbarProps {
  user: UserSession;
  onOpenNewRecord: () => void;
}

export default function Navbar({ user, onOpenNewRecord }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navLinks = [
    { href: "/", label: "Ringkasan", icon: LayoutDashboard },
    { href: "/records", label: "Riwayat Catatan", icon: ReceiptText },
    { href: "/closing", label: "Tutup Buku", icon: CalendarCheck2 },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        toast.success("Berhasil keluar dari akun");
        router.push("/login");
        router.refresh();
      } else {
        toast.error("Gagal keluar, silakan coba lagi");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsLoggingOut(false);
      setShowProfileMenu(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo (Zero-Shadow & Zero-Gradient) */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center border border-slate-800 group-hover:scale-105 transition-transform">
            <Wallet className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight tracking-tight text-slate-900 flex items-center gap-1.5">
              Buku<span className="text-emerald-600">KAS</span>
            </span>
            <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">
              Utang & Piutang
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-100 text-slate-900 border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2.5">
          {/* Quick Add Button (Desktop Only) */}
          <button
            onClick={onOpenNewRecord}
            className="hidden sm:flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Catat Baru</span>
          </button>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-700"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-200">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-tight max-w-[120px] truncate">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-400 leading-tight">
                  Tutup Tgl {user.closingDay}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Dropdown Menu (Zero-Shadow) */}
            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 py-1.5 z-50">
                  <div className="px-3.5 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-medium text-slate-400">Masuk sebagai</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>

                  <Link
                    href="/closing"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <CalendarCheck2 className="w-4 h-4 text-slate-400" />
                    Jadwal Tutup Buku (Tgl {user.closingDay})
                  </Link>

                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-100 mt-1"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    {isLoggingOut ? "Sedang keluar..." : "Keluar Akun"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
