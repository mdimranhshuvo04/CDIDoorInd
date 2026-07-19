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
import { Plus, Edit, Trash, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Swal from 'sweetalert2';

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

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showrooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No showrooms found.
                </TableCell>
              </TableRow>
            ) : (
              showrooms.map((showroom) => (
                <TableRow key={showroom._id}>
                  <TableCell>
                    {showroom.image ? (
                      <img src={showroom.image} alt={showroom.name} className="h-10 w-16 object-cover rounded-md border" />
                    ) : (
                      <div className="h-10 w-16 bg-muted rounded-md flex items-center justify-center text-[10px] text-muted-foreground">No Img</div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{showroom.name}</TableCell>
                  <TableCell>{showroom.address || 'N/A'}</TableCell>
                  <TableCell>
                    {showroom.manager ? (
                      <div>
                        <p className="font-semibold text-sm">{showroom.manager.name}</p>
                        <p className="text-xs text-muted-foreground">{showroom.manager.email}</p>
                      </div>
                    ) : (
                      <span className="text-destructive text-sm font-semibold">No Manager Assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={showroom.isActive ? 'default' : 'secondary'}>
                      {showroom.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(showroom)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(showroom._id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
                    <FormLabel>Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., /assets/images/showrooms/dhaka.webp" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a manager user" />
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
