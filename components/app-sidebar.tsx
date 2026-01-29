"use client";

import { Users, Activity, Pill, LayoutDashboard, LogOut, FileText, Shield, CheckCircle, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import Image from "next/image";

// Menu items
const items = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "User List",
    url: "/admin/user-list",
    icon: Users,
  },
  {
    title: "Clinical Trials",
    url: "/admin/therapeutics",
    icon: Activity,
  },
  {
    title: "Activity Logs",
    url: "/admin/activity-logs",
    icon: FileText,
  },
  {
    title: "Role Management",
    url: "/admin/role-management",
    icon: Shield,
  },
  {
    title: "Approvals",
    url: "/admin/approvals",
    icon: CheckCircle,
  },
  {
    title: "Drugs",
    url: "/admin/drugs",
    icon: Pill,
  },
  {
    title: "Dropdown Management",
    url: "/admin/dropdown-management",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    // Add logout logic here
    router.push("/");
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center space-x-2 px-2 py-2">
          <div className="leading-tight">
            <Image
              src="/trialbyte-logo.png"
              alt="Logo"
              width={160}
              height={40}
              className="h-10 w-auto rounded"
            />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-primary-accent hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
