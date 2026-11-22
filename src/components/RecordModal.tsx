"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Calculator,
  Calendar,
  User,
  Percent,
  Clock,
  FileText,
  Loader2,
} from "lucide-react";
import { RecordType, RateMode } from "@/types";
import { formatRupiah, calculateFlatInterest } from "@/lib/utils";
import { useToast } from "@/components/ToastContext";

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RecordModal({ isOpen, onClose, onSuccess }: RecordModalProps) {
  const toast = useToast();

  const [type, setType] = useState<RecordType>("PIUTANG");
  const [partyName, setPartyName] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [principalInput, setPrincipalInput] = useState("");
  const [interestRateInput, setInterestRateInput] = useState("0");
  const [rateMode, setRateMode] = useState<RateMode>("PER_BULAN");
  const [tenorMonthsInput, setTenorMonthsInput] = useState("1");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Parse raw inputs
  const numericPrincipal = useMemo(() => {
    const clean = principalInput.replace(/[^0-9]/g, "");
    return clean ? parseInt(clean, 10) : 0;
  }, [principalInput]);

  const numericRate = useMemo(() => {
    const parsed = parseFloat(interestRateInput);
    return isNaN(parsed) ? 0 : parsed;
  }, [interestRateInput]);

  const numericTenor = useMemo(() => {
    const parsed = parseInt(tenorMonthsInput, 10);
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }, [tenorMonthsInput]);

  // Real-time Flat Interest Simulation
  const calculation = useMemo(() => {
    return calculateFlatInterest(numericPrincipal, numericRate, rateMode, numericTenor);
  }, [numericPrincipal, numericRate, rateMode, numericTenor]);

  if (!isOpen) return null;

  const handlePrincipalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (!value) {
      setPrincipalInput("");
      return;
    }
    const num = parseInt(value, 10);
    setPrincipalInput(new Intl.NumberFormat("id-ID").format(num));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!partyName.trim()) {
      setErrorMessage("Nama pihak/peminjam wajib diisi");
      return;
    }

    if (numericPrincipal <= 0) {
      setErrorMessage("Nominal pokok harus lebih dari Rp 0");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          partyName: partyName.trim(),
          transactionDate,
          principal: numericPrincipal,
          interestRate: numericRate,
          rateMode,
          tenorMonths: numericTenor,
          note: note.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Gagal menyimpan catatan");
        return;
      }

      toast.success(
        type === "PIUTANG"
          ? "Catatan Piutang baru berhasil disimpan"
          : "Catatan Utang baru berhasil disimpan"
      );

      // Reset form
      setPartyName("");
      setPrincipalInput("");
      setInterestRateInput("0");
      setRateMode("PER_BULAN");
      setTenorMonthsInput("1");
      setNote("");
      onSuccess();
      onClose();
    } catch {
      setErrorMessage("Terjadi kesalahan koneksi ke server");
    } finally {
      setIsLoading(false);
    }
  };

  const isPiutang = type === "PIUTANG";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden sm:overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal / Bottom Sheet Card: max-h-[85vh] (Zero-Shadow & Zero-Gradient) */}
      <div className="relative w-full max-w-xl bg-white rounded-t-[28px] sm:rounded-3xl border border-slate-200 flex flex-col max-h-[85vh] z-10 sm:my-8 animate-in slide-in-from-bottom duration-300 sm:fade-in sm:zoom-in-95 sm:duration-200 overflow-hidden">
        {/* FIXED / STICKY HEADER */}
        <div className="shrink-0 sticky top-0 z-20 bg-white border-b border-slate-200">
          {/* Mobile Drag Indicator Handle */}
          <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

          {/* Header Title & Close Button */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-3 sm:py-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Catat Transaksi Baru</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FORM CONTAINER */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* SCROLLABLE FORM BODY */}
          <div className="p-5 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 overscroll-contain">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {/* Segmented Toggle: Piutang vs Utang */}
            <div className="p-1 bg-slate-100 rounded-xl grid grid-cols-2 gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setType("PIUTANG")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                  isPiutang
                    ? "bg-white text-emerald-700 border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ArrowUpRight className={`w-4 h-4 ${isPiutang ? "text-emerald-600" : ""}`} />
                Piutang (Memberi)
              </button>
              <button
                type="button"
                onClick={() => setType("UTANG")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                  !isPiutang
                    ? "bg-white text-rose-700 border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ArrowDownLeft className={`w-4 h-4 ${!isPiutang ? "text-rose-600" : ""}`} />
                Utang (Menerima)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama Pihak */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {isPiutang ? "Nama Peminjam / Pelanggan" : "Pemberi Pinjaman / Supplier"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    isPiutang
                      ? "Contoh: Bpk. Ahmad (Toko Makmur)"
                      : "Contoh: CV Maju Logistik Supplier"
                  }
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                />
              </div>

              {/* Tanggal Transaksi - iOS Safari datepicker support */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Tanggal Transaksi
                </label>
                <input
                  type="date"
                  required
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full min-w-0 max-w-full appearance-none block px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                />
              </div>

              {/* Nominal Pokok */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="font-bold text-emerald-600">Rp</span>
                  Nominal Pokok
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="0"
                    value={principalInput}
                    onChange={handlePrincipalChange}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* GRID 2x1: Bunga Flat (%) dan Basis Perhitungan */}
              <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                {/* 1. Bunga Flat (%) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-indigo-500" />
                    Bunga Flat (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={interestRateInput}
                      onChange={(e) => setInterestRateInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      %
                    </span>
                  </div>
                </div>

                {/* 2. Basis Perhitungan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block truncate">
                    Basis Bunga
                  </label>
                  <select
                    value={rateMode}
                    onChange={(e) => setRateMode(e.target.value as RateMode)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white transition"
                  >
                    <option value="PER_BULAN">% / Bulan</option>
                    <option value="TOTAL">% Total Flat</option>
                  </select>
                </div>
              </div>

              {/* Tenor */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Tenor Waktu (Bulan)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={tenorMonthsInput}
                  onChange={(e) => setTenorMonthsInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {/* Keterangan */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Keterangan / Keperluan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Pembelian stok barang atau pinjaman kasbon"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition resize-none"
                />
              </div>
            </div>

            {/* SIMULASI REAL-TIME BUNGA FLAT (Zero-Shadow & Zero-Gradient) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Calculator className="w-4 h-4 text-indigo-600" />
                  Simulasi Bunga Flat
                </div>
                <span className="text-[11px] font-medium text-slate-500">
                  {rateMode === "PER_BULAN"
                    ? `${numericRate}% × ${numericTenor} bln`
                    : `${numericRate}% flat total`}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-medium">Total Bunga</p>
                  <p className="text-xs sm:text-sm font-bold text-indigo-600 mt-0.5 truncate">
                    {formatRupiah(calculation.totalInterest)}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-medium">Cicilan / Bln</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 truncate">
                    {formatRupiah(calculation.monthlyInstallment)}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-medium">Total Tagihan</p>
                  <p
                    className={`text-xs sm:text-sm font-bold mt-0.5 truncate ${
                      isPiutang ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {formatRupiah(calculation.totalAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FIXED / STICKY FOOTER BOTTOM-SHEET */}
          <div className="shrink-0 sticky bottom-0 z-20 bg-white border-t border-slate-200 px-5 sm:px-6 py-3.5 flex items-center justify-end gap-3 safe-area-pb">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? "Menyimpan..." : "Simpan Catatan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
