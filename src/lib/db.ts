import prisma from "./prisma";
import {
  RecordType,
  RateMode,
  RecordItem,
  PaymentItem,
  MonthlyClosingItem,
  DashboardMetrics,
  MonthlyClosingPreview,
} from "@/types";
import {
  calculateFlatInterest,
  calculateRealizedInterest,
  getNextClosingInfo,
  formatDateIndo,
} from "./utils";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

// File-based local persistent fallback when Neon Postgres connection string is still placeholder or unavailable
const LOCAL_DB_PATH = path.join(process.cwd(), ".local-db.json");

interface LocalStore {
  users: Array<{
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    closingDay: number;
    createdAt: string;
    updatedAt: string;
  }>;
  records: Array<{
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
  }>;
  payments: Array<{
    id: string;
    recordId: string;
    amount: number;
    paymentDate: string;
    createdAt: string;
  }>;
  monthlyClosings: Array<{
    id: string;
    userId: string;
    period: string;
    closingDaySetting: number;
    closedAt: string;
    newReceivables: number;
    incomingPayments: number;
    periodInterest: number;
    endingReceivables: number;
    endingPayables: number;
  }>;
}

function getInitialLocalStore(): LocalStore {
  const salt = bcrypt.genSaltSync(10);
  const demoHash = bcrypt.hashSync("demo1234", salt);
  const now = new Date().toISOString();

  return {
    users: [
      {
        id: "usr_demo_01",
        name: "Budi Santoso (Demo)",
        email: "demo@bukukas.id",
        passwordHash: demoHash,
        closingDay: 28,
        createdAt: now,
        updatedAt: now,
      },
    ],
    records: [
      {
        id: "rec_demo_01",
        userId: "usr_demo_01",
        type: "PIUTANG",
        partyName: "Toko Berkah (Pak H. Slamet)",
        transactionDate: "2026-10-15T09:00:00.000Z",
        principal: 15000000,
        interestRate: 2.5,
        rateMode: "PER_BULAN",
        tenorMonths: 6,
        totalInterest: 2250000,
        totalAmount: 17250000,
        paidAmount: 5750000,
        note: "Pinjaman modal belanja stok sembako grosir",
        createdAt: "2026-10-15T09:00:00.000Z",
        updatedAt: "2026-11-15T14:30:00.000Z",
      },
      {
        id: "rec_demo_02",
        userId: "usr_demo_01",
        type: "PIUTANG",
        partyName: "Ibu Rahma - Dapur Berkah Katering",
        transactionDate: "2026-11-02T08:30:00.000Z",
        principal: 6000000,
        interestRate: 5.0,
        rateMode: "TOTAL",
        tenorMonths: 3,
        totalInterest: 300000,
        totalAmount: 6300000,
        paidAmount: 2100000,
        note: "Talangan oven convection gas 4 loyang",
        createdAt: "2026-11-02T08:30:00.000Z",
        updatedAt: "2026-11-18T11:00:00.000Z",
      },
      {
        id: "rec_demo_03",
        userId: "usr_demo_01",
        type: "PIUTANG",
        partyName: "Doni Prasetya (Studio Desain)",
        transactionDate: "2026-09-10T11:00:00.000Z",
        principal: 3000000,
        interestRate: 0.0,
        rateMode: "TOTAL",
        tenorMonths: 1,
        totalInterest: 0,
        totalAmount: 3000000,
        paidAmount: 3000000,
        note: "Talangan sewa studio bulanan - LUNAS tepat waktu",
        createdAt: "2026-09-10T11:00:00.000Z",
        updatedAt: "2026-10-05T16:00:00.000Z",
      },
      {
        id: "rec_demo_04",
        userId: "usr_demo_01",
        type: "UTANG",
        partyName: "CV Sumber Makmur Kemasan",
        transactionDate: "2026-11-10T13:00:00.000Z",
        principal: 8500000,
        interestRate: 1.5,
        rateMode: "PER_BULAN",
        tenorMonths: 2,
        totalInterest: 255000,
        totalAmount: 8755000,
        paidAmount: 4377500,
        note: "Tempo pembayaran order pouch ziplock 5.000 pcs",
        createdAt: "2026-11-10T13:00:00.000Z",
        updatedAt: "2026-11-20T09:15:00.000Z",
      },
      {
        id: "rec_demo_05",
        userId: "usr_demo_01",
        type: "UTANG",
        partyName: "Koperasi Pegawai & Warga Sejahtera",
        transactionDate: "2026-11-05T10:00:00.000Z",
        principal: 10000000,
        interestRate: 3.0,
        rateMode: "TOTAL",
        tenorMonths: 5,
        totalInterest: 300000,
        totalAmount: 10300000,
        paidAmount: 0,
        note: "Pembiayaan rak etalase display minimarket baru",
        createdAt: "2026-11-05T10:00:00.000Z",
        updatedAt: "2026-11-05T10:00:00.000Z",
      },
    ],
    payments: [
      {
        id: "pay_demo_01",
        recordId: "rec_demo_01",
        amount: 2875000,
        paymentDate: "2026-11-01T10:00:00.000Z",
        createdAt: "2026-11-01T10:00:00.000Z",
      },
      {
        id: "pay_demo_02",
        recordId: "rec_demo_01",
        amount: 2875000,
        paymentDate: "2026-11-15T14:30:00.000Z",
        createdAt: "2026-11-15T14:30:00.000Z",
      },
      {
        id: "pay_demo_03",
        recordId: "rec_demo_02",
        amount: 2100000,
        paymentDate: "2026-11-18T11:00:00.000Z",
        createdAt: "2026-11-18T11:00:00.000Z",
      },
      {
        id: "pay_demo_04",
        recordId: "rec_demo_03",
        amount: 3000000,
        paymentDate: "2026-10-05T16:00:00.000Z",
        createdAt: "2026-10-05T16:00:00.000Z",
      },
      {
        id: "pay_demo_05",
        recordId: "rec_demo_04",
        amount: 4377500,
        paymentDate: "2026-11-20T09:15:00.000Z",
        createdAt: "2026-11-20T09:15:00.000Z",
      },
    ],
    monthlyClosings: [
      {
        id: "cls_demo_01",
        userId: "usr_demo_01",
        period: "2026-10",
        closingDaySetting: 28,
        closedAt: "2026-10-28T23:59:59.000Z",
        newReceivables: 18000000,
        incomingPayments: 5875000,
        periodInterest: 2250000,
        endingReceivables: 14375000,
        endingPayables: 0,
      },
    ],
  };
}

