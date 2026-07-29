/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit,
  Mail,
  Phone,
  Store,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/ui/image-upload';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ShowroomManagersPage() {
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingManager, setEditingManager] = useState<any>(null);
  
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formImage, setFormImage] = useState('');

  const fetchManagers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/showroom-managers');
      if (res.ok) {
        const data = await res.json();
        setManagers(data.managers || []);
      } else {
        toast.error('Failed to load showroom managers');
      }
    } catch (error) {
      console.error('Error fetching managers:', error);
      toast.error('Failed to load showroom managers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const handleAddOrUpdateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingManager) {
        // Edit Manager
        const response = await fetch(`/api/admin/showroom-managers/${editingManager._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            phone: formPhone,
            image: formImage,
          })
        });

        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Manager details updated successfully',
            confirmButtonColor: '#eab308'
          });
          setEditingManager(null);
          setShowAddModal(false);
          resetForm();
          fetchManagers();
        } else {
          const data = await response.json();
          toast.error(data.message || 'Failed to update manager');
        }
      } else {
        // Create Manager
        if (!formName || !formEmail || !formPassword) {
          toast.error('Name, Email, and Password are required');
          return;
        }

        const response = await fetch('/api/admin/showroom-managers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            email: formEmail,
            password: formPassword,
            phone: formPhone,
            image: formImage,
          })
        });

        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Showroom Manager added successfully',
            confirmButtonColor: '#eab308'
          });
          setShowAddModal(false);
          resetForm();
          fetchManagers();
        } else {
          const data = await response.json();
          toast.error(data.message || 'Failed to add manager');
        }
      }
    } catch (err) {
      toast.error('Something went wrong');
    }
  };

  const handleEditClick = (manager: any) => {
    setEditingManager(manager);
    setFormName(manager.name);
    setFormEmail(manager.email);
    setFormPhone(manager.phone || '');
    setFormImage(manager.image || '');
    setShowAddModal(true);
  };

  const handleRevokeRole = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will revoke their showroom manager status and unassign them from any showrooms!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Revoke',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/admin/showroom-managers/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Revoked!',
            text: 'Showroom Manager status has been revoked.',
            confirmButtonColor: '#eab308'
          });
          fetchManagers();
        } else {
          const data = await response.json();
          toast.error(data.message || 'Failed to revoke manager role');
        }
      } catch (err) {
        toast.error('Something went wrong');
      }
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormPhone('');
    setFormImage('');
    setEditingManager(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Showroom Managers</h1>
          <p className="text-muted-foreground mt-1">Manage and assign showroom managers to different locations.</p>
        </div>
        <Button 
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold flex gap-2"
        >
          <UserPlus className="h-4 w-4" /> Add Showroom Manager
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-yellow-500" />
        </div>
      ) : managers.length === 0 ? (
        <Card className="border-dashed border-2 py-10">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-3">
            <ShieldAlert className="h-12 w-12 text-muted-foreground" />
            <h3 className="font-bold text-lg">No Showroom Managers Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Click the button above to register a new showroom manager.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-muted overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Name</TableHead>
                    <TableHead className="font-bold">Email</TableHead>
                    <TableHead className="font-bold">Phone</TableHead>
                    <TableHead className="font-bold">Assigned Showroom</TableHead>
                    <TableHead className="font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managers.map((manager) => (
                    <TableRow key={manager._id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium py-4">
                        <div className="flex items-center gap-3">
                          {manager.image ? (
                            <img 
                              src={manager.image} 
                              alt={manager.name} 
                              className="h-9 w-9 rounded-full object-cover border border-muted"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                              {manager.name ? manager.name.charAt(0).toUpperCase() : 'M'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-foreground">{manager.name}</div>
                            <div className="text-xs text-muted-foreground">Showroom Manager</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-muted-foreground">{manager.email}</TableCell>
                      <TableCell className="py-4 text-muted-foreground">{manager.phone || 'N/A'}</TableCell>
                      <TableCell className="py-4">
                        <Badge 
                          variant={manager.showroomName === 'Not Assigned' ? 'outline' : 'default'}
                          className={`font-semibold border-none ${
                            manager.showroomName === 'Not Assigned' 
                              ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' 
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {manager.showroomName}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            size="icon" 
                            variant="outline" 
                            onClick={() => handleEditClick(manager)}
                            className="h-8 w-8 hover:bg-muted"
                          >
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="outline" 
                            onClick={() => handleRevokeRole(manager._id)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl border-muted max-h-[90vh] flex flex-col">
            <CardHeader className="pb-4 border-b shrink-0">
              <CardTitle className="text-xl font-bold">
                {editingManager ? 'Edit Manager Details' : 'Add Showroom Manager'}
              </CardTitle>
              <CardDescription>
                {editingManager ? 'Update the details for this manager.' : 'Fill in the details to register a new manager.'}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleAddOrUpdateManager} className="flex flex-col flex-1 overflow-hidden">
              <CardContent className="pt-6 space-y-4 overflow-y-auto flex-1">
                <ImageUpload 
                  aspect="circle" 
                  value={formImage} 
                  onUpload={setFormImage} 
                  label="Profile Photo"
                />

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={formName} 
                    onChange={(e) => setFormName(e.target.value)} 
                    placeholder="e.g. John Doe"
                    required 
                  />
                </div>

                {!editingManager && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={formEmail} 
                        onChange={(e) => setFormEmail(e.target.value)} 
                        placeholder="e.g. john@example.com"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        value={formPassword} 
                        onChange={(e) => setFormPassword(e.target.value)} 
                        placeholder="Min 6 characters"
                        required 
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input 
                    id="phone" 
                    value={formPhone} 
                    onChange={(e) => setFormPhone(e.target.value)} 
                    placeholder="e.g. 017XXXXXXXX" 
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-3 p-6 border-t bg-muted/10 shrink-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                >
                  {editingManager ? 'Update Details' : 'Add Manager'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
