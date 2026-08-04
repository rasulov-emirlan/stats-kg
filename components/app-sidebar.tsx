"use client";

import { Activity, BookOpenText, ExternalLink, Table2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const NAV = [
  { href: "/", label: "Пульс", icon: Activity },
  { href: "/glubzhe", label: "Глубже", icon: Table2 },
  { href: "/metodika", label: "Методика", icon: BookOpenText },
];

const SOURCES = [
  { href: "https://avtostat.kg", label: "Автостат — автомобили" },
  { href: "https://stats.kg", label: "Недвижимость и аренда" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader>
        <Link
          href="/"
          className="px-2 py-1.5 text-lg font-bold tracking-tight"
          onClick={() => setOpenMobile(false)}
        >
          STATS.KG
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Разделы</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    render={<Link href={item.href} onClick={() => setOpenMobile(false)} />}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Источники</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SOURCES.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton render={<a href={item.href} target="_blank" rel="noopener" />}>
                    <ExternalLink />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
