import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { addPayment } from "@/lib/db";

const paymentSchema = z.object({
  amount: z.number().positive("Nominal pembayaran harus lebih besar dari 0"),
  paymentDate: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: recordId } = await context.params;
    const body = await request.json();
    const result = paymentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const { amount, paymentDate } = result.data;
    const dateObj = paymentDate ? new Date(paymentDate) : new Date();

    const data = await addPayment(recordId, session.id, amount, dateObj);

    return NextResponse.json({
      success: true,
      message: "Pembayaran berhasil dicatat",
      record: data.record,
      payment: data.payment,
    });
  } catch (err: any) {
    console.error("Payment API error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal mencatat pembayaran" },
      { status: 400 }
    );
  }
}
