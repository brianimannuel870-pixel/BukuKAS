import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getMonthlyClosingPreview } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");

    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      return NextResponse.json(
        { error: "Format periode harus YYYY-MM (contoh: 2026-11)" },
        { status: 400 }
      );
    }

    const preview = await getMonthlyClosingPreview(session.id, period);
    return NextResponse.json({ preview });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Gagal menghitung pratinjau tutup buku" },
      { status: 500 }
    );
  }
}
