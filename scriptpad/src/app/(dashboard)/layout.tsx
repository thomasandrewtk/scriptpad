import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { Sidebar } from "~/app/_components/sidebar";
import { MobileHeader } from "~/app/_components/mobile-header";
import { Fab } from "~/app/_components/fab";
import { Toaster } from "sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto bg-[var(--color-bg-primary)]">
          {children}
        </main>
      </div>
      <Fab />
      <Toaster
        theme="dark"
        position="bottom-left"
        toastOptions={{
          style: {
            background: "var(--color-surface-elevated)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-primary)",
          },
        }}
      />
    </div>
  );
}
