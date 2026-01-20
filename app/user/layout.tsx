"use client";

import type React from "react";
import { usePathname } from "next/navigation";
import { UserNavbar } from "@/components/user-navbar";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hiddenNavbarRoutes =
    pathname.includes("clinical_trial") ||
    pathname.includes("clinical_analytics") ||
    pathname.includes("drugs");

  return (
    <div className="min-h-screen bg-gray-50">
      {!hiddenNavbarRoutes && <UserNavbar />}
      <main>{children}</main>
    </div>
  );
}
