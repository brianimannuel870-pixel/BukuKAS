"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  PlusCircle,
  CreditCard,
  Trash2,
  ReceiptText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { RecordItem, UserSession } from "@/types";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import PaymentModal from "./PaymentModal";
import RecordModal from "./RecordModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { useRouter } from "next/navigation";
import { useToast } from "./ToastContext";

interface RecordsViewProps {
  user: UserSession;
  initialRecords: RecordItem[];
}

export default function RecordsView({
  user,
  initialRecords,
}: RecordsViewProps) {
  const router = useRouter();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PIUTANG" | "UTANG">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "BELUM_LUNAS" | "LUNAS">("ALL");

  const [selectedRecordForPayment, setSelectedRecordForPayment] =
    useState<RecordItem | null>(null);
  const [selectedRecordForDelete, setSelectedRecordForDelete] =
    useState<RecordItem | null>(null);
  const [selectedRecordForDetail, setSelectedRecordForDetail] =
    useState<RecordItem | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Pagination State (Maksimal 10 baris per halaman)
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination saat filter atau pencarian berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, statusFilter]);

  const handleRefresh = () => {
    router.refresh();
  };

  // Client-side filtering for ultra-snappy UX
  const filteredRecords = useMemo(() => {
    return initialRecords.filter((record) => {
      // Filter Jenis
      if (typeFilter !== "ALL" && record.type !== typeFilter) {
        return false;
      }
      // Filter Status
      if (statusFilter === "LUNAS" && !record.isSettled) {
        return false;
      }
      if (statusFilter === "BELUM_LUNAS" && record.isSettled) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const partyMatch = record.partyName.toLowerCase().includes(q);
        const noteMatch = record.note ? record.note.toLowerCase().includes(q) : false;
        if (!partyMatch && !noteMatch) return false;
      }
      return true;
    });
  }, [initialRecords, typeFilter, statusFilter, searchQuery]);

  // Pagination calculation (maksimal 10 baris per halaman)
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredRecords.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredRecords, currentPage]);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/records/export");
      if (!res.ok) {
        toast.error("Gagal mengunduh file CSV");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BukuKAS_Transaksi_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("File CSV berhasil diunduh");
    } catch {
      toast.error("Terjadi kesalahan saat mengunduh CSV");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Top Actions (Zero-Shadow & Zero-Gradient) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Riwayat Catatan Transaksi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola pinjaman utang dan piutang dengan pelunasan bertahap
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{isExporting ? "Mengunduh..." : "Ekspor CSV"}</span>
          </button>

          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Catat Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar (Zero-Shadow) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama pihak, peminjam, atau keterangan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
          />
        </div>

        {/* Filter Dropdown (Grid 2x1 Mobile & Desktop - Zero-Shadow & Zero-Gradient) */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Dropdown 1: Jenis Transaksi */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Jenis Transaksi</span>
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "ALL" | "PIUTANG" | "UTANG")}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
            >
              <option value="ALL">Semua Jenis</option>
              <option value="PIUTANG">Piutang (Memberi)</option>
              <option value="UTANG">Utang (Menerima)</option>
            </select>
          </div>

          {/* Dropdown 2: Status Pelunasan */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <ReceiptText className="w-3.5 h-3.5 text-slate-400" />
              <span>Status Pelunasan</span>
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ALL" | "BELUM_LUNAS" | "LUNAS")}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
            >
              <option value="ALL">Semua Status</option>
              <option value="BELUM_LUNAS">Belum Lunas</option>
              <option value="LUNAS">Sudah Lunas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Record List */}
      <div className="space-y-3">
        {paginatedRecords.length > 0 ? (
          paginatedRecords.map((record) => {
            const isPiutang = record.type === "PIUTANG";

            return (
              <React.Fragment key={record.id}>
                {/* A. MOBILE VIEW: KARTU LIST SIMPLE (Dapat di-klik untuk melihat rincian catatan) */}
                <div
                  onClick={() => setSelectedRecordForDetail(record)}
                  className="md:hidden bg-white rounded-2xl p-4 border border-slate-200 active:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                          isPiutang
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {isPiutang ? "Piutang" : "Utang"}
                      </span>

                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${
                          record.isSettled
                            ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {record.isSettled ? "Lunas" : "Belum Lunas"}
                      </span>

                      <span className="text-[10px] text-slate-400">
                        {formatDateIndo(record.transactionDate)}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {record.partyName}
                    </h3>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>Pokok: {formatRupiah(record.principal)}</span>
                      <span>•</span>
                      <span className="text-slate-400">{record.progressPercent}% terbayar</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <p className="text-[10px] text-slate-400">
                        {record.isSettled ? "Total Tagihan" : "Sisa Tagihan"}
                      </p>
                      <p
                        className={`text-sm font-extrabold ${
                          record.isSettled
                            ? "text-slate-500 line-through decoration-slate-300"
                            : isPiutang
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {formatRupiah(
                          record.isSettled ? record.totalAmount : record.remainingAmount
                        )}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>

                {/* B. DESKTOP VIEW: KARTU LENGKAP */}
                <div className="hidden md:flex bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 transition-colors flex-col md:flex-row md:items-center justify-between gap-5">
                  {/* Left: Info & Breakdown */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                          isPiutang
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {isPiutang ? "Piutang (Memberi)" : "Utang (Menerima)"}
                      </span>

                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          record.isSettled
                            ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {record.isSettled ? "Lunas" : "Belum Lunas"}
                      </span>

                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateIndo(record.transactionDate)}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 truncate">
                        {record.partyName}
                      </h3>
                      {record.note && (
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {record.note}
                        </p>
                      )}
                    </div>

                    {/* Financial Details Chips */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                        Pokok: <span className="font-bold">{formatRupiah(record.principal)}</span>
                      </div>
                      <div className="px-2.5 py-1 rounded-lg bg-indigo-50/70 border border-indigo-200 text-indigo-800">
                        Bunga:{" "}
                        <span className="font-bold">
                          {record.interestRate}% (
                          {record.rateMode === "PER_BULAN" ? "/ bln" : "total"}) ={" "}
                          {formatRupiah(record.totalInterest)}
                        </span>
                      </div>
                      <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                        Tenor: <span className="font-bold">{record.tenorMonths} Bulan</span>
                      </div>
                    </div>

                    {/* Progress Bar & Settlement Ratio */}
                    <div className="space-y-1.5 pt-1 max-w-md">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">
                          Terbayar:{" "}
                          <span className="font-bold text-emerald-600">
                            {formatRupiah(record.paidAmount)}
                          </span>
                        </span>
                        <span className="font-bold text-slate-700">
                          {record.progressPercent}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isPiutang ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${record.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Sisa Tagihan & Buttons */}
                  <div className="flex flex-col md:items-end justify-between gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                    <div className="text-left md:text-right">
                      <p className="text-xs text-slate-400">
                        {record.isSettled ? "Total Tagihan Lunas" : "Sisa Tagihan"}
                      </p>
                      <p
                        className={`text-xl font-extrabold ${
                          record.isSettled
                            ? "text-slate-500 line-through decoration-slate-300"
                            : isPiutang
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {formatRupiah(
                          record.isSettled ? record.totalAmount : record.remainingAmount
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Total: {formatRupiah(record.totalAmount)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedRecordForPayment(record)}
                        className={`flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 border ${
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

                      <button
                        onClick={() => setSelectedRecordForDelete(record)}
                        aria-label="Hapus catatan"
                        className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <ReceiptText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">Tidak Ada Catatan Ditemukan</h4>
            <p className="text-xs text-slate-400 mt-1">
              Coba sesuaikan kata kunci pencarian atau ubah filter jenis dan status di atas.
            </p>
          </div>
        )}
      </div>

      {/* Pagination Bar (Maksimal 10 Baris per Halaman) */}
      {filteredRecords.length > 0 && (
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Menampilkan{" "}
            <span className="font-bold text-slate-800">
              {(currentPage - 1) * PAGE_SIZE + 1}
            </span>{" "}
            –{" "}
            <span className="font-bold text-slate-800">
              {Math.min(currentPage * PAGE_SIZE, filteredRecords.length)}
            </span>{" "}
            dari{" "}
            <span className="font-bold text-slate-800">
              {filteredRecords.length}
            </span>{" "}
            catatan
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalPages <= 5) return true;
                  return Math.abs(p - currentPage) <= 1 || p === 1 || p === totalPages;
                })
                .map((page, idx, arr) => {
                  const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;
                  return (
                    <React.Fragment key={page}>
                      {showEllipsisBefore && (
                        <span className="px-1 text-xs text-slate-400">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors ${
                          currentPage === page
                            ? "bg-slate-900 text-white"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Record Detail Bottom Sheet (max-h-[85vh], Zero-Shadow & Zero-Gradient) */}
      {selectedRecordForDetail && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedRecordForDetail(null)}
          />
          <div className="relative bg-white rounded-t-[28px] border-t border-slate-200 flex flex-col max-h-[85vh] z-10 animate-in slide-in-from-bottom duration-300 overflow-hidden">
            {/* FIXED HEADER */}
            <div className="shrink-0 sticky top-0 z-20 bg-white border-b border-slate-200">
              <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />
              <div className="flex items-center justify-between px-5 pt-2 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                    <ReceiptText className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Rincian Catatan</h3>
                    <p className="text-[10px] text-slate-400">Detail kalkulasi & pelunasan</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRecordForDetail(null)}
                  className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain">
              {/* Header Info */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                      selectedRecordForDetail.type === "PIUTANG"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {selectedRecordForDetail.type === "PIUTANG"
                      ? "Piutang (Memberi)"
                      : "Utang (Menerima)"}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      selectedRecordForDetail.isSettled
                        ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {selectedRecordForDetail.isSettled ? "Lunas" : "Belum Lunas"}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDateIndo(selectedRecordForDetail.transactionDate)}
                  </span>
                </div>

                <h2 className="text-lg font-extrabold text-slate-900">
                  {selectedRecordForDetail.partyName}
                </h2>
                {selectedRecordForDetail.note && (
                  <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    {selectedRecordForDetail.note}
                  </p>
                )}
              </div>

              {/* Tagihan Highlight Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    {selectedRecordForDetail.isSettled ? "Total Tagihan Lunas" : "Sisa Tagihan"}
                  </span>
                  <p
                    className={`text-2xl font-extrabold tracking-tight mt-0.5 ${
                      selectedRecordForDetail.isSettled
                        ? "text-slate-600 line-through decoration-slate-300"
                        : selectedRecordForDetail.type === "PIUTANG"
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {formatRupiah(
                      selectedRecordForDetail.isSettled
                        ? selectedRecordForDetail.totalAmount
                        : selectedRecordForDetail.remainingAmount
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Total Keseluruhan</span>
                  <span className="text-xs font-bold text-slate-700">
                    {formatRupiah(selectedRecordForDetail.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Progress Bar Pelunasan */}
              <div className="space-y-1.5 p-3.5 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    Terbayar:{" "}
                    <span className="font-bold text-emerald-600">
                      {formatRupiah(selectedRecordForDetail.paidAmount)}
                    </span>
                  </span>
                  <span className="font-bold text-slate-700">
                    {selectedRecordForDetail.progressPercent}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      selectedRecordForDetail.type === "PIUTANG"
                        ? "bg-emerald-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${selectedRecordForDetail.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Rincian Finansial Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-medium uppercase">
                    Pokok Pinjaman
                  </span>
                  <p className="font-bold text-slate-900">
                    {formatRupiah(selectedRecordForDetail.principal)}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-medium uppercase">
                    Bunga Flat
                  </span>
                  <p className="font-bold text-indigo-600">
                    {selectedRecordForDetail.interestRate}% (
                    {selectedRecordForDetail.rateMode === "PER_BULAN" ? "/ bln" : "total"})
                  </p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-medium uppercase">
                    Total Bunga (Rp)
                  </span>
                  <p className="font-bold text-indigo-600">
                    {formatRupiah(selectedRecordForDetail.totalInterest)}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-medium uppercase">
                    Tenor Pinjaman
                  </span>
                  <p className="font-bold text-slate-900">
                    {selectedRecordForDetail.tenorMonths} Bulan
                  </p>
                </div>
              </div>
            </div>

            {/* FIXED FOOTER ACTION BUTTONS */}
            <div className="p-4 border-t border-slate-200 bg-white shrink-0 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedRecordForDelete(selectedRecordForDetail);
                  setSelectedRecordForDetail(null);
                }}
                className="p-3 rounded-xl border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                aria-label="Hapus catatan"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRecordForPayment(selectedRecordForDetail);
                  setSelectedRecordForDetail(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-xs transition-all active:scale-98 ${
                  selectedRecordForDetail.isSettled
                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                    : selectedRecordForDetail.type === "PIUTANG"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-rose-600 hover:bg-rose-700 text-white"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>
                  {selectedRecordForDetail.isSettled ? "Lihat Riwayat Bayar" : "Catat Pembayaran"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

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

      <DeleteConfirmModal
        record={selectedRecordForDelete}
        isOpen={!!selectedRecordForDelete}
        onClose={() => setSelectedRecordForDelete(null)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
