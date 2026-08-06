'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function EmployeeTabs() {
  const pathname = usePathname();

  const tabs = [
    { name: 'Staff List', href: '/admin/employees' },
    { name: 'Disbursements', href: '/admin/employees/salaries' },
    { name: 'Leave Requests', href: '/admin/employees/leaves' },
    { name: 'Attendance Sheet', href: '/admin/employees/attendance' },
    { name: 'Tasks', href: '/admin/employees/tasks' },
  ];

  return (
    <div className="flex border-b border-zinc-200 mb-6 overflow-x-auto whitespace-nowrap">
      {tabs.map((tab) => {
        // Handle active state
        const isActive = tab.href === '/admin/employees' 
          ? pathname === '/admin/employees' 
          : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={cn(
              "px-5 py-3 text-sm font-bold border-b-2 transition-all hover:text-primary",
              isActive 
                ? "border-primary text-primary" 
                : "border-transparent text-zinc-500 hover:border-zinc-300"
            )}
          >
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}
