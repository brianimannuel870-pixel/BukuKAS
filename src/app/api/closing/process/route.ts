import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { processMonthlyClosing } from "@/lib/db";

const processClosingSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, "Format periode harus YYYY-MM"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = processClosingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const { period } = result.data;
    const closingRecord = await processMonthlyClosing(session.id, period);

    return NextResponse.json({
      success: true,
      message: `Tutup buku periode ${period} berhasil diproses`,
      closing: closingRecord,
    });
  } catch (err: any) {
    console.error("Process closing error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal memproses tutup buku" },
      { status: 500 }
    );
  }
}
