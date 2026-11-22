import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getDashboardMetrics, getRecords } from "@/lib/db";
import DashboardView from "@/components/DashboardView";


export default async function DashboardPage() {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }

  const [metrics, records] = await Promise.all([
    getDashboardMetrics(session.id),
    getRecords(session.id),
  ]);

  const recentRecords = records.slice(0, 6);

  return (
    <DashboardView
      user={session}
      metrics={metrics}
      recentRecords={recentRecords}
    />
  );
}
