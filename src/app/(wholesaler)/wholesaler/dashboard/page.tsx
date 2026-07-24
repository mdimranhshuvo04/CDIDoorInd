'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  ShoppingBag, DollarSign, Clock, TrendingUp,
  Loader2, AlertTriangle, ArrowRight, Package, ExternalLink
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

const statusColors: Record<string, string> = {
  Delivered: 'default',
  Cancelled: 'destructive',
  Pending: 'secondary',
  Confirmed: 'secondary',
  Processing: 'secondary',
  Shipped: 'secondary',
};

export default function WholesalerDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/wholesaler/dashboard/stats')
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
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  const fmt = (n: number) => `৳${n.toLocaleString('en-BD')}`;

  return (
    <div className="flex-1 space-y-6 py-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">স্বাগতম, {session?.user?.name}!</h2>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            আপনার পাইকারি অ্যাকাউন্টের সামারি দেখুন।
          </p>
        </div>
        <Button asChild className="self-start md:self-auto">
          <Link href="/shop">
            <ExternalLink className="h-4 w-4 mr-2" />
            পণ্য কিনুন (Wholesale Rate)
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="মোট অর্ডার"
          value={`${data?.stats?.totalOrders || 0}`}
          sub="সব সময়ের মোট"
          icon={ShoppingBag}
          color="bg-blue-500"
        />
        <StatCard
          title="পেন্ডিং অর্ডার"
          value={`${data?.stats?.pendingOrders || 0}`}
          sub="প্রসেসিংয়ে আছে"
          icon={Clock}
          color="bg-amber-500"
        />
        <StatCard
          title="মোট ক্রয়"
          value={fmt(data?.stats?.totalSpent || 0)}
          sub="সব সময়ের মোট"
          icon={DollarSign}
          color="bg-primary"
        />
        <StatCard
          title="এই মাসের ক্রয়"
          value={fmt(data?.stats?.monthSpent || 0)}
          sub="চলতি মাস"
          icon={TrendingUp}
          color="bg-emerald-500"
        />
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">সাম্প্রতিক অর্ডার</CardTitle>
            <CardDescription>আপনার সর্বশেষ ৫টি অর্ডার</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/wholesaler/orders">সব দেখুন <ArrowRight className="h-3 w-3 ml-1" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {data?.recentOrders?.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <Package className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">এখনো কোনো অর্ডার করা হয়নি।</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/shop">প্রথম অর্ডার করুন</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {data?.recentOrders?.map((order: any) => (
                <div key={order._id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">Order #{order.shortId}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(order.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="text-sm font-semibold">{fmt(order.totalAmount || 0)}</p>
                    <Badge variant={(statusColors[order.status] || 'secondary') as any} className="text-xs">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4 flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/10 shrink-0">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">পাইকারি মূল্যে কেনাকাটা</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              আপনি পাবলিক স্টোর থেকে পণ্য কিনতে পারবেন এবং সকল পণ্যে স্বয়ংক্রিয়ভাবে পাইকারি মূল্য প্রযোজ্য হবে। ইনভয়েসেও পাইকারি রেট দেখানো হবে।
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
