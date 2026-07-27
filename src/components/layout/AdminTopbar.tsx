"use client";

import { useSession, signOut } from 'next-auth/react';
import { 
  User, 
  LogOut,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TransactionForm } from '@/components/admin/TransactionForm';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminTopbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <div className="flex-1 font-semibold text-lg md:hidden">
          Admin Panel
        </div>
      </div>
      <div className="hidden md:flex flex-1" />
      <div className="flex items-center gap-4">
        <ModeToggle />
        
        {session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger nativeButton={true} render={
              <Button variant="secondary" size="icon" className="rounded-full overflow-hidden border border-primary/20">
                {session.user.image ? (
                  <Image 
                    src={session.user.image} 
                    alt={session.user.name || "Admin"} 
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle user menu</span>
              </Button>
            } />
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none">{session.user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsTransactionDialogOpen(true)} className="cursor-pointer">
                <Plus className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold text-emerald-700 dark:text-emerald-500">Add Transaction</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                variant="destructive"
                onClick={() => signOut({ callbackUrl: window.location.origin })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="secondary" size="icon" className="rounded-full">
            <User className="h-5 w-5" />
            <span className="sr-only">Toggle user menu</span>
          </Button>
        )}
      </div>

      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent className="max-w-md w-full bg-background border shadow-lg rounded-xl z-50 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm onSuccess={() => {
            setIsTransactionDialogOpen(false);
            router.refresh();
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('refresh-dashboard'));
            }
          }} />
        </DialogContent>
      </Dialog>
    </header>
  );
}

