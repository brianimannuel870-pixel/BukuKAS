"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ReceiptText,
  CalendarCheck2,
  Plus,
  User,
  LogOut,
  X,
} from "lucide-react";
import { UserSession } from "@/types";
import { useToast } from "@/components/ToastContext";

interface MobileNavProps {
  user: UserSession;
  onOpenNewRecord: () => void;
}

export default function MobileNav({ user, onOpenNewRecord }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
      toast.error("Terjadi kesalahan");
    } finally {
      setIsLoggingOut(false);
      setShowProfileSheet(false);
    }
  };

  return (
    <>
      {/* Mobile Fixed Bottom Nav (Zero-Shadow & Zero-Gradient) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1 safe-area-pb">
        <div className="flex items-center justify-around h-14">
          {/* Ringkasan */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
              pathname === "/" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <LayoutDashboard
              className={`w-5 h-5 ${
                pathname === "/" ? "text-emerald-600 stroke-[2.2]" : "text-slate-400"
              }`}
            />
            <span className="mt-0.5">Ringkasan</span>
          </Link>

          {/* Catatan */}
          <Link
            href="/records"
            className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
              pathname === "/records" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <ReceiptText
              className={`w-5 h-5 ${
                pathname === "/records" ? "text-emerald-600 stroke-[2.2]" : "text-slate-400"
              }`}
            />
            <span className="mt-0.5">Catatan</span>
          </Link>

          {/* Plus Action Button (Catat Baru Mobile) */}
          <div className="flex-1 flex justify-center -mt-5">
            <button
              onClick={onOpenNewRecord}
              aria-label="Tambah Catatan Baru"
              className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center border-2 border-white outline outline-4 outline-white active:scale-90 transition-transform"
            >
              <Plus className="w-6 h-6 text-emerald-400 stroke-[2.5]" />
            </button>
          </div>

          {/* Tutup Buku */}
          <Link
            href="/closing"
            className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
              pathname === "/closing" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <CalendarCheck2
              className={`w-5 h-5 ${
                pathname === "/closing" ? "text-emerald-600 stroke-[2.2]" : "text-slate-400"
              }`}
            />
            <span className="mt-0.5">Tutup Buku</span>
          </Link>

          {/* Profile */}
          <button
            onClick={() => setShowProfileSheet(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            <User className="w-5 h-5 text-slate-400" />
            <span className="mt-0.5">Akun</span>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Sheet for User Profile (max-h-[85vh], Zero-Shadow) */}
      {showProfileSheet && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setShowProfileSheet(false)}
          />
          <div className="relative bg-white rounded-t-[28px] border-t border-slate-200 flex flex-col max-h-[85vh] z-10 animate-in slide-in-from-bottom duration-300 overflow-hidden">
            {/* FIXED HEADER */}
            <div className="shrink-0 sticky top-0 z-20 bg-white border-b border-slate-200">
              <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />
              <div className="flex items-center justify-between px-5 pt-2 pb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base border border-emerald-200 shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{user.name}</h4>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProfileSheet(false)}
                  className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="p-5 space-y-3 overflow-y-auto flex-1 overscroll-contain">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Tutup Buku Rutin:</span> Setiap
                tanggal <span className="font-bold text-slate-900">{user.closingDay}</span> tiap
                bulan.
              </div>

              <Link
                href="/closing"
                onClick={() => setShowProfileSheet(false)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <span>Kelola Tanggal & Arsip Tutup Buku</span>
                <CalendarCheck2 className="w-4 h-4 text-emerald-600" />
              </Link>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 font-semibold text-xs transition-colors mt-2"
              >
                <LogOut className="w-4 h-4" />
                {isLoggingOut ? "Sedang keluar..." : "Keluar dari Akun"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