function readLocalStore(): LocalStore {
  try {
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      const initial = getInitialLocalStore();
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const raw = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return getInitialLocalStore();
  }
}

function writeLocalStore(store: LocalStore) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("Gagal menyimpan local store:", err);
  }
}

// Cek apakah Neon Postgres dapat dihubungi dan tabel sudah tersedia
let isPostgresAvailable: boolean | null = null;
async function canUsePostgres(): Promise<boolean> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes("npg_samplepassword123") || dbUrl.includes("ep-sample-pooler")) {
    return false;
  }
  if (isPostgresAvailable !== null) return isPostgresAvailable;

  try {
    // Verifikasi apakah tabel users benar-benar ada di database Neon
    await prisma.user.findFirst({ select: { id: true } });
    isPostgresAvailable = true;
    return true;
  } catch {
    isPostgresAvailable = false;
    return false;
  }
}

// -------------------------------------------------------------
// USER OPERATIONS
// -------------------------------------------------------------

export async function getUserByEmail(email: string) {
  const usePg = await canUsePostgres();
  if (usePg) {
    try {
      return await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
    } catch {
      // Fallback
    }
  }

  const store = readLocalStore();
  return store.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function getUserById(id: string) {
  const usePg = await canUsePostgres();
  if (usePg) {
    try {
      return await prisma.user.findUnique({
        where: { id },
      });
    } catch {
      // Fallback
    }
  }

  const store = readLocalStore();
  return store.users.find((u) => u.id === id) || null;
}

export async function createUser(data: { name: string; email: string; passwordHash: string }) {
  const usePg = await canUsePostgres();
  if (usePg) {
    try {
      return await prisma.user.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase(),
          passwordHash: data.passwordHash,
          closingDay: 28,
        },
      });
    } catch {
      // Fallback
    }
  }

  const store = readLocalStore();
  const existing = store.users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
  if (existing) {
    throw new Error("Email sudah terdaftar. Silakan gunakan email lain atau login.");
  }

  const newUser = {
    id: "usr_" + Math.random().toString(36).substring(2, 11),
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash: data.passwordHash,
    closingDay: 28,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.users.push(newUser);
  writeLocalStore(store);
  return newUser;
}

