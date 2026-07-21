'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash, Loader2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Swal from 'sweetalert2';
import { ImageUpload } from '@/components/ui/image-upload';

const showroomSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  address: z.string().optional(),
  image: z.string().optional(),
  manager: z.string().min(1, { message: 'Please select a manager.' }),
  isActive: z.boolean().default(true),
});

type ShowroomFormValues = z.infer<typeof showroomSchema>;

export default function ShowroomsPage() {
  const [showrooms, setShowrooms] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingShowroom, setEditingShowroom] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(showroomSchema),
    defaultValues: {
      name: '',
      address: '',
      image: '',
      manager: '',
      isActive: true,
    },
  });

  const fetchShowrooms = async () => {
    try {
      const response = await fetch('/api/admin/showrooms');
      if (!response.ok) {
        toast.error(`Failed to fetch showrooms: ${response.status}`);
        return;
      }
      const data = await response.json();
      setShowrooms(data.showrooms || []);
    } catch (error) {
      toast.error('Failed to fetch showrooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await fetch('/api/admin/showrooms/managers');
      if (response.ok) {
        const data = await response.json();
        setManagers(data.managers || []);
      }
    } catch (error) {
      console.error('Failed to fetch managers', error);
    }
  };

  useEffect(() => {
    fetchShowrooms();
    fetchManagers();
  }, []);

  const onSubmit = async (values: ShowroomFormValues) => {
    setSubmitting(true);
    try {
      const url = '/api/admin/showrooms';
      const method = editingShowroom ? 'PATCH' : 'POST';
      const payload = editingShowroom 
        ? { id: editingShowroom._id, ...values }
        : values;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(`Showroom ${editingShowroom ? 'updated' : 'created'} successfully`);
        setOpen(false);
        fetchShowrooms();
        form.reset();
        setEditingShowroom(null);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Something went wrong');
      }
    } catch (error) {
      toast.error('Failed to save showroom');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (showroom: any) => {
    setEditingShowroom(showroom);
    form.reset({
      name: showroom.name,
      address: showroom.address || '',
      image: showroom.image || '',
      manager: showroom.manager?._id || showroom.manager || '',
      isActive: showroom.isActive,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You are about to delete this showroom!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch('/api/admin/showrooms', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });

        if (response.ok) {
          Swal.fire('Deleted!', 'Showroom has been deleted.', 'success');
          fetchShowrooms();
        } else {
          const err = await response.json();
          toast.error(err.message || 'Failed to delete');
        }
      } catch (error) {
        toast.error('Failed to delete showroom');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Showrooms</h2>
        <Button onClick={() => {
          setEditingShowroom(null);
          form.reset({ name: '', address: '', image: '', manager: '', isActive: true });
          setOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Add Showroom
        </Button>
      </div>

      {showrooms.length === 0 ? (
        <div className="rounded-md border bg-white p-8 text-center text-muted-foreground">
          No showrooms found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {showrooms.map((showroom) => (
            <div key={showroom._id} className="relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm hover:shadow-md transition-all duration-300">
              {/* Image Section */}
              <div className="relative h-44 w-full bg-muted overflow-hidden">
                {showroom.image ? (
                  <img
                    src={showroom.image}
                    alt={showroom.name}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50 text-muted-foreground text-sm font-medium">
                    No Showroom Image
                  </div>
                )}
                {/* Active/Inactive Badge */}
                <div className="absolute top-3 left-3 z-10">
                  <Badge variant={showroom.isActive ? 'default' : 'secondary'} className="shadow-sm font-semibold">
                    {showroom.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {/* 3-dot Actions Dropdown (Bottom Right) */}
                <div className="absolute bottom-3 right-3 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/95 text-black hover:bg-white shadow-md border border-muted hover:scale-105 active:scale-95 transition-all">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem onClick={() => handleEdit(showroom)} className="cursor-pointer font-medium">
                        <Edit className="mr-2 h-4 w-4 text-muted-foreground" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(showroom._id)} className="cursor-pointer text-destructive focus:text-destructive font-medium">
                        <Trash className="mr-2 h-4 w-4 text-muted-foreground" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Body Content */}
              <div className="flex-1 p-5 space-y-4">
                <div>
                  <Link href={`/showrooms/${showroom._id}`} className="hover:text-primary transition-colors hover:underline">
                    <h3 className="text-base font-bold text-foreground">{showroom.name}</h3>
                  </Link>
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{showroom.address || 'N/A'}</p>
                </div>

                {/* Manager Info */}
                <div className="rounded-lg bg-muted/30 p-3 border border-muted/50">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground block mb-1">Showroom Manager</span>
                  {showroom.manager ? (
                    <div>
                      <p className="font-bold text-sm text-foreground">{showroom.manager.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{showroom.manager.email}</p>
                    </div>
                  ) : (
                    <span className="text-destructive text-xs font-bold">No Manager Assigned</span>
                  )}
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="rounded-lg border bg-card p-3 text-center">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground block mb-0.5">Today's Sales</span>
                    <span className="text-base font-black text-emerald-600">৳{Math.round(showroom.todaySales || 0)}</span>
                  </div>
                  <div className="rounded-lg border bg-card p-3 text-center">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground block mb-0.5">This Month's Sales</span>
                    <span className="text-base font-black text-emerald-600">৳{Math.round(showroom.monthSales || 0)}</span>
                  </div>
                  <div className="rounded-lg border bg-card p-3 text-center">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground block mb-0.5">Today's Cost</span>
                    <span className="text-base font-black text-rose-600">৳{Math.round(showroom.todayCost || 0)}</span>
                  </div>
                  <div className="rounded-lg border bg-card p-3 text-center">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground block mb-0.5">This Month's Cost</span>
                    <span className="text-base font-black text-rose-600">৳{Math.round(showroom.monthCost || 0)}</span>
                  </div>
                  <div className="rounded-lg border bg-card p-3 text-center col-span-2">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground block mb-0.5">Pending for Approval</span>
                    <span className="text-base font-black text-amber-600">৳{Math.round(showroom.pendingCost || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingShowroom ? 'Edit Showroom' : 'Create Showroom'}</DialogTitle>
            <DialogDescription>
              Provide showroom name, address, and select a manager user.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Showroom Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Dhaka Showroom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Mirpur-10, Dhaka" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Showroom Image</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value}
                        onUpload={(url) => field.onChange(url)}
                        aspect="video"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="manager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Manager</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a manager user">
                            {(() => {
                              const mgr = managers.find((m) => m._id === field.value);
                              return mgr ? `${mgr.name} (${mgr.email})` : undefined;
                            })()}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {managers.length === 0 ? (
                          <SelectItem value="none" disabled>No managers found</SelectItem>
                        ) : (
                          managers.map((manager) => (
                            <SelectItem key={manager._id} value={manager._id}>
                              {manager.name} ({manager.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editingShowroom ? 'Save Changes' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
