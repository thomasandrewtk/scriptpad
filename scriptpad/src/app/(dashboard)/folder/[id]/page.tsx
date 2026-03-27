import { Suspense } from "react";
import { DashboardContent } from "~/app/_components/dashboard/dashboard-content";

export default async function FolderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense>
      <DashboardContent folderId={id} />
    </Suspense>
  );
}
