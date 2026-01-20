"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { LinkPreviewProvider } from "@/components/ui/link-preview-panel";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // Hide sidebar on therapeutic and drug detail pages (but show on edit pages and new pages)
  const isDetailPage = (pathname.includes("/admin/therapeutics/") || pathname.includes("/admin/drugs/")) && 
                       pathname !== "/admin/therapeutics" && 
                       pathname !== "/admin/drugs" && 
                       !pathname.includes("/edit/") &&
                       !pathname.includes("/new/");
  
  if (isDetailPage) {
    return (
      <LinkPreviewProvider>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </LinkPreviewProvider>
    );
  }

  return (
    <LinkPreviewProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <div className="ml-auto text-sm text-muted-foreground">Admin</div>
          </header>
          <div className="p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </LinkPreviewProvider>
  );
}
