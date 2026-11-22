import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { getRecords, createRecord } from "@/lib/db";

const createRecordSchema = z.object({
  type: z.enum(["PIUTANG", "UTANG"]),
  partyName: z.string().min(1, "Nama pihak / peminjam wajib diisi"),
  transactionDate: z.string().min(1, "Tanggal transaksi wajib diisi"),
  principal: z.number().positive("Nominal pokok harus lebih dari 0"),
  interestRate: z.number().min(0, "Bunga tidak boleh negatif"),
  rateMode: z.enum(["PER_BULAN", "TOTAL"]),
  tenorMonths: z.number().int().min(1, "Tenor minimal 1 bulan"),
  note: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const records = await getRecords(session.id, { type, status, search });
    return NextResponse.json({ records });
  } catch (err: any) {
    console.error("GET records error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal mengambil data catatan" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = createRecordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Data input tidak valid" },
        { status: 400 }
      );
    }

    const {
      type,
      partyName,
      transactionDate,
      principal,
      interestRate,
      rateMode,
      tenorMonths,
      note,
    } = result.data;

    const newRecord = await createRecord(session.id, {
      type,
      partyName,
      transactionDate: new Date(transactionDate),
      principal,
      interestRate,
      rateMode,
      tenorMonths,
      note,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Catatan transaksi berhasil disimpan",
        record: newRecord,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST record error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal membuat catatan transaksi" },
      { status: 500 }
    );
  }
}
