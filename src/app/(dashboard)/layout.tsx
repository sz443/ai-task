import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app/app-sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="min-h-screen flex-1">
        <div className="flex w-full flex-col gap-6 px-3 py-6 sm:px-4 lg:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
