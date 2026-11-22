"use client";

import React, { useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { RecordItem } from "@/types";
import { useToast } from "@/components/ToastContext";

interface DeleteConfirmModalProps {
  record: RecordItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteConfirmModal({
  record,
  isOpen,
  onClose,
  onSuccess,
}: DeleteConfirmModalProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !record) return null;

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/records/${record.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menghapus catatan");
        return;
      }

      toast.success(`Catatan untuk ${record.partyName} berhasil dihapus`);
      onSuccess();
      onClose();
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden sm:overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal / Bottom Sheet: max-h-[85vh] (Zero-Shadow & Zero-Gradient) */}
      <div className="relative w-full max-w-md bg-white rounded-t-[28px] sm:rounded-3xl border border-slate-200 flex flex-col max-h-[85vh] z-10 animate-in slide-in-from-bottom duration-300 sm:fade-in sm:zoom-in-95 sm:duration-200 overflow-hidden">
        {/* FIXED / STICKY HEADER */}
        <div className="shrink-0 sticky top-0 z-20 bg-white border-b border-slate-200">
          {/* Mobile Drag Indicator Handle */}
          <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

          {/* Header Title & Close Button */}
          <div className="flex items-center justify-between px-5 sm:px-6 pt-2 sm:pt-4 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENT BODY */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin menghapus catatan transaksi atas nama{" "}
            <span className="font-bold text-slate-900">
              &ldquo;{record.partyName}&rdquo;
            </span>
            ? Seluruh riwayat pembayaran yang terkait juga akan dihapus permanen dari database.
          </p>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
            Tindakan ini tidak dapat dibatalkan setelah dikonfirmasi.
          </div>
        </div>

        {/* FIXED / STICKY FOOTER BOTTOM-SHEET */}
        <div className="shrink-0 sticky bottom-0 z-20 bg-white border-t border-slate-200 px-5 sm:px-6 py-3.5 flex items-center justify-end gap-3 safe-area-pb">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isLoading ? "Menghapus..." : "Ya, Hapus Permanen"}
          </button>
        </div>
      </div>
    </div>
  );
}
