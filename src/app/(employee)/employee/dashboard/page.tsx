'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  DollarSign, CalendarOff, CheckSquare, Clock,
  Loader2, AlertTriangle, ArrowRight, Briefcase, CheckCircle2
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

export default function EmployeeDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/employee/dashboard/stats')
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
  const isMonthly = data?.profile?.employeeType === 'monthly';

  return (
    <div className="flex-1 space-y-6 py-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">স্বাগতম, {session?.user?.name}!</h2>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            আপনার কর্মক্ষেত্রের সামগ্রিক তথ্য এখানে দেখুন।
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {isMonthly ? 'মাসিক কর্মী' : 'চুক্তিভিত্তিক কর্মী'}
          </Badge>
          {data?.profile?.joinedDate && (
            <Badge variant="secondary" className="text-xs">
              যোগদান: {format(new Date(data.profile.joinedDate), 'dd MMM yyyy')}
            </Badge>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      {isMonthly ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            title="এই মাসের বেতন"
            value={fmt(data?.salary?.thisMonth || 0)}
            sub={`বেস স্যালারি: ${fmt(data?.profile?.baseSalary || 0)}`}
            icon={DollarSign}
            color="bg-emerald-500"
          />
          <StatCard
            title="এই মাসের উপস্থিতি"
            value={`${data?.attendance?.presentThisMonth || 0} দিন`}
            sub="চলতি মাসে মোট উপস্থিতি"
            icon={CheckCircle2}
            color="bg-blue-500"
          />
          <div className="col-span-2 md:col-span-1">
            <StatCard
              title="লিভ স্ট্যাটাস"
              value={`${data?.leaves?.approved || 0}টি`}
              sub={`পেন্ডিং রিকোয়েস্ট: ${data?.leaves?.pending || 0}টি`}
              icon={CalendarOff}
              color="bg-amber-500"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            title="এই মাসের পেমেন্ট"
            value={fmt(data?.salary?.thisMonth || 0)}
            sub="কাজের ভিত্তিতে অর্জিত"
            icon={DollarSign}
            color="bg-emerald-500"
          />
          <StatCard
            title="পেন্ডিং টাস্ক"
            value={`${data?.tasks?.pending || 0}`}
            sub="চলমান কাজ"
            icon={Clock}
            color="bg-rose-500"
          />
          <div className="col-span-2 md:col-span-1">
            <StatCard
              title="সম্পন্ন টাস্ক"
              value={`${data?.tasks?.completed || 0}`}
              sub="মোট সম্পন্ন কাজ"
              icon={CheckSquare}
              color="bg-blue-500"
            />
          </div>
        </div>
      )}

      {/* Detail Sections */}
      <div className={`grid grid-cols-1 ${!isMonthly ? 'md:grid-cols-2' : ''} gap-6`}>
        {/* Recent Tasks (Only for Contractual / Task-based) */}
        {!isMonthly && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">সাম্প্রতিক টাস্ক</CardTitle>
                <CardDescription>আপনার অ্যাসাইন করা টাস্কসমূহ</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/employee/tasks">সব দেখুন <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {data?.tasks?.recent?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">কোনো টাস্ক নেই</p>
              ) : (
                <div className="space-y-2">
                  {data?.tasks?.recent?.map((task: any) => (
                    <div key={task._id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        {task.status === 'Completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium line-clamp-1">{task.title}</p>
                          {task.dueDate && (
                            <p className="text-xs text-muted-foreground">Due: {format(new Date(task.dueDate), 'dd MMM')}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={task.status === 'Completed' ? 'default' : 'secondary'} className="text-xs">
                        {task.status === 'Completed' ? 'সম্পন্ন' : 'পেন্ডিং'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Leaves (Shown for Monthly or anyone with leaves) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">লিভ রিকোয়েস্ট</CardTitle>
              <CardDescription>আপনার সাম্প্রতিক ছুটির আবেদনসমূহ</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/employee/leaves">সব দেখুন <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data?.leaves?.recent?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">কোনো লিভ রিকোয়েস্ট নেই</p>
            ) : (
              <div className="space-y-2">
                {data?.leaves?.recent?.map((leave: any) => (
                  <div key={leave._id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium line-clamp-1">{leave.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(leave.startDate), 'dd MMM')} – {format(new Date(leave.endDate), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <Badge
                      variant={leave.status === 'Approved' ? 'default' : leave.status === 'Rejected' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {leave.status === 'Approved' ? 'অনুমোদিত' : leave.status === 'Rejected' ? 'প্রত্যাখ্যাত' : 'পেন্ডিং'}
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
