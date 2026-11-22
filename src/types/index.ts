export type RecordType = "PIUTANG" | "UTANG";
export type RateMode = "PER_BULAN" | "TOTAL";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  closingDay: number;
}

export interface PaymentItem {
  id: string;
  recordId: string;
  amount: number;
  paymentDate: string;
  createdAt: string;
}

export interface RecordItem {
  id: string;
  userId: string;
  type: RecordType;
  partyName: string;
  transactionDate: string;
  principal: number;
  interestRate: number;
  rateMode: RateMode;
  tenorMonths: number;
  totalInterest: number;
  totalAmount: number;
  paidAmount: number;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  payments?: PaymentItem[];
  remainingAmount: number;
  progressPercent: number;
  isSettled: boolean;
  monthlyInstallment: number;
}

export interface MonthlyClosingItem {
  id: string;
  userId: string;
  period: string; // YYYY-MM
  closingDaySetting: number;
  closedAt: string;
  newReceivables: number;
  incomingPayments: number;
  periodInterest: number;
  endingReceivables: number;
  endingPayables: number;
}

export interface DashboardMetrics {
  totalActiveReceivables: number;
  countActiveReceivables: number;
  totalPotentialInterest: number;
  totalRealizedInterest: number;
  totalActivePayables: number;
  countActivePayables: number;
  nextClosingDateFormatted: string;
  daysUntilClosing: number;
  currentPeriod: string;
  closingDay: number;
}

export interface MonthlyClosingPreview {
  period: string;
  closingDaySetting: number;
  newReceivables: number;
  incomingPayments: number;
  periodInterest: number;
  endingReceivables: number;
  endingPayables: number;
  alreadyClosed: boolean;
  closedAt?: string | null;
}
