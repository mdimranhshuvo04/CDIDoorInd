'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  ShoppingBag, DollarSign, TrendingUp, Package,
  Loader2, AlertTriangle, ArrowRight, Store
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';

function StatCard({ title, value, sub, icon: Icon, color }: {
  title: string; value: string; sub?: string; icon: any; color: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function ShowroomDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/showroom/dashboard/stats')
      .then(res => res.ok ? res.json() : res.json().then(e => Promise.reject(e.message)))
      .then(d => { setData(d); setLoading(false); })
      .catch(err => { setError(typeof err === 'string' ? err : 'Failed to load dashboard'); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-8 w-8" />
          <h3 className="text-xl font-bold">Error</h3>
        </div>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  const fmt = (n: number) => `৳${n.toLocaleString('en-BD')}`;

  return (
    <div className="flex-1 space-y-6 py-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">{data?.showroom?.name || 'My Showroom'}</h2>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            স্বাগতম, {session?.user?.name}! এখানে আপনার শো-রুমের সামারি দেখুন।
          </p>
          {data?.showroom?.address && (
            <p className="text-xs text-muted-foreground">{data.showroom.address}</p>
          )}
        </div>
        <Badge variant="outline" className="self-start md:self-auto text-xs">
          {format(new Date(), 'dd MMM yyyy')}
        </Badge>
      </div>

      {/* Today Stats */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">আজকের সামারি</h3>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          <StatCard
            title="আজকের বিক্রয়"
            value={fmt(data?.today?.sales || 0)}
            sub={`${data?.today?.orders || 0}টি অর্ডার`}
            icon={TrendingUp}
            color="bg-emerald-500"
          />
          <StatCard
            title="আজকের অর্ডার"
            value={`${data?.today?.orders || 0}`}
            sub="মোট অর্ডার সংখ্যা"
            icon={ShoppingBag}
            color="bg-blue-500"
          />
        </div>
      </div>

      {/* This Month Stats */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">এই মাসের সামারি</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="মাসিক বিক্রয়"
            value={fmt(data?.month?.sales || 0)}
            sub={`${data?.month?.orders || 0}টি অর্ডার`}
            icon={TrendingUp}
            color="bg-primary"
          />
          <StatCard
            title="মাসিক খরচ"
            value={fmt(data?.month?.expenses || 0)}
            sub="শো-রুমের ব্যয়"
            icon={DollarSign}
            color="bg-rose-500"
          />
          <StatCard
            title="নেট আয়"
            value={fmt((data?.month?.sales || 0) - (data?.month?.expenses || 0))}
            sub="বিক্রয় - খরচ"
            icon={DollarSign}
            color="bg-violet-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">সাম্প্রতিক অর্ডার</CardTitle>
              <CardDescription>শো-রুমের সর্বশেষ ৫টি অর্ডার</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/showroom/orders">সব দেখুন <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data?.recentOrders?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">কোনো অর্ডার নেই</p>
            ) : (
              <div className="space-y-2">
                {data?.recentOrders?.map((order: any) => (
                  <div key={order._id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{order.customerName || order.orderId}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(order.createdAt), 'dd MMM, hh:mm a')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{fmt(order.totalAmount || 0)}</p>
                      <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'} className="text-xs">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">স্টক স্ট্যাটাস</CardTitle>
              <CardDescription>কম স্টক আগে দেখানো হচ্ছে</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/showroom/stock">সব দেখুন <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data?.stockItems?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">কোনো প্রোডাক্ট নেই</p>
            ) : (
              <div className="space-y-2">
                {data?.stockItems?.slice(0, 6).map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                    </div>
                    <Badge
                      variant={item.stock === 0 ? 'destructive' : item.stock < 5 ? 'secondary' : 'default'}
                      className="text-xs"
                    >
                      {item.stock === 0 ? 'আউট অব স্টক' : `${item.stock} পিস`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