export async function updateUserClosingDay(userId: string, closingDay: number) {
  const day = Math.min(31, Math.max(1, closingDay));
  const usePg = await canUsePostgres();
  if (usePg) {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: { closingDay: day },
      });
    } catch {
      // Fallback
    }
  }

  const store = readLocalStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) throw new Error("Pengguna tidak ditemukan");
  user.closingDay = day;
  user.updatedAt = new Date().toISOString();
  writeLocalStore(store);
  return user;
}

// -------------------------------------------------------------
// RECORD OPERATIONS
// -------------------------------------------------------------

function formatRecordItem(rec: any, payments: any[] = []): RecordItem {
  const remainingAmount = Math.max(0, rec.totalAmount - rec.paidAmount);
  const progressPercent =
    rec.totalAmount > 0
      ? Math.min(100, Math.round((rec.paidAmount / rec.totalAmount) * 100))
      : 100;
  const isSettled = remainingAmount <= 0;
  const monthlyInstallment =
    rec.tenorMonths > 0 ? Math.round(rec.totalAmount / rec.tenorMonths) : rec.totalAmount;

  return {
    id: rec.id,
    userId: rec.userId,
    type: rec.type,
    partyName: rec.partyName,
    transactionDate:
      typeof rec.transactionDate === "string"
        ? rec.transactionDate
        : rec.transactionDate.toISOString(),
    principal: rec.principal,
    interestRate: rec.interestRate,
    rateMode: rec.rateMode,
    tenorMonths: rec.tenorMonths,
    totalInterest: rec.totalInterest,
    totalAmount: rec.totalAmount,
    paidAmount: rec.paidAmount,
    note: rec.note,
    createdAt: typeof rec.createdAt === "string" ? rec.createdAt : rec.createdAt.toISOString(),
    updatedAt: typeof rec.updatedAt === "string" ? rec.updatedAt : rec.updatedAt.toISOString(),
    payments: payments.map((p) => ({
      id: p.id,
      recordId: p.recordId,
      amount: p.amount,
      paymentDate:
        typeof p.paymentDate === "string" ? p.paymentDate : p.paymentDate.toISOString(),
      createdAt: typeof p.createdAt === "string" ? p.createdAt : p.createdAt.toISOString(),
    })),
    remainingAmount,
    progressPercent,
    isSettled,
    monthlyInstallment,
  };
}

