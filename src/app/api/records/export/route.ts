import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { exportTransactionsCSV } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const csvData = await exportTransactionsCSV(session.id);
    const filename = `BukuKAS_Transaksi_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse("\uFEFF" + csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Gagal mengunduh CSV" },
      { status: 500 }
    );
  }
}
