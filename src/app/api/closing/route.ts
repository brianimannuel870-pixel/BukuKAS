import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getMonthlyClosings } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const closings = await getMonthlyClosings(session.id);
    return NextResponse.json({ closings });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Gagal memuat arsip tutup buku" },
      { status: 500 }
    );
  }
}
