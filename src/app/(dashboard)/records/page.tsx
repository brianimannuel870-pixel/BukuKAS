import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getRecords } from "@/lib/db";
import RecordsView from "@/components/RecordsView";


export default async function RecordsPage() {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }

  const records = await getRecords(session.id);

  return (
    <RecordsView
      user={session}
      initialRecords={records}
    />
  );
}
