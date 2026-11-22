import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import DashboardLayoutClient from "@/components/DashboardLayoutClient";


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();

  if (!session) {
    redirect("/login");
  }

  // Ambil user terbaru untuk mendapatkan setting closingDay terkini
  const dbUser = await getUserById(session.id);
  const activeUser = dbUser
    ? {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        closingDay: dbUser.closingDay || 28,
      }
    : session;

  return (
    <DashboardLayoutClient user={activeUser}>
      {children}
    </DashboardLayoutClient>
  );
}
