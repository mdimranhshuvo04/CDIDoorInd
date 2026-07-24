"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingBag,
  DollarSign,
  Package,
  Store,
} from "lucide-react"
import { Logo } from "@/components/ui/logo"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronRight } from "lucide-react"

const navItems = [
  {
    title: "Overview",
    icon: LayoutDashboard,
    items: [{ title: "Dashboard", url: "/showroom/dashboard" }],
  },
  {
    title: "My Showroom",
    icon: Store,
    items: [
      { title: "Orders", url: "/showroom/orders" },
      { title: "Sales Entry", url: "/showroom/sales" },
    ],
  },
  {
    title: "Products",
    icon: ShoppingBag,
    items: [{ title: "Showroom Stock", url: "/showroom/stock" }],
  },
  {
    title: "Finance",
    icon: DollarSign,
    items: [{ title: "Expenses", url: "/showroom/expenses" }],
  },
]

function NavMain({ items, pathname }: { items: typeof navItems; pathname: string }) {
  const { setOpenMobile, isMobile } = useSidebar()
  const handleLinkClick = () => { if (isMobile) setOpenMobile(false) }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isParentActive = item.items.some(
            (sub) => pathname === sub.url || pathname.startsWith(sub.url + "/")
          )
          return (
            <Collapsible key={item.title} defaultOpen={isParentActive} className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger render={<SidebarMenuButton tooltip={item.title} isActive={isParentActive} />}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          render={<Link href={subItem.url} onClick={handleLinkClick} />}
                          isActive={pathname === subItem.url || pathname.startsWith(subItem.url + "/")}
                        >
                          <span>{subItem.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export function ShowroomSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b h-14 lg:h-[60px] px-4 flex items-center">
        <Link href="/showroom/dashboard">
          <Logo />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} pathname={pathname} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
