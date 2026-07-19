'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
    Clock, 
    CheckCircle2, 
    Truck, 
    Package,
    ChevronRight,
    Loader2,
    FileText,
    AlertCircle,
    Calendar,
    DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { generateInvoicePDF } from '@/lib/invoice-generator';

export default function OrdersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Employee Dashboard States
  const [attendance, setAttendance] = useState<any[]>([]);
  const [checkingInOut, setCheckingInOut] = useState(false);
  const [todayAtt, setTodayAtt] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const userRole = (session?.user as any)?.role;

        if (userRole === 'employee') {
          const [settingsRes, profileRes, attRes] = await Promise.all([
            fetch('/api/settings'),
            fetch('/api/user/profile'),
            fetch('/api/admin/employees/attendance')
          ]);

          if (settingsRes.ok) setSettings(await settingsRes.json());
          if (profileRes.ok) setProfile(await profileRes.json());
          
          if (attRes.ok) {
            const data = await attRes.json();
            const list = data.attendance || [];
            setAttendance(list);
            const todayStr = new Date().toISOString().split('T')[0];
            const todayRec = list.find((a: any) => a.date === todayStr);
            setTodayAtt(todayRec || null);
          }
        } else {
          const [ordersRes, settingsRes, profileRes] = await Promise.all([
            fetch('/api/orders'),
            fetch('/api/settings'),
            fetch('/api/user/profile')
          ]);

          if (ordersRes.ok) {
            const data = await ordersRes.json();
            setOrders(Array.isArray(data) ? data : []);
          } else {
            toast.error(`Failed to load orders: ${ordersRes.statusText || ordersRes.status}`);
          }

          if (settingsRes.ok) setSettings(await settingsRes.json());
          if (profileRes.ok) setProfile(await profileRes.json());
        }
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    if (session?.user) {
      fetchData();
    }
  }, [session]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Order Placed': return 'secondary';
      case 'Confirmed': return 'default';
      case 'Paid': return 'default';
      case 'Ready for Delivery': return 'default';
      case 'Released for Delivery': return 'default';
      case 'Delivered': return 'default';
      case 'Cancelled': return 'outline';
      default: return 'outline';
    }
  };

  const handleCheckInOut = async (action: 'check-in' | 'check-out') => {
    setCheckingInOut(true);
    try {
      const res = await fetch('/api/admin/employees/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        
        const attRes = await fetch('/api/admin/employees/attendance');
        if (attRes.ok) {
          const attData = await attRes.json();
          const list = attData.attendance || [];
          setAttendance(list);
          const todayStr = new Date().toISOString().split('T')[0];
          const todayRec = list.find((a: any) => a.date === todayStr);
          setTodayAtt(todayRec || null);
        }
      } else {
        const err = await res.json();
        toast.error(err.message || 'Action failed');
      }
    } catch (e) {
      toast.error('Something went wrong');
    } finally {
      setCheckingInOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const userRole = (session?.user as any)?.role;

  if (userRole === 'employee') {
    const totalPresent = attendance.filter(a => ['Present', 'Late'].includes(a.status)).length;
    const totalLate = attendance.filter(a => a.status === 'Late').length;

    return (
      <>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Attendance Center</h1>
            <p className="text-sm text-muted-foreground mt-1">Log your daily work hours and check your attendance records.</p>
          </div>
        </div>

        {/* Check In / Out Card */}
        <Card className="border border-zinc-200 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <div className="text-sm text-zinc-400 font-bold uppercase tracking-wider">Today's Work Log</div>
                <div className="text-3xl font-black text-zinc-800">
                  {todayAtt ? (
                    todayAtt.checkOut ? 'Shift Completed' : 'Currently Checked In'
                  ) : (
                    'Not Checked In Yet'
                  )}
                </div>
                <div className="text-sm text-zinc-500">
                  {todayAtt?.checkIn && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-zinc-700">Checked In:</span>
                      <span>{new Date(todayAtt.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {todayAtt.status === 'Late' && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 font-bold border-amber-200">Late Check-in</Badge>
                      )}
                    </div>
                  )}
                  {todayAtt?.checkOut && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-zinc-700">Checked Out:</span>
                      <span>{new Date(todayAtt.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3.5">
                {!todayAtt && (
                  <Button
                    onClick={() => handleCheckInOut('check-in')}
                    disabled={checkingInOut}
                    className="bg-primary text-primary-foreground font-black px-8 py-6 text-base shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2"
                  >
                    Check In
                  </Button>
                )}
                {todayAtt && !todayAtt.checkOut && (
                  <Button
                    onClick={() => handleCheckInOut('check-out')}
                    disabled={checkingInOut}
                    variant="outline"
                    className="border-zinc-200 text-zinc-800 font-black px-8 py-6 text-base shadow-sm flex items-center gap-2"
                  >
                    Check Out
                  </Button>
                )}
                {todayAtt?.checkOut && (
                  <Button
                    disabled
                    className="bg-zinc-100 text-zinc-400 font-black px-8 py-6 text-base cursor-not-allowed flex items-center gap-2"
                  >
                    Shift Ended
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-none shadow-none">
            <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              <div className="text-2xl font-black">{totalPresent} Days</div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Total Days Present</div>
            </CardContent>
          </Card>
          <Card className="bg-amber-500/5 border-none shadow-none">
            <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
              <AlertCircle className="h-6 w-6 text-amber-500" />
              <div className="text-2xl font-black text-amber-600">{totalLate} Days</div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Late Check-ins</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-500/5 border-none shadow-none">
            <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
              <Calendar className="h-6 w-6 text-zinc-500" />
              <div className="text-2xl font-black">{attendance.length} Logs</div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Logged Days</div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance logs list */}
        <div className="rounded-xl border bg-background shadow-sm overflow-hidden mt-6">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold">Date</TableHead>
                <TableHead className="font-bold">Check In Time</TableHead>
                <TableHead className="font-bold">Check Out Time</TableHead>
                <TableHead className="font-bold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-40 text-center text-zinc-400">
                    No logs found. Check in to get started!
                  </TableCell>
                </TableRow>
              ) : (
                attendance.map((log) => (
                  <TableRow key={log._id}>
                    <td className="p-4 font-bold text-zinc-900">{log.date}</td>
                    <td className="p-4 text-zinc-600 font-medium">
                      {log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </td>
                    <td className="p-4 text-zinc-600 font-medium">
                      {log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </td>
                    <td className="p-4">
                      <Badge className="font-bold" variant={log.status === 'Present' ? 'default' : log.status === 'Late' ? 'secondary' : 'destructive'}>
                        {log.status}
                      </Badge>
                    </td>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight">Order History</h1>
        <p className="text-sm text-muted-foreground">{orders.length} total orders found</p>
      </div>

      <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Order ID</TableHead>
              <TableHead className="font-bold">Date</TableHead>
              <TableHead className="font-bold">Items</TableHead>
              <TableHead className="font-bold">Total</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold w-[120px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-2">
                         <Package className="h-8 w-8 text-muted-foreground opacity-20" />
                         <p className="text-muted-foreground">You haven't placed any orders yet.</p>
                    </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order._id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs">#{order?._id?.slice(-8).toUpperCase() || 'N/A'}</TableCell>
                  <TableCell className="text-xs">{order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell className="text-xs">{Array.isArray(order?.items) ? order.items.length : 0} items</TableCell>
                  <TableCell className="font-bold">৳{typeof order?.totalAmount === 'number' ? Math.round(order.totalAmount) : '0'}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={getStatusColor(order.status) as any}>
                        {order.status}
                      </Badge>
                      {order.shippingDetails?.trackingUrl && (
                        <a 
                          href={order.shippingDetails.trackingUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 mt-1"
                        >
                          <Truck className="h-3 w-3" /> Track Parcel
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            title={settings ? "Download Invoice" : "Loading settings..."}
                            disabled={!settings}
                            onClick={() => settings && generateInvoicePDF(order, settings)}
                        >
                            <FileText className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 group"
                            onClick={() => router.push(`/dashboard/orders/${order._id}`)}
                        >
                            Details
                            <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-10">
          <Card className="bg-primary/5 border-none shadow-none">
              <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
                  <Package className="h-6 w-6 text-primary" />
                  <div className="text-2xl font-black">৳{profile?.walletBalance || 0}</div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                    Available Tokens
                  </div>
                  {profile?.isSubscriptionActive ? (
                    <Badge variant="default" className="text-[8px] h-4">Active Subscriber</Badge>
                  ) : (
                    <div className="text-[8px] text-muted-foreground">Inactive</div>
                  )}
              </CardContent>
          </Card>
          <Card className="bg-primary/5 border-none shadow-none">
              <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
                  <Clock className="h-6 w-6 text-primary" />
                  <div className="text-2xl font-black">{orders.filter(o => o.status === 'Pending').length}</div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Pending Orders</div>
              </CardContent>
          </Card>
          <Card className="bg-primary/5 border-none shadow-none">
              <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
                  <Truck className="h-6 w-6 text-primary" />
                  <div className="text-2xl font-black">{orders.filter(o => o.status === 'Shipped').length}</div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Shipped Orders</div>
              </CardContent>
          </Card>
          <Card className="bg-primary/5 border-none shadow-none">
              <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                  <div className="text-2xl font-black">{orders.filter(o => o.status === 'Delivered').length}</div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Delivered Orders</div>
              </CardContent>
          </Card>
      </div>
    </>
  );
}

