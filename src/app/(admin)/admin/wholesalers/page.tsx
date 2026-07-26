'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2,
  X,
  Phone,
  Mail,
  Calendar,
  ShieldAlert,
  MoreVertical,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

interface Wholesaler {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  totalDue?: number;
}

export default function AdminWholesalersPage() {
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([]);
  const [loading, setLoading] = useState(true);

  // Register Wholesaler Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPhone, setFormPhone] = useState('');

  // Edit Wholesaler Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWholesaler, setEditingWholesaler] = useState<Wholesaler | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const fetchData = async () => {
    // Defer execution to avoid calling setState synchronously within the useEffect hook
    await Promise.resolve();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/wholesalers');
      if (res.ok) {
        const data = await res.json();
        setWholesalers(data.wholesalers || []);
      } else {
        toast.error('Failed to load wholesalers');
      }
    } catch (error) {
      console.error('Error fetching wholesalers:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleRegisterWholesaler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formPassword) {
      toast.error('Name, Email, and Password are required');
      return;
    }
    try {
      const response = await fetch('/api/admin/wholesalers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          password: formPassword,
          phone: formPhone
        })
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Wholesaler registered successfully',
          confirmButtonColor: '#eab308'
        });
        setShowAddModal(false);
        setFormName('');
        setFormEmail('');
        setFormPassword('');
        setFormPhone('');
        fetchData();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to register wholesaler');
      }
    } catch (err) {
      toast.error('Something went wrong');
    }
  };

  const handleRevokeWholesaler = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `This will revoke ${name}'s wholesale account privileges!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Revoke',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/admin/wholesalers/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          toast.success('Wholesaler status revoked successfully');
          fetchData();
        } else {
          const data = await response.json();
          toast.error(data.message || 'Failed to revoke status');
        }
      } catch (err) {
        toast.error('Something went wrong');
      }
    }
  };

  const handleEditWholesaler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWholesaler) return;
    try {
      const response = await fetch(`/api/admin/wholesalers/${editingWholesaler._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          phone: editPhone
        })
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Wholesaler profile updated successfully',
          confirmButtonColor: '#eab308'
        });
        setShowEditModal(false);
        setEditingWholesaler(null);
        fetchData();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update wholesaler');
      }
    } catch (err) {
      toast.error('Something went wrong');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-950">Wholesalers Directory</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage wholesale buyers, adjust profile parameters, and grant or revoke wholesale purchasing rights.</p>
        </div>
        <div>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-primary-foreground font-bold flex items-center gap-1.5"
          >
            <UserPlus className="h-4 w-4" /> Register Wholesaler
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <Card className="border border-zinc-200">
          <CardHeader className="bg-zinc-50/50 border-b border-zinc-200 p-5">
            <CardTitle className="text-lg font-black text-zinc-900">Wholesalers List</CardTitle>
            <CardDescription className="text-sm text-zinc-500">List of registered buyers authorized for wholesale pricing plans.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {wholesalers.length === 0 ? (
              <div className="text-center py-16 text-zinc-400">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-60" />
                <p className="font-medium">No wholesalers registered yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold">
                      <th className="p-4">Name</th>
                      <th className="p-4">Contact Information</th>
                      <th className="p-4">Joined Date</th>
                      <th className="p-4">Total Due</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wholesalers.map((w) => (
                      <tr key={w._id} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                        <td className="p-4 font-bold text-zinc-900">
                          {w.name}
                        </td>
                        <td className="p-4 space-y-0.5">
                          <div className="flex items-center gap-1 text-zinc-600">
                            <Mail className="h-3.5 w-3.5" />
                            <span>{w.email}</span>
                          </div>
                          {w.phone && (
                            <div className="flex items-center gap-1 text-zinc-500 text-xs">
                              <Phone className="h-3 w-3" />
                              <span>{w.phone}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-zinc-500">
                          <div className="flex items-center gap-1 text-xs">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{new Date(w.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`font-bold px-2.5 py-1 rounded text-xs inline-block ${(w.totalDue || 0) > 0 ? 'text-red-700 bg-red-50 border border-red-100' : 'text-zinc-500 bg-zinc-50 border border-zinc-200'}`}>
                            ৳{Math.round(w.totalDue || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4 text-zinc-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white border border-zinc-200 shadow-md rounded p-1 min-w-[140px] z-50">
                              <DropdownMenuItem 
                                onClick={() => {
                                  setEditingWholesaler(w);
                                  setEditName(w.name);
                                  setEditEmail(w.email);
                                  setEditPhone(w.phone || '');
                                  setShowEditModal(true);
                                }}
                                className="flex items-center gap-2 cursor-pointer text-zinc-700 hover:bg-zinc-50 p-2 text-xs rounded transition-colors"
                              >
                                <Edit className="h-3.5 w-3.5" /> Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleRevokeWholesaler(w._id, w.name)}
                                className="flex items-center gap-2 cursor-pointer text-red-600 hover:bg-red-50 p-2 text-xs rounded transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Revoke Privilege
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Wholesaler Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white border border-zinc-200 shadow-xl overflow-hidden animate-in fade-in duration-200">
            <CardHeader className="bg-zinc-50 border-b border-zinc-100 p-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black text-zinc-900">Register Wholesaler</CardTitle>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-zinc-400 hover:text-zinc-600 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <form onSubmit={handleRegisterWholesaler}>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="wName">Full Name</Label>
                  <Input 
                    id="wName"
                    required
                    value={formName} 
                    onChange={(e) => setFormName(e.target.value)} 
                    placeholder="e.g. Acme Corporates" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wEmail">Email Address</Label>
                  <Input 
                    id="wEmail"
                    type="email"
                    required
                    value={formEmail} 
                    onChange={(e) => setFormEmail(e.target.value)} 
                    placeholder="e.g. acme@example.com" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wPass">Password</Label>
                  <Input 
                    id="wPass"
                    type="password"
                    required
                    value={formPassword} 
                    onChange={(e) => setFormPassword(e.target.value)} 
                    placeholder="••••••••" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wPhone">Phone Number</Label>
                  <Input 
                    id="wPhone"
                    value={formPhone} 
                    onChange={(e) => setFormPhone(e.target.value)} 
                    placeholder="+880 1700..." 
                  />
                </div>
              </CardContent>
              <div className="p-5 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" className="bg-primary text-primary-foreground font-bold">Register Wholesaler</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      {/* Edit Wholesaler Modal */}
      {showEditModal && editingWholesaler && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white border border-zinc-200 shadow-xl overflow-hidden animate-in fade-in duration-200">
            <CardHeader className="bg-zinc-50 border-b border-zinc-100 p-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black text-zinc-900">Edit Wholesaler Profile</CardTitle>
                <button 
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingWholesaler(null);
                  }}
                  className="text-zinc-400 hover:text-zinc-600 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <form onSubmit={handleEditWholesaler}>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="editWName">Full Name</Label>
                  <Input 
                    id="editWName"
                    required
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)} 
                    placeholder="e.g. Acme Corporates" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editWEmail">Email Address</Label>
                  <Input 
                    id="editWEmail"
                    type="email"
                    required
                    value={editEmail} 
                    onChange={(e) => setEditEmail(e.target.value)} 
                    placeholder="e.g. acme@example.com" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editWPhone">Phone Number</Label>
                  <Input 
                    id="editWPhone"
                    value={editPhone} 
                    onChange={(e) => setEditPhone(e.target.value)} 
                    placeholder="+880 1700..." 
                  />
                </div>
              </CardContent>
              <div className="p-5 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => {
                  setShowEditModal(false);
                  setEditingWholesaler(null);
                }}>Cancel</Button>
                <Button type="submit" className="bg-primary text-primary-foreground font-bold">Save Changes</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