export async function getRecords(
  userId: string,
  filters?: {
    type?: string;
    status?: string;
    search?: string;
  }
): Promise<RecordItem[]> {
  const usePg = await canUsePostgres();
  if (usePg) {
    try {
      const where: any = { userId };
      if (filters?.type && (filters.type === "PIUTANG" || filters.type === "UTANG")) {
        where.type = filters.type as RecordType;
      }
      if (filters?.search) {
        where.OR = [
          { partyName: { contains: filters.search, mode: "insensitive" } },
          { note: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      const records = await prisma.record.findMany({
        where,
        include: {
          payments: {
            orderBy: { paymentDate: "desc" },
          },
        },
        orderBy: { transactionDate: "desc" },
      });

      let items = records.map((r) => formatRecordItem(r, r.payments));

      if (filters?.status === "LUNAS") {
        items = items.filter((r) => r.isSettled);
      } else if (filters?.status === "BELUM_LUNAS") {
        items = items.filter((r) => !r.isSettled);
      }

      return items;
    } catch {
      // Fallback
    }
  }

  // Local fallback
  const store = readLocalStore();
  let userRecords = store.records.filter((r) => r.userId === userId);

  if (filters?.type && (filters.type === "PIUTANG" || filters.type === "UTANG")) {
    userRecords = userRecords.filter((r) => r.type === filters.type);
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    userRecords = userRecords.filter(
      (r) =>
        r.partyName.toLowerCase().includes(q) ||
        (r.note && r.note.toLowerCase().includes(q))
    );
  }

  userRecords.sort(
    (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
  );

  let items = userRecords.map((r) => {
    const relatedPayments = store.payments
      .filter((p) => p.recordId === r.id)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    return formatRecordItem(r, relatedPayments);
  });

  if (filters?.status === "LUNAS") {
    items = items.filter((r) => r.isSettled);
  } else if (filters?.status === "BELUM_LUNAS") {
    items = items.filter((r) => !r.isSettled);
  }

  return items;
}

export async function getRecordById(recordId: string, userId: string): Promise<RecordItem | null> {
  const usePg = await canUsePostgres();
  if (usePg) {
    try {
      const record = await prisma.record.findFirst({
        where: { id: recordId, userId },
        include: {
          payments: {
            orderBy: { paymentDate: "desc" },
          },
        },
      });
      if (record) return formatRecordItem(record, record.payments);
    } catch {
      // Fallback
    }
  }

  const store = readLocalStore();
  const record = store.records.find((r) => r.id === recordId && r.userId === userId);
  if (!record) return null;
  const payments = store.payments
    .filter((p) => p.recordId === record.id)
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  return formatRecordItem(record, payments);
}

export async function createRecord(
  userId: string,
  data: {
    type: RecordType;
    partyName: string;
    transactionDate: Date;
    principal: number;
    interestRate: number;
    rateMode: RateMode;
    tenorMonths: number;
    note?: string | null;
  }
): Promise<RecordItem> {
  const calc = calculateFlatInterest(
    data.principal,
    data.interestRate,
    data.rateMode,
    data.tenorMonths
  );

  const usePg = await canUsePostgres();
  if (usePg) {
    try {
      const created = await prisma.record.create({
        data: {
          userId,
          type: data.type,
          partyName: data.partyName.trim(),
          transactionDate: data.transactionDate,
          principal: data.principal,
          interestRate: data.interestRate,
          rateMode: data.rateMode,
          tenorMonths: data.tenorMonths,
          totalInterest: calc.totalInterest,
          totalAmount: calc.totalAmount,
          paidAmount: 0,
          note: data.note?.trim() || null,
        },
        include: { payments: true },
      });
      return formatRecordItem(created, []);
    } catch {
      // Fallback
    }
  }

  const store = readLocalStore();
  const now = new Date().toISOString();
  const newRec = {
    id: "rec_" + Math.random().toString(36).substring(2, 11),
    userId,
    type: data.type,
    partyName: data.partyName.trim(),
    transactionDate: data.transactionDate.toISOString(),
    principal: data.principal,
    interestRate: data.interestRate,
    rateMode: data.rateMode,
    tenorMonths: data.tenorMonths,
    totalInterest: calc.totalInterest,
    totalAmount: calc.totalAmount,
    paidAmount: 0,
    note: data.note?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };

  store.records.push(newRec);
  writeLocalStore(store);
  return formatRecordItem(newRec, []);
}

export async function addPayment(
  recordId: string,
  userId: string,
  amount: number,
  paymentDate: Date
): Promise<{ record: RecordItem; payment: PaymentItem }> {
  if (amount <= 0) {
    throw new Error("Nominal pembayaran harus lebih besar dari 0");
  }

  const usePg = await canUsePostgres();
  if (usePg) {
    try {
      // Eksekusi atomik menggunakan prisma.$transaction
      return await prisma.$transaction(async (tx) => {
        const record = await tx.record.findFirst({
          where: { id: recordId, userId },
        });
        if (!record) {
          throw new Error("Catatan transaksi tidak ditemukan atau tidak memiliki akses");
        }

        const remaining = record.totalAmount - record.paidAmount;
        if (amount > remaining + 0.01) {
          throw new Error(
            `Nominal pembayaran (${amount}) melebihi sisa tagihan (${remaining})`
          );
        }

        const newPaidAmount = Math.min(record.totalAmount, Math.round(record.paidAmount + amount));

        const createdPayment = await tx.payment.create({
          data: {
            recordId: record.id,
            amount: Math.round(amount),
            paymentDate,
          },
        });

        const updatedRecord = await tx.record.update({
          where: { id: record.id },
          data: {
            paidAmount: newPaidAmount,
          },
          include: {
            payments: {
              orderBy: { paymentDate: "desc" },
            },
          },
        });

        return {
          record: formatRecordItem(updatedRecord, updatedRecord.payments),
          payment: {
            id: createdPayment.id,
            recordId: createdPayment.recordId,
            amount: createdPayment.amount,
            paymentDate: createdPayment.paymentDate.toISOString(),
            createdAt: createdPayment.createdAt.toISOString(),
          },
        };
      });
    } catch (e: any) {
      if (
        e.message &&
        (e.message.includes("melebihi") ||
          e.message.includes("tidak ditemukan") ||
          e.message.includes("tidak memiliki akses"))
      ) {
        throw e;
      }
      // Fallback
    }
  }

  // Local fallback with consistency check
  const store = readLocalStore();
  const record = store.records.find((r) => r.id === recordId && r.userId === userId);
  if (!record) {
    throw new Error("Catatan transaksi tidak ditemukan atau tidak memiliki akses");
  }

  const remaining = record.totalAmount - record.paidAmount;
  if (amount > remaining + 0.01) {
    throw new Error(
      `Nominal pembayaran (${amount}) melebihi sisa tagihan (${remaining})`
    );
  }

  const newPaid = Math.min(record.totalAmount, Math.round(record.paidAmount + amount));
  record.paidAmount = newPaid;
  record.updatedAt = new Date().toISOString();

  const now = new Date().toISOString();
  const newPayment = {
    id: "pay_" + Math.random().toString(36).substring(2, 11),
    recordId: record.id,
    amount: Math.round(amount),
    paymentDate: paymentDate.toISOString(),
    createdAt: now,
  };

  store.payments.push(newPayment);
  writeLocalStore(store);

  const payments = store.payments
    .filter((p) => p.recordId === record.id)
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  return {
    record: formatRecordItem(record, payments),
    payment: newPayment,
  };
}

export async function deleteRecord(recordId: string, userId: string): Promise<boolean> {
  const usePg = await canUsePostgres();
  if (usePg) {
    try {
      const record = await prisma.record.findFirst({
        where: { id: recordId, userId },
      });
      if (record) {
        await prisma.record.delete({
          where: { id: recordId },
        });
        return true;
      }
    } catch {
      // Fallback
    }
  }

  const store = readLocalStore();
  const index = store.records.findIndex((r) => r.id === recordId && r.userId === userId);
  if (index === -1) {
    throw new Error("Catatan tidak ditemukan atau Anda tidak memiliki akses");
  }

  store.records.splice(index, 1);
  store.payments = store.payments.filter((p) => p.recordId !== recordId);
  writeLocalStore(store);
  return true;
}

// -------------------------------------------------------------
// DASHBOARD METRICS
// -------------------------------------------------------------

export async function getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
  const user = await getUserById(userId);
  const closingDay = user?.closingDay || 28;
  const closingInfo = getNextClosingInfo(closingDay);

  const records = await getRecords(userId);

  // 1. Total Piutang Aktif: Sisa tagihan dari piutang belum lunas
  const activeReceivables = records.filter(
    (r) => r.type === "PIUTANG" && !r.isSettled
  );
  const totalActiveReceivables = activeReceivables.reduce(
    (acc, cur) => acc + cur.remainingAmount,
    0
  );
  const countActiveReceivables = activeReceivables.length;

  // 2. Pendapatan Bunga:
  // - Total Potensi Bunga dari seluruh piutang
  // - Bunga Terealisasi proporsional dari pembayaran masuk
  let totalPotentialInterest = 0;
  let totalRealizedInterest = 0;

  const allReceivables = records.filter((r) => r.type === "PIUTANG");
  for (const r of allReceivables) {
    totalPotentialInterest += r.totalInterest;
    totalRealizedInterest += calculateRealizedInterest(r);
  }

  // 3. Total Utang Aktif: Sisa kewajiban dari utang belum lunas
  const activePayables = records.filter(
    (r) => r.type === "UTANG" && !r.isSettled
  );
  const totalActivePayables = activePayables.reduce(
    (acc, cur) => acc + cur.remainingAmount,
    0
  );
  const countActivePayables = activePayables.length;

  return {
    totalActiveReceivables,
    countActiveReceivables,
    totalPotentialInterest,
    totalRealizedInterest,
    totalActivePayables,
    countActivePayables,
    nextClosingDateFormatted: closingInfo.nextClosingDateFormatted,
    daysUntilClosing: closingInfo.daysRemaining,
    currentPeriod: closingInfo.period,
    closingDay,
  };
}

// -------------------------------------------------------------
// MONTHLY CLOSING OPERATIONS
// -------------------------------------------------------------

export async function getMonthlyClosingPreview(
  userId: string,
  period: string
): Promise<MonthlyClosingPreview> {
  const user = await getUserById(userId);
  const closingDaySetting = user?.closingDay || 28;

  // Parse YYYY-MM
  const [yearStr, monthStr] = period.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12

  // Start date and end date of this closing period
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const allRecords = await getRecords(userId);

  // New Receivables in this period
  const newReceivablesRecords = allRecords.filter((r) => {
    if (r.type !== "PIUTANG") return false;
    const t = new Date(r.transactionDate).getTime();
    return t >= startDate.getTime() && t <= endDate.getTime();
  });

  const newReceivables = Math.round(
    newReceivablesRecords.reduce((acc, r) => acc + r.principal, 0)
  );
  const periodInterest = Math.round(
    newReceivablesRecords.reduce((acc, r) => acc + r.totalInterest, 0)
  );

  // Incoming Payments in this period
  let incomingPayments = 0;
  for (const r of allRecords) {
    if (r.type === "PIUTANG" && r.payments) {
      for (const p of r.payments) {
        const pt = new Date(p.paymentDate).getTime();
        if (pt >= startDate.getTime() && pt <= endDate.getTime()) {
          incomingPayments += p.amount;
        }
      }
    }
  }

  // Ending Receivables & Payables (cumulative active unpaid up to end of this period)
  let endingReceivables = 0;
  let endingPayables = 0;

  for (const r of allRecords) {
    const t = new Date(r.transactionDate).getTime();
    if (t <= endDate.getTime()) {
      let paymentsUpToEnd = 0;
      if (r.payments) {
        for (const p of r.payments) {
          const pt = new Date(p.paymentDate).getTime();
          if (pt <= endDate.getTime()) {
            paymentsUpToEnd += p.amount;
          }
        }
      }
      const balance = Math.max(0, r.totalAmount - paymentsUpToEnd);
      if (r.type === "PIUTANG") {
        endingReceivables += balance;
      } else {
        endingPayables += balance;
      }
    }
  }

  // Check if already closed
  const existingClosing = await getMonthlyClosingByPeriod(userId, period);

  return {
    period,
    closingDaySetting,
    newReceivables,
    incomingPayments: Math.round(incomingPayments),
    periodInterest,
    endingReceivables: Math.round(endingReceivables),
    endingPayables: Math.round(endingPayables),
    alreadyClosed: !!existingClosing,
    closedAt: existingClosing ? existingClosing.closedAt : null,
  };
}

export async function getMonthlyClosingByPeriod(
  userId: string,
  period: string
): Promise<MonthlyClosingItem | null> {
  const usePg = await canUsePostgres();
  if (usePg) {
    try {
      const closing = await prisma.monthlyClosing.findUnique({
        where: {
          userId_period: {
            userId,
            period,
          },
        },
      });
      if (closing) {
        return {
          ...closing,
          closedAt: closing.closedAt.toISOString(),
        };
      }
    } catch {
      // Fallback
    }
  }

  const store = readLocalStore();
  const closing = store.monthlyClosings.find((c) => c.userId === userId && c.period === period);
  return closing || null;
}

export async function processMonthlyClosing(
  userId: string,
  period: string
): Promise<MonthlyClosingItem> {
  const preview = await getMonthlyClosingPreview(userId, period);
  const now = new Date();

  const usePg = await canUsePostgres();
  if (usePg) {
    try {
      const saved = await prisma.monthlyClosing.upsert({
        where: {
          userId_period: {
            userId,
            period,
          },
        },
        update: {
          closingDaySetting: preview.closingDaySetting,
          closedAt: now,
          newReceivables: preview.newReceivables,
          incomingPayments: preview.incomingPayments,
          periodInterest: preview.periodInterest,
          endingReceivables: preview.endingReceivables,
          endingPayables: preview.endingPayables,
        },
        create: {
          userId,
          period,
          closingDaySetting: preview.closingDaySetting,
          closedAt: now,
          newReceivables: preview.newReceivables,
          incomingPayments: preview.incomingPayments,
          periodInterest: preview.periodInterest,
          endingReceivables: preview.endingReceivables,
          endingPayables: preview.endingPayables,
        },
      });

      return {
        ...saved,
        closedAt: saved.closedAt.toISOString(),
      };
    } catch {
      // Fallback
    }
  }

  const store = readLocalStore();
  const existingIndex = store.monthlyClosings.findIndex(
    (c) => c.userId === userId && c.period === period
  );

  const item: MonthlyClosingItem = {
    id:
      existingIndex !== -1
        ? store.monthlyClosings[existingIndex].id
        : "cls_" + Math.random().toString(36).substring(2, 11),
    userId,
    period,
    closingDaySetting: preview.closingDaySetting,
    closedAt: now.toISOString(),
    newReceivables: preview.newReceivables,
    incomingPayments: preview.incomingPayments,
    periodInterest: preview.periodInterest,
    endingReceivables: preview.endingReceivables,
    endingPayables: preview.endingPayables,
  };

  if (existingIndex !== -1) {
    store.monthlyClosings[existingIndex] = item;
  } else {
    store.monthlyClosings.unshift(item);
  }

  writeLocalStore(store);
  return item;
}

export async function getMonthlyClosings(userId: string): Promise<MonthlyClosingItem[]> {
  const usePg = await canUsePostgres();
  if (usePg) {
    try {
      const list = await prisma.monthlyClosing.findMany({
        where: { userId },
        orderBy: { period: "desc" },
      });
      return list.map((c) => ({
        ...c,
        closedAt: c.closedAt.toISOString(),
      }));
    } catch {
      // Fallback
    }
  }

  const store = readLocalStore();
  return store.monthlyClosings
    .filter((c) => c.userId === userId)
    .sort((a, b) => b.period.localeCompare(a.period));
}

// -------------------------------------------------------------
// CSV EXPORT GENERATOR
// -------------------------------------------------------------

export async function exportTransactionsCSV(userId: string): Promise<string> {
  const records = await getRecords(userId);

  const headers = [
    "ID Transaksi",
    "Tanggal",
    "Pihak / Peminjam",
    "Jenis",
    "Nominal Pokok (Rp)",
    "Bunga Flat (%)",
    "Mode Bunga",
    "Tenor (Bulan)",
    "Total Bunga (Rp)",
    "Total Tagihan (Rp)",
    "Sudah Dibayar (Rp)",
    "Sisa Tagihan (Rp)",
    "Status Pelunasan",
    "Keterangan",
  ];

  const rows = records.map((r) => [
    `"${r.id}"`,
    `"${formatDateIndo(r.transactionDate)}"`,
    `"${(r.partyName || "").replace(/"/g, '""')}"`,
    `"${r.type === "PIUTANG" ? "Piutang (Memberi)" : "Utang (Menerima)"}"`,
    r.principal,
    r.interestRate,
    `"${r.rateMode === "PER_BULAN" ? "% / Bulan" : "% Total"}"`,
    r.tenorMonths,
    r.totalInterest,
    r.totalAmount,
    r.paidAmount,
    r.remainingAmount,
    `"${r.isSettled ? "Lunas" : "Belum Lunas"}"`,
    `"${(r.note || "").replace(/"/g, '""')}"`,
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
}
