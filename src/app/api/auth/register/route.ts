import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserByEmail, createUser } from "@/lib/db";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";

const registerSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan gunakan email lain atau langsung masuk." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const newUser = await createUser({
      name,
      email,
      passwordHash,
    });

    const sessionPayload = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      closingDay: newUser.closingDay || 28,
    };

    const token = await createSessionToken(sessionPayload);
    await setSessionCookie(token);

    return NextResponse.json(
      {
        success: true,
        message: "Pendaftaran berhasil",
        user: sessionPayload,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Register API error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal melakukan registrasi" },
      { status: 500 }
    );
  }
}
