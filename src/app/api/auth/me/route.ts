import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getUserById } from "@/lib/db";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  // Fetch latest user data from DB to reflect any closingDay changes
  const dbUser = await getUserById(session.id);
  const user = dbUser
    ? {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        closingDay: dbUser.closingDay || 28,
      }
    : session;

  return NextResponse.json({ user });
}
