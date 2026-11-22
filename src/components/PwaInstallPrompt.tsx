"use client";

import React, { useState, useEffect } from "react";
import { Share, PlusSquare, X, Smartphone, ArrowDown } from "lucide-react";

export default function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if running in browser
    if (typeof window === "undefined") return;

    // Check if already running in standalone mode (already installed as PWA)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator && (window.navigator as any).standalone === true);

    if (isStandalone) {
      return; // Already installed, do not show prompt
    }

    // Check if dismissed within the last 7 days
    const dismissedTime = localStorage.getItem("bukukas_pwa_dismissed");
    if (dismissedTime) {
      const daysSinceDismissed =
        (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    const isSafari =
      ua.includes("safari") && !ua.includes("chrome") && !ua.includes("crios") && !ua.includes("fxios");

    if (isIosDevice) {
      setIsIos(true);
      // Show iOS install guide after 2.5 seconds on iOS Safari
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      // Android / Chromium beforeinstallprompt handler
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowPrompt(true);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("bukukas_pwa_dismissed", Date.now().toString());
  };

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 z-50 max-w-md mx-auto animate-in slide-in-from-bottom duration-300">
      <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 safe-area-pb">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/apple-touch-icon.png"
                alt="BukuKAS"
                className="w-8 h-8 rounded-lg"
              />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                Pasang BukuKAS di Layar Utama
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Buka lebih cepat seperti aplikasi native tanpa bilah browser
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Tutup petunjuk"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIos ? (
          /* iOS Safari Specific Guide */
          <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-md bg-slate-800 text-emerald-400 font-bold text-[10px] shrink-0 border border-slate-700">
                1
              </span>
              <span>
                Ketuk tombol <span className="font-semibold text-white">Bagikan (Share)</span>{" "}
                <Share className="inline w-3.5 h-3.5 text-emerald-400 mx-0.5" /> di menu Safari.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-md bg-slate-800 text-emerald-400 font-bold text-[10px] shrink-0 border border-slate-700">
                2
              </span>
              <span>
                Pilih <span className="font-semibold text-white">Tambah ke Layar Utama</span>{" "}
                <PlusSquare className="inline w-3.5 h-3.5 text-emerald-400 mx-0.5" />.
              </span>
            </div>
            <div className="flex items-center justify-center pt-1 text-[11px] text-emerald-400 font-medium gap-1">
              <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
              <span>Tombol Share terletak di bilah bawah Safari</span>
            </div>
          </div>
        ) : (
          /* Android / Chrome One-Click Install */
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Nanti Saja
            </button>
            <button
              onClick={handleAndroidInstall}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Install Sekarang</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
