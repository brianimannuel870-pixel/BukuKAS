import { PrismaClient, RecordType, RateMode } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding BukuKAS demo data...");

  const demoEmail = "demo@bukukas.id";
  const passwordHash = await bcrypt.hash("demo1234", 10);

  // Upsert demo user
  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {
      passwordHash,
      closingDay: 28,
    },
    create: {
      email: demoEmail,
      name: "Budi Santoso (Demo BukuKAS)",
      passwordHash,
      closingDay: 28,
    },
  });

  console.log(`Demo user ready: ${user.email} (ID: ${user.id})`);

  // Clear existing demo records to prevent duplicates during re-seeding
  await prisma.payment.deleteMany({
    where: { record: { userId: user.id } },
  });
  await prisma.record.deleteMany({
    where: { userId: user.id },
  });
  await prisma.monthlyClosing.deleteMany({
    where: { userId: user.id },
  });

  // 1. Piutang: Toko Berkah - Pokok 15jt, Bunga 2.5% / bln, Tenor 6 bln
  // Total bunga = 15.000.000 * 2.5% * 6 = 2.250.000, Total = 17.250.000
  // Cicilan per bulan = 2.875.000. Sudah bayar 2 cicilan = 5.750.000
  const record1 = await prisma.record.create({
    data: {
      userId: user.id,
      type: RecordType.PIUTANG,
      partyName: "Toko Berkah (Pak H. Slamet)",
      transactionDate: new Date("2026-10-15T09:00:00Z"),
      principal: 15000000,
      interestRate: 2.5,
      rateMode: RateMode.PER_BULAN,
      tenorMonths: 6,
      totalInterest: 2250000,
      totalAmount: 17250000,
      paidAmount: 5750000,
      note: "Pinjaman modal belanja persediaan stok sembako grosir",
      payments: {
        create: [
          {
            amount: 2875000,
            paymentDate: new Date("2026-11-01T10:00:00Z"),
          },
          {
            amount: 2875000,
            paymentDate: new Date("2026-11-15T14:30:00Z"),
          },
        ],
      },
    },
  });

  // 2. Piutang: Katering Bu Rahma - Pokok 6jt, Bunga 5% Total, Tenor 3 bln
  // Total bunga = 6.000.000 * 5% = 300.000, Total = 6.300.000
  // Sudah bayar 2.100.000
  const record2 = await prisma.record.create({
    data: {
      userId: user.id,
      type: RecordType.PIUTANG,
      partyName: "Ibu Rahma - Dapur Berkah Katering",
      transactionDate: new Date("2026-11-02T08:30:00Z"),
      principal: 6000000,
      interestRate: 5.0,
      rateMode: RateMode.TOTAL,
      tenorMonths: 3,
      totalInterest: 300000,
      totalAmount: 6300000,
      paidAmount: 2100000,
      note: "Talangan pembelian convection oven gas 4 loyang",
      payments: {
        create: [
          {
            amount: 2100000,
            paymentDate: new Date("2026-11-18T11:00:00Z"),
          },
        ],
      },
    },
  });

  // 3. Piutang Lunas: Mas Doni Desain - Pokok 3jt, Bunga 0% Total, Tenor 1 bln (LUNAS)
  const record3 = await prisma.record.create({
    data: {
      userId: user.id,
      type: RecordType.PIUTANG,
      partyName: "Doni Prasetya (Studio Desain)",
      transactionDate: new Date("2026-09-10T11:00:00Z"),
      principal: 3000000,
      interestRate: 0.0,
      rateMode: RateMode.TOTAL,
      tenorMonths: 1,
      totalInterest: 0,
      totalAmount: 3000000,
      paidAmount: 3000000,
      note: "Talangan sewa studio bulanan - LUNAS tepat waktu",
      payments: {
        create: [
          {
            amount: 3000000,
            paymentDate: new Date("2026-10-05T16:00:00Z"),
          },
        ],
      },
    },
  });

  // 4. Utang: CV Sumber Makmur Kemasan - Pokok 8.5jt, Bunga 1.5% / bln, Tenor 2 bln
  // Total bunga = 8.500.000 * 1.5% * 2 = 255.000, Total = 8.755.000
  // Sudah bayar cicilan 1 = 4.377.500
  const record4 = await prisma.record.create({
    data: {
      userId: user.id,
      type: RecordType.UTANG,
      partyName: "CV Sumber Makmur Kemasan",
      transactionDate: new Date("2026-11-10T13:00:00Z"),
      principal: 8500000,
      interestRate: 1.5,
      rateMode: RateMode.PER_BULAN,
      tenorMonths: 2,
      totalInterest: 255000,
      totalAmount: 8755000,
      paidAmount: 4377500,
      note: "Tempo pembayaran order pouch ziplock sablon 5.000 pcs",
      payments: {
        create: [
          {
            amount: 4377500,
            paymentDate: new Date("2026-11-20T09:15:00Z"),
          },
        ],
      },
    },
  });

  // 5. Utang: Koperasi Warga Sejahtera - Pokok 10jt, Bunga 3% Total, Tenor 5 bln
  // Total bunga = 300.000, Total = 10.300.000. Belum bayar
  const record5 = await prisma.record.create({
    data: {
      userId: user.id,
      type: RecordType.UTANG,
      partyName: "Koperasi Pegawai & Warga Sejahtera",
      transactionDate: new Date("2026-11-05T10:00:00Z"),
      principal: 10000000,
      interestRate: 3.0,
      rateMode: RateMode.TOTAL,
      tenorMonths: 5,
      totalInterest: 300000,
      totalAmount: 10300000,
      paidAmount: 0,
      note: "Pembiayaan rak etalase display minimarket baru",
    },
  });

  // Monthly Closing Sample for October 2026
  await prisma.monthlyClosing.create({
    data: {
      userId: user.id,
      period: "2026-10",
      closingDaySetting: 28,
      closedAt: new Date("2026-10-28T23:59:59Z"),
      newReceivables: 18000000,
      incomingPayments: 5875000,
      periodInterest: 2250000,
      endingReceivables: 14375000,
      endingPayables: 0,
    },
  });

  console.log("Demo seed data created successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
