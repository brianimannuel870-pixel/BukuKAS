import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { updateUserClosingDay } from "@/lib/db";

const settingsSchema = z.object({
  closingDay: z.number().int().min(1, "Tanggal minimal 1").max(31, "Tanggal maksimal 31"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = settingsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const { closingDay } = result.data;
    const updatedUser = await updateUserClosingDay(session.id, closingDay);

    return NextResponse.json({
      success: true,
      message: `Jadwal tutup buku rutin berhasil disimpan ke tanggal ${closingDay}`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        closingDay: updatedUser.closingDay,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Gagal mengubah pengaturan tanggal tutup buku" },
      { status: 500 }
    );
  }
}
