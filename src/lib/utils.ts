import { RateMode } from "@/types";

/**
 * Format angka ke mata uang Rupiah Indonesia (Rp)
 */
export function formatRupiah(value: number): string {
  if (isNaN(value)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format tanggal ke standar Indonesia (contoh: 22 Nov 2026)
 * Resilient terhadap pergeseran timezone (UTC / Local)
 */
export function formatDateIndo(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "-";
  let date: Date;

  if (typeof dateInput === "string") {
    // Jika format hanya tanggal YYYY-MM-DD, parse pada jam 12:00 siang agar aman dari pergeseran timezone
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [year, month, day] = dateInput.split("-").map(Number);
      date = new Date(year, month - 1, day, 12, 0, 0);
    } else {
      date = new Date(dateInput);
    }
  } else {
    date = dateInput;
  }

  if (isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Format tanggal dan waktu ke standar Indonesia (contoh: 22 Nov 2026, 14:30)
 */
export function formatDateTimeIndo(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "-";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Hitung simulasi bunga flat, total tagihan, dan estimasi cicilan per bulan
 */
export function calculateFlatInterest(
  principal: number,
  interestRate: number,
  rateMode: RateMode,
  tenorMonths: number
) {
  const safePrincipal = Math.max(0, principal || 0);
  const safeRate = Math.max(0, interestRate || 0);
  const safeTenor = Math.max(1, tenorMonths || 1);

  let totalInterest = 0;
  if (rateMode === "PER_BULAN") {
    totalInterest = safePrincipal * (safeRate / 100) * safeTenor;
  } else {
    // TOTAL
    totalInterest = safePrincipal * (safeRate / 100);
  }

  // Round to nearest integer for clean currency figures
  totalInterest = Math.round(totalInterest);
  const totalAmount = safePrincipal + totalInterest;
  const monthlyInstallment = Math.round(totalAmount / safeTenor);

  return {
    totalInterest,
    totalAmount,
    monthlyInstallment,
  };
}

/**
 * Hitung bunga yang sudah terealisasi secara proporsional dari pembayaran masuk
 * Bunga Terealisasi = Total Bunga * min(1, Terbayar / Total Tagihan)
 */
export function calculateRealizedInterest(record: {
  totalInterest: number;
  totalAmount: number;
  paidAmount: number;
}): number {
  if (!record.totalAmount || record.totalAmount <= 0) return 0;
  const paymentRatio = Math.min(1, Math.max(0, record.paidAmount / record.totalAmount));
  return Math.round(record.totalInterest * paymentRatio);
}

/**
 * Mendapatkan hari terakhir dari suatu bulan (menangani Februari 28/29, bulan 30 vs 31 hari)
 */
export function getLastDayOfMonth(year: number, monthIndex: number): number {
  // monthIndex 0-11. (year, monthIndex + 1, 0) menghasilkan tanggal terakhir bulan
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Menghitung jadwal tanggal tutup buku berikutnya dan countdown hari tersisa
 */
export function getNextClosingInfo(closingDaySetting: number, referenceDate = new Date()) {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth(); // 0-indexed
  const currentDate = referenceDate.getDate();

  // Pastikan tanggal tidak melebihi hari terakhir bulan ini
  const maxDaysThisMonth = getLastDayOfMonth(currentYear, currentMonth);
  const effectiveDayThisMonth = Math.min(closingDaySetting, maxDaysThisMonth);

  // Jadwal tutup buku bulan berjalan
  const closingThisMonth = new Date(currentYear, currentMonth, effectiveDayThisMonth, 23, 59, 59, 999);

  let nextClosingDate: Date;

  if (referenceDate.getTime() <= closingThisMonth.getTime()) {
    // Belum melewati tutup buku bulan ini
    nextClosingDate = closingThisMonth;
  } else {
    // Sudah lewat, jadwal berikutnya di bulan depan
    const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const nextMonthIndex = currentMonth === 11 ? 0 : currentMonth + 1;
    const maxDaysNextMonth = getLastDayOfMonth(nextMonthYear, nextMonthIndex);
    const effectiveDayNextMonth = Math.min(closingDaySetting, maxDaysNextMonth);

    nextClosingDate = new Date(nextMonthYear, nextMonthIndex, effectiveDayNextMonth, 23, 59, 59, 999);
  }

  // Hitung selisih hari berdasarkan kalender murni (midnight ke midnight)
  const todayMidnight = new Date(currentYear, currentMonth, currentDate).getTime();
  const closingMidnight = new Date(
    nextClosingDate.getFullYear(),
    nextClosingDate.getMonth(),
    nextClosingDate.getDate()
  ).getTime();
  const daysRemaining = Math.max(
    0,
    Math.round((closingMidnight - todayMidnight) / (1000 * 60 * 60 * 24))
  );

  // Format periode YYYY-MM
  const periodMonth = String(nextClosingDate.getMonth() + 1).padStart(2, "0");
  const period = `${nextClosingDate.getFullYear()}-${periodMonth}`;

  return {
    nextClosingDate,
    nextClosingDateFormatted: formatDateIndo(nextClosingDate),
    daysRemaining,
    period,
  };
}
