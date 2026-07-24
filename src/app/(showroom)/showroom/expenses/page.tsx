'use client';

import { useState, useEffect, Suspense } from 'react';
import { Plus, Trash, Edit, Search, Loader2, Info, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TransactionForm } from '@/components/admin/TransactionForm';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

function ShowroomExpensesContent() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/expenses-incomes');
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const data = await res.json();
      setTransactions(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete Expense Entry?',
      text: 'Are you sure you want to delete this expense entry?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/admin/expenses-incomes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Expense deleted');
        fetchTransactions();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Failed to delete expense');
      }
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const term = searchTerm.toLowerCase();
    const title = tx.title?.toLowerCase() || '';
    const category = tx.category?.toLowerCase() || '';
    return title.includes(term) || category.includes(term);
  });

  const totalExpense = filteredTransactions
    .filter(tx => tx.type === 'expense' && tx.status === 'Approved')
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const pendingExpense = filteredTransactions
    .filter(tx => tx.status === 'Pending')
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const fmt = (n: number) => `৳${n.toLocaleString('en-BD')}`;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-500/30 gap-1">
            <CheckCircle2 className="h-3 w-3" /> Approved (Admin Synced)
          </Badge>
        );
      case 'Pending':
        return (
          <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-500/30 gap-1">
            <Clock className="h-3 w-3" /> Pending Admin Approval
          </Badge>
        );
      case 'Rejected':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" /> Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6 py-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Showroom Expenses & Incomes</h2>
          <p className="text-muted-foreground text-sm">
            আপনার শো-রুমের দৈনন্দিন খরচ ও আয়ের তালিকা এন্ট্রি দিন।
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button onClick={() => setEditingTransaction(null)} className="gap-2" />}>
            <Plus className="h-4 w-4" /> Add Expense/Income
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
              </DialogTitle>
            </DialogHeader>
            <TransactionForm
              initialData={editingTransaction}
              onSuccess={() => {
                setIsDialogOpen(false);
                fetchTransactions();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Sync Info Banner */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm flex items-start gap-3">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-sm">অ্যাডমিন সিঙ্ক প্রক্রিয়া (Approval Process)</h4>
          <p className="text-xs text-muted-foreground mt-1">
            শো-রুম ম্যানেজার কর্তৃক যুক্ত করা প্রতিটি নতুন খরচ প্রথমে <strong>Pending Admin Approval</strong> হিসেবে থাকবে। অ্যাডমিন কর্তৃক অনুমোদিত (Approved) হওয়ার পরই তা লেজারে হিসাবভুক্ত হবে এবং অ্যাডমিন ড্যাশবোর্ডে সিঙ্ক হবে।
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">অনুমোদিত খরচ (Approved)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{fmt(totalExpense)}</div>
            <p className="text-xs text-muted-foreground mt-1">অ্যাডমিন কর্তৃক অনুমোদিত মোট খরচ</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">অপেক্ষমান খরচ (Pending)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{fmt(pendingExpense)}</div>
            <p className="text-xs text-muted-foreground mt-1">অ্যাডমিন অনুমোদনের অপেক্ষায়</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">মোট এন্ট্রি সংখ্যা</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTransactions.length}টি</div>
            <p className="text-xs text-muted-foreground mt-1">শো-রুমের মোট লেনদেন</p>
          </CardContent>
        </Card>
      </div>

      {/* Table Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">লেনদেনের ইতিহাস (Transactions)</CardTitle>
              <CardDescription>আপনার শো-রুমের খরচের তালিকা ও অনুমোদন অবস্থা</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search description/category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-muted-foreground text-sm">কোনো লেনদেন পাওয়া যায়নি।</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>তারিখ</TableHead>
                    <TableHead>বিবরণ</TableHead>
                    <TableHead>ক্যাটাগরি</TableHead>
                    <TableHead>টাইপ</TableHead>
                    <TableHead className="text-right">পরিমাণ</TableHead>
                    <TableHead>অবস্থা (Status)</TableHead>
                    <TableHead className="text-right">অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx._id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {tx.date ? format(new Date(tx.date), 'dd MMM yyyy') : '-'}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {tx.title}
                        {tx.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{tx.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-normal">
                          {tx.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={tx.type === 'income' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {tx.type === 'income' ? 'আয় (Income)' : 'খরচ (Expense)'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-semibold text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount || 0)}
                      </TableCell>
                      <TableCell>
                        {statusBadge(tx.status || 'Approved')}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {tx.status === 'Pending' ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setEditingTransaction(tx);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(tx._id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground pr-2">Locked</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ShowroomExpensesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ShowroomExpensesContent />
    </Suspense>
  );
}
