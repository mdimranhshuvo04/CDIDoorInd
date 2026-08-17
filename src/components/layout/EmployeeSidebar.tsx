"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  User,
  DollarSign,
  CalendarOff,
  CheckSquare,
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
    items: [{ title: "Dashboard", url: "/employee/dashboard" }],
  },
  {
    title: "My Profile",
    icon: User,
    items: [
      { title: "Profile Info", url: "/employee/profile" },
      { title: "Change Password", url: "/employee/change-password" },
    ],
  },
  {
    title: "Salary",
    icon: DollarSign,
    items: [{ title: "Salary History", url: "/employee/salary" }],
  },
  {
    title: "Leave",
    icon: CalendarOff,
    items: [{ title: "My Leaves", url: "/employee/leaves" }],
  },
  {
    title: "Tasks",
    icon: CheckSquare,
    items: [{ title: "My Tasks", url: "/employee/tasks" }],
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
      </SidebarMenu>
    </SidebarGroup>
  )
}

export function EmployeeSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const [employeeType, setEmployeeType] = React.useState<'monthly' | 'task-based' | null>(null);

  React.useEffect(() => {
    fetch('/api/employee/dashboard/stats')
      .then(res => res.ok ? res.json() : null)
      .then(d => {
        if (d?.profile?.employeeType) {
          setEmployeeType(d.profile.employeeType);
        }
      })
      .catch(() => { });
  }, []);

  const filteredNavItems = navItems
    .filter((item) => {
      // Hide tasks for permanent monthly employees
      if (item.title === 'Tasks' && employeeType === 'monthly') return false;
      // Hide leaves for contractual task-based employees
      if (item.title === 'Leave' && employeeType === 'task-based') return false;
      return true;
    })
    .map((item) => {
      if (item.title === 'Salary' && employeeType === 'task-based') {
        return {
          ...item,
          title: 'Payments',
          items: [{ title: 'Payout History', url: '/employee/salary' }],
        };
      }
      return item;
    });

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b h-14 lg:h-[60px] px-4 flex items-center">
        <Link href="/employee/dashboard">
          <Logo />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavItems} pathname={pathname} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
