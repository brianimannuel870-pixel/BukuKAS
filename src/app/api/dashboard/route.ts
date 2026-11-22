import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDashboardMetrics, getRecords } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [metrics, allRecords] = await Promise.all([
      getDashboardMetrics(session.id),
      getRecords(session.id),
    ]);

    // Latest 6 records
    const recentRecords = allRecords.slice(0, 6);

    return NextResponse.json({
      metrics,
      recentRecords,
    });
  } catch (err: any) {
    console.error("Dashboard API error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal memuat data dashboard" },
      { status: 500 }
    );
  }
}
