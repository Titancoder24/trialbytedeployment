"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DrugFormProvider } from "./context/drug-form-context";

export default function DrugNewLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  
  // Always show sidebar for drug new pages
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <div className="ml-auto text-sm text-muted-foreground">Admin</div>
        </header>
        <div className="p-6">
          <DrugFormProvider>{children}</DrugFormProvider>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
