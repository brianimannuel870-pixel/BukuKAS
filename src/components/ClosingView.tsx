"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarCheck2,
  Calendar,
  Save,
  CheckCircle2,
  Archive,
  Clock,
  Sparkles,
  Loader2,
  Info,
} from "lucide-react";
import { UserSession, MonthlyClosingItem, MonthlyClosingPreview } from "@/types";
import { formatRupiah, formatDateTimeIndo } from "@/lib/utils";
import { useToast } from "./ToastContext";
import { useRouter } from "next/navigation";

interface ClosingViewProps {
  user: UserSession;
  initialClosings: MonthlyClosingItem[];
}

export default function ClosingView({
  user,
  initialClosings,
}: ClosingViewProps) {
  const toast = useToast();
  const router = useRouter();

  // Settings State
  const [closingDay, setClosingDay] = useState<number>(user.closingDay || 28);
  const [isSavingSetting, setIsSavingSetting] = useState(false);

  // Period Closing State
  const now = new Date();
  const currentPeriodDefault = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  const defaultDayStr = String(Math.min(Math.max(user.closingDay || 28, 1), 28)).padStart(2, "0");
  const defaultDateStr = `${currentPeriodDefault}-${defaultDayStr}`;

  const [closingDateStr, setClosingDateStr] = useState(defaultDateStr);
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriodDefault);
  const [closingDateForPeriod, setClosingDateForPeriod] = useState(defaultDateStr);
  const [preview, setPreview] = useState<MonthlyClosingPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isProcessingClosing, setIsProcessingClosing] = useState(false);

  // Handle Setting Date Picker change
  const handleClosingDateChange = (val: string) => {
    setClosingDateStr(val);
    if (val) {
      const parts = val.split("-");
      if (parts.length === 3) {
        const day = parseInt(parts[2], 10);
        if (!isNaN(day) && day >= 1 && day <= 31) {
          setClosingDay(day);
        }
      }
    }
  };

  // Handle Period Date Picker change
  const handlePeriodDateChange = (val: string) => {
    setClosingDateForPeriod(val);
    if (val && val.length >= 7) {
      const period = val.slice(0, 7);
      setSelectedPeriod(period);
    }
  };

  // Fetch Preview whenever selectedPeriod changes
  const fetchPreview = async (period: string) => {
    setIsLoadingPreview(true);
    try {
      const res = await fetch(`/api/closing/preview?period=${period}`);
      const data = await res.json();
      if (res.ok) {
        setPreview(data.preview);
      } else {
        toast.error(data.error || "Gagal memuat pratinjau tutup buku");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    fetchPreview(selectedPeriod);
  }, [selectedPeriod]);

  // Save Closing Day Setting
  const handleSaveSetting = async () => {
    setIsSavingSetting(true);
    try {
      const res = await fetch("/api/closing/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closingDay }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Pengaturan berhasil disimpan");
        router.refresh();
      } else {
        toast.error(data.error || "Gagal menyimpan pengaturan");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsSavingSetting(false);
    }
  };

  // Process / Upsert Monthly Closing
  const handleProcessClosing = async () => {
    setIsProcessingClosing(true);
    try {
      const res = await fetch("/api/closing/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: selectedPeriod }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Tutup buku berhasil disimpan!");
        fetchPreview(selectedPeriod);
        router.refresh();
      } else {
        toast.error(data.error || "Gagal memproses tutup buku");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsProcessingClosing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header (Zero-Shadow & Zero-Gradient) */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Kelola Tutup Buku Bulanan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Atur siklus tanggal rutin bulanan, buat rekonsiliasi kas, dan simpan arsip laporan
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. CARD: PENGATURAN TANGGAL TUTUP BUKU RUTIN */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center border border-slate-800">
              <Calendar className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Jadwal Tanggal Rutin</h3>
              <p className="text-[11px] text-slate-400">Tersimpan di akun database Anda</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Pilih Tanggal Tutup Buku
              </label>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Tgl {closingDay} setiap bulan
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative flex-1 min-w-0">
                <input
                  type="date"
                  value={closingDateStr}
                  onChange={(e) => handleClosingDateChange(e.target.value)}
                  className="w-full min-w-0 max-w-full appearance-none px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveSetting}
                disabled={isSavingSetting}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 shrink-0"
              >
                {isSavingSetting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 text-emerald-400" />
                )}
                <span>Simpan</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Info className="w-3.5 h-3.5 text-indigo-600" />
                Penyesuaian Hari Otomatis
              </div>
              <p className="text-[11px] text-slate-500">
                Pilih tanggal pada kalender di atas untuk menetapkan hari tutup buku bulanan Anda (Tgl {closingDay}). Sistem otomatis menyesuaikan jika bulan tertentu memiliki hari lebih sedikit (seperti Februari atau April).
              </p>
            </div>
          </div>
        </div>

        {/* 2. CARD: PRATINJAU & PROSES TUTUP BUKU */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <CalendarCheck2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Pratinjau & Eksekusi Tutup Buku
                </h3>
                <p className="text-[11px] text-slate-400">
                  Hitung kalkulasi per periode dan simpan snapshot laporan
                </p>
              </div>
            </div>

            {/* Period / Date Selector - iOS Safari datepicker support */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                Pilih Tanggal:
              </span>
              <input
                type="date"
                value={closingDateForPeriod}
                onChange={(e) => handlePeriodDateChange(e.target.value)}
                className="min-w-0 max-w-full appearance-none px-3 py-1.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Status Badge */}
          {preview && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                {preview.alreadyClosed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-600" />
                )}
                <span className="text-xs font-bold text-slate-800">
                  {preview.alreadyClosed
                    ? `Periode ${selectedPeriod} Sudah Pernah Ditutup`
                    : `Periode ${selectedPeriod} Belum Pernah Ditutup`}
                </span>
              </div>
              {preview.closedAt && (
                <span className="text-[11px] text-slate-500 font-medium">
                  Tutup pada: {formatDateTimeIndo(preview.closedAt)}
                </span>
              )}
            </div>
          )}

          {/* 4 Preview Metric Cards */}
          {isLoadingPreview ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="text-xs">Menghitung kalkulasi data periode...</p>
            </div>
          ) : preview ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Piutang Baru */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
                  Piutang Baru
                </span>
                <p className="text-sm sm:text-base font-bold text-slate-900 mt-1 truncate">
                  {formatRupiah(preview.newReceivables)}
                </p>
                <span className="text-[10px] text-slate-400">Pokok pinjaman</span>
              </div>

              {/* Pembayaran Masuk */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block truncate">
                  Pembayaran Masuk
                </span>
                <p className="text-sm sm:text-base font-bold text-emerald-700 mt-1 truncate">
                  {formatRupiah(preview.incomingPayments)}
                </p>
                <span className="text-[10px] text-emerald-600/80">Kas masuk</span>
              </div>

              {/* Bunga Periode */}
              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
                <span className="text-[10px] font-semibold text-indigo-800 uppercase tracking-wider block truncate">
                  Bunga Periode
                </span>
                <p className="text-sm sm:text-base font-bold text-indigo-700 mt-1 truncate">
                  {formatRupiah(preview.periodInterest)}
                </p>
                <span className="text-[10px] text-indigo-600/80">Potensi bunga</span>
              </div>

              {/* Sisa Piutang Akhir */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
                  Sisa Piutang Akhir
                </span>
                <p className="text-sm sm:text-base font-bold text-rose-600 mt-1 truncate">
                  {formatRupiah(preview.endingReceivables)}
                </p>
                <span className="text-[10px] text-slate-400">Total belum lunas</span>
              </div>
            </div>
          ) : null}

          {/* Action Button: Process Closing */}
          <div className="pt-2 flex items-center justify-end">
            <button
              onClick={handleProcessClosing}
              disabled={isProcessingClosing || isLoadingPreview}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {isProcessingClosing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-400" />
              )}
              <span>
                {preview?.alreadyClosed ? "Perbarui Tutup Buku" : "Proses Tutup Buku"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. ARSIP TUTUP BUKU BULANAN */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-slate-400" />
            <h3 className="text-base font-bold text-slate-900">
              Arsip Tutup Buku Bulanan ({initialClosings.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Snapshot laporan tersimpan di tabel Neon Postgres
          </span>
        </div>

        {initialClosings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-3">Periode</th>
                  <th className="py-3 px-3">Tanggal Rutin</th>
                  <th className="py-3 px-3">Waktu Closing</th>
                  <th className="py-3 px-3 text-right">Piutang Baru</th>
                  <th className="py-3 px-3 text-right">Pembayaran Masuk</th>
                  <th className="py-3 px-3 text-right">Bunga Periode</th>
                  <th className="py-3 px-3 text-right">Sisa Piutang Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {initialClosings.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono text-xs">
                        {c.period}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      Tgl {c.closingDaySetting}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {formatDateTimeIndo(c.closedAt)}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-800">
                      {formatRupiah(c.newReceivables)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-600">
                      +{formatRupiah(c.incomingPayments)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-indigo-600">
                      {formatRupiah(c.periodInterest)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-rose-600">
                      {formatRupiah(c.endingReceivables)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
            <Archive className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">Belum Ada Arsip Tutup Buku</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Klik tombol &ldquo;Proses Tutup Buku&rdquo; di atas untuk membuat arsip periode
              pertama Anda.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
