"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  CreditCard,
  CheckCircle2,
  Calendar,
  History,
  Sparkles,
  Loader2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { RecordItem } from "@/types";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { useToast } from "@/components/ToastContext";

interface PaymentModalProps {
  record: RecordItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({
  record,
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const toast = useToast();
  const [amountInput, setAmountInput] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const numericAmount = useMemo(() => {
    const clean = amountInput.replace(/[^0-9]/g, "");
    return clean ? parseInt(clean, 10) : 0;
  }, [amountInput]);

  if (!isOpen || !record) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (!val) {
      setAmountInput("");
      return;
    }
    const num = parseInt(val, 10);
    setAmountInput(new Intl.NumberFormat("id-ID").format(num));
  };

  const handleQuickPayFull = () => {
    setAmountInput(new Intl.NumberFormat("id-ID").format(record.remainingAmount));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (numericAmount <= 0) {
      setErrorMessage("Nominal pembayaran harus lebih besar dari Rp 0");
      return;
    }

    if (numericAmount > record.remainingAmount) {
      setErrorMessage(
        `Nominal pembayaran melebihi sisa tagihan (${formatRupiah(
          record.remainingAmount
        )})`
      );
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/records/${record.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericAmount,
          paymentDate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Gagal mencatat pembayaran");
        return;
      }

      const isNowSettled = numericAmount >= record.remainingAmount;
      if (isNowSettled) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
        toast.success(`Selamat! Tagihan untuk ${record.partyName} telah LUNAS! 🎉`);
      } else {
        toast.success(
          `Pembayaran cicilan ${formatRupiah(numericAmount)} berhasil dicatat!`
        );
      }

      setAmountInput("");
      onSuccess();
      onClose();
    } catch {
      setErrorMessage("Terjadi kesalahan koneksi server");
    } finally {
      setIsLoading(false);
    }
  };

  const isPiutang = record.type === "PIUTANG";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden sm:overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog / Bottom Sheet: max-h-[85vh] (Zero-Shadow & Zero-Gradient) */}
      <div className="relative w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-3xl border border-slate-200 flex flex-col max-h-[85vh] z-10 sm:my-8 animate-in slide-in-from-bottom duration-300 sm:fade-in sm:zoom-in-95 sm:duration-200 overflow-hidden">
        {/* FIXED / STICKY HEADER */}
        <div className="shrink-0 sticky top-0 z-20 bg-white border-b border-slate-200">
          {/* Mobile Drag Indicator Handle */}
          <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

          {/* Header Title & Close Button */}
          <div className="flex items-center justify-between px-5 sm:px-6 pt-2 sm:pt-4 pb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  isPiutang
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : "bg-rose-50 text-rose-600 border-rose-200"
                }`}
              >
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {isPiutang ? "Catat Penerimaan Pembayaran" : "Catat Pembayaran Utang"}
                </h3>
                <p className="text-xs text-slate-500 font-medium truncate max-w-[200px] sm:max-w-[280px]">
                  {record.partyName}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FORM CONTAINER */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* SCROLLABLE BODY */}
          <div className="p-5 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 overscroll-contain">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {/* Status & Progress Summary Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                    isPiutang
                      ? "bg-emerald-100/70 text-emerald-800 border-emerald-200"
                      : "bg-rose-100/70 text-rose-800 border-rose-200"
                  }`}
                >
                  {isPiutang ? "Piutang (Memberi)" : "Utang (Menerima)"}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {record.progressPercent}% Terbayar
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isPiutang ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                  style={{ width: `${record.progressPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <p className="text-[10px] text-slate-400">Total Tagihan</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                    {formatRupiah(record.totalAmount)}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <p className="text-[10px] text-slate-400">Sudah Masuk</p>
                  <p className="text-xs font-bold text-emerald-600 mt-0.5 truncate">
                    {formatRupiah(record.paidAmount)}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <p className="text-[10px] text-slate-400">Sisa Tagihan</p>
                  <p className="text-xs font-bold text-rose-600 mt-0.5 truncate">
                    {formatRupiah(record.remainingAmount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Input Pembayaran (Hanya jika belum lunas) */}
            {!record.isSettled ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Nominal Pembayaran
                    </label>
                    <button
                      type="button"
                      onClick={handleQuickPayFull}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      Bayar Lunas ({formatRupiah(record.remainingAmount)})
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      Rp
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="0"
                      value={amountInput}
                      onChange={handleAmountChange}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Tanggal Pembayaran - iOS Safari datepicker support */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Tanggal Pembayaran
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full min-w-0 max-w-full appearance-none block px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-900">
                    Tagihan Ini Sudah LUNAS Sepenuhnya
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Seluruh kewajiban telah diselesaikan tanpa sisa tunggakan.
                  </p>
                </div>
              </div>
            )}

            {/* Riwayat Pembayaran Sebelumnya */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <History className="w-4 h-4 text-slate-400" />
                Riwayat Pembayaran ({record.payments?.length || 0})
              </div>

              {record.payments && record.payments.length > 0 ? (
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {record.payments.map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                          #{record.payments!.length - idx}
                        </div>
                        <span className="font-semibold text-slate-700">
                          {formatDateIndo(p.paymentDate)}
                        </span>
                      </div>
                      <span className="font-bold text-emerald-600">
                        +{formatRupiah(p.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-2 text-center bg-slate-50 border border-slate-200 rounded-xl">
                  Belum ada catatan pembayaran yang masuk.
                </p>
              )}
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
              {record.isSettled ? "Tutup" : "Batal"}
            </button>

            {!record.isSettled && (
              <button
                type="submit"
                disabled={isLoading || numericAmount <= 0}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? "Memproses..." : "Konfirmasi Pembayaran"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
