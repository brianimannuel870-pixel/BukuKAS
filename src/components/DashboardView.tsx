"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  Percent,
  PlusCircle,
  CreditCard,
  ChevronRight,
  TrendingUp,
  LayoutDashboard,
} from "lucide-react";
import { DashboardMetrics, RecordItem, UserSession } from "@/types";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import PaymentModal from "./PaymentModal";
import RecordModal from "./RecordModal";
import { useRouter } from "next/navigation";

interface DashboardViewProps {
  user: UserSession;
  metrics: DashboardMetrics;
  recentRecords: RecordItem[];
}

export default function DashboardView({
  user,
  metrics,
  recentRecords,
}: DashboardViewProps) {
  const router = useRouter();

  const [selectedRecordForPayment, setSelectedRecordForPayment] =
    useState<RecordItem | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* 1. BANNER STATUS TUTUP BUKU (Banner Kecil Simple - Zero-Shadow & Zero-Gradient) */}
      <div className="rounded-xl bg-slate-900 text-white px-3.5 py-2.5 sm:px-4 sm:py-3 border border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center shrink-0 border border-slate-700">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                Tutup Buku Rutin: Tgl {metrics.closingDay}
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                {metrics.currentPeriod}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1.5 truncate mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-emerald-400 font-medium">
                {metrics.daysUntilClosing === 0
                  ? "Hari ini jadwal closing!"
                  : `${metrics.daysUntilClosing} hari lagi`}
              </span>
              <span className="text-slate-400 hidden sm:inline">
                ({metrics.nextClosingDateFormatted})
              </span>
            </p>
          </div>
        </div>

        <Link
          href="/closing"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-colors shrink-0 active:scale-95"
        >
          <span>Kelola</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 2A. MODE MOBILE: KARTU RINGKASAN (Piutang Aktif + Pendapatan Bunga + Utang Aktif) */}
      <div className="block md:hidden">
        <div className="rounded-2xl bg-white p-5 border border-slate-200 space-y-4">
          {/* Header Kartu Ringkasan */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                <LayoutDashboard className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Kartu Ringkasan</h3>
                <p className="text-[10px] text-slate-400">Total piutang, bunga & kewajiban utang</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Aktif
            </span>
          </div>

          {/* Bagian Utama: Total Piutang Aktif */}
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Piutang Aktif
            </span>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatRupiah(metrics.totalActiveReceivables)}
            </p>
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 pt-0.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              {metrics.countActiveReceivables} catatan pinjaman belum lunas
            </p>
          </div>

          {/* Sub-Metrik Grid: Pendapatan Bunga Flat & Total Utang Aktif */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            {/* Box 1: Pendapatan Bunga Flat */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Bunga Flat
                </span>
                <Percent className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <p className="text-sm font-bold text-indigo-600 truncate">
                {formatRupiah(metrics.totalPotentialInterest)}
              </p>
              <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Terealisasi:</span>
                <span className="font-bold text-emerald-700">
                  {formatRupiah(metrics.totalRealizedInterest)}
                </span>
              </div>
            </div>

            {/* Box 2: Total Utang Aktif */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Utang Aktif
                </span>
                <ArrowDownLeft className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <p className="text-sm font-bold text-slate-900 truncate">
                {formatRupiah(metrics.totalActivePayables)}
              </p>
              <p className="text-[10px] text-slate-500 truncate pt-1 border-t border-slate-200/60">
                {metrics.countActivePayables} kewajiban berjalan
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2B. MODE DESKTOP: 3 KARTU METRIK UTAMA (Zero-Shadow & Zero-Gradient) */}
      <div className="hidden md:grid md:grid-cols-3 gap-6">
        {/* KARTU 1: Total Piutang Aktif */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
              Total Piutang Aktif
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>

          <div className="mt-4">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatRupiah(metrics.totalActiveReceivables)}
            </p>
            <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              {metrics.countActiveReceivables} catatan pinjaman belum lunas
            </p>
          </div>
        </div>

        {/* KARTU 2: Pendapatan Bunga */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
              Pendapatan Bunga Flat
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
              <Percent className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>

          <div className="mt-4">
            <p className="text-3xl font-extrabold text-indigo-600 tracking-tight">
              {formatRupiah(metrics.totalPotentialInterest)}
            </p>

            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                Terealisasi:
              </span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {formatRupiah(metrics.totalRealizedInterest)}
              </span>
            </div>
          </div>
        </div>

        {/* KARTU 3: Total Utang Aktif */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
              Total Utang Aktif
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
              <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>

          <div className="mt-4">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatRupiah(metrics.totalActivePayables)}
            </p>
            <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
              {metrics.countActivePayables} kewajiban utang berjalan
            </p>
          </div>
        </div>
      </div>

      {/* 3. DAFTAR CATATAN TERBARU & ACTION BAR (Zero-Shadow & Zero-Gradient) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Catatan Transaksi Terbaru
            </h3>
            <p className="text-xs text-slate-500">
              6 transaksi terakhir dengan akses cepat pencatatan pembayaran
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tambah Catatan</span>
            </button>
            <Link
              href="/records"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              <span>Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {recentRecords.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentRecords.map((record) => {
              const isPiutang = record.type === "PIUTANG";

              return (
                <div
                  key={record.id}
                  className="py-4 first:pt-2 last:pb-2 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Info */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                          isPiutang
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {isPiutang ? "Piutang" : "Utang"}
                      </span>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          record.isSettled
                            ? "bg-slate-100 text-slate-700 border-slate-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {record.isSettled ? "Lunas" : "Belum Lunas"}
                      </span>

                      <span className="text-xs text-slate-400">
                        {formatDateIndo(record.transactionDate)}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {record.partyName}
                    </h4>

                    {record.note && (
                      <p className="text-xs text-slate-500 truncate max-w-md">
                        {record.note}
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 pt-1 max-w-sm">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isPiutang ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${record.progressPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {record.progressPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Right: Amounts & Quick Payment Action */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                    <div className="text-left md:text-right">
                      <p className="text-xs text-slate-400">
                        {record.isSettled ? "Total Tagihan" : "Sisa Tagihan"}
                      </p>
                      <p
                        className={`text-sm sm:text-base font-extrabold ${
                          record.isSettled
                            ? "text-slate-700 line-through decoration-slate-300"
                            : isPiutang
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {formatRupiah(
                          record.isSettled ? record.totalAmount : record.remainingAmount
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Pokok: {formatRupiah(record.principal)} • Bunga:{" "}
                        {record.interestRate}%
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedRecordForPayment(record)}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 border ${
                        record.isSettled
                          ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200"
                          : isPiutang
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                          : "bg-rose-600 hover:bg-rose-700 text-white border-rose-600"
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{record.isSettled ? "Detail Bayar" : "Catat Bayar"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Coins className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">Belum Ada Transaksi</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Mulai catat piutang atau utang pertama Anda untuk melihat simulasi bunga dan status
              pembayaran.
            </p>
            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tambah Catatan Sekarang</span>
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <PaymentModal
        record={selectedRecordForPayment}
        isOpen={!!selectedRecordForPayment}
        onClose={() => setSelectedRecordForPayment(null)}
        onSuccess={handleRefresh}
      />

      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
