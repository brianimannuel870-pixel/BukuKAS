import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getMonthlyClosings, getUserById } from "@/lib/db";
import ClosingView from "@/components/ClosingView";


export default async function ClosingPage() {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }

  const [closings, dbUser] = await Promise.all([
    getMonthlyClosings(session.id),
    getUserById(session.id),
  ]);

  const activeUser = dbUser
    ? {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        closingDay: dbUser.closingDay || 28,
      }
    : session;

  return (
    <ClosingView
      user={activeUser}
      initialClosings={closings}
    />
  );
}
