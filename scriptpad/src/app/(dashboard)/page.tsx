import { Suspense } from "react";
import { DashboardContent } from "~/app/_components/dashboard/dashboard-content";

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
