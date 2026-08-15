"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingBag,
  User,
  ExternalLink,
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
    items: [{ title: "Dashboard", url: "/wholesaler/dashboard" }],
  },
  {
    title: "My Orders",
    icon: ShoppingBag,
    items: [{ title: "Order History", url: "/wholesaler/orders" }],
  },
  {
    title: "My Account",
    icon: User,
    items: [
      { title: "Profile", url: "/wholesaler/profile" },
      { title: "Change Password", url: "/wholesaler/change-password" },
    ],
  },
]

function NavMain({ items, pathname }: { items: typeof navItems; pathname: string }) {
  const { setOpenMobile, isMobile } = useSidebar()
  const handleLinkClick = () => { if (isMobile) setOpenMobile(false) }

  return (
    <SidebarGroup>
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
        {/* Browse Store - direct link item */}
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="Browse Store" render={<Link href="/shop" />}>
            <ExternalLink className="h-4 w-4" />
            <span>Browse Store</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}

export function WholesalerSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b h-14 lg:h-[60px] px-4 flex items-center">
        <Logo href="/wholesaler/dashboard" />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} pathname={pathname} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
