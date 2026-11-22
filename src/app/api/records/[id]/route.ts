import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getRecordById, deleteRecord } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const record = await getRecordById(id, session.id);

    if (!record) {
      return NextResponse.json(
        { error: "Catatan transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ record });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Gagal mengambil detail catatan" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    await deleteRecord(id, session.id);

    return NextResponse.json({
      success: true,
      message: "Catatan transaksi berhasil dihapus",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Gagal menghapus catatan" },
      { status: 500 }
    );
  }
}
