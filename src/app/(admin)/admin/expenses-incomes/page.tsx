'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Trash, Edit, Search, MoreHorizontal, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Pagination } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { useSession } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function ExpensesIncomesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const userRole = (session?.user as any)?.role;
  const isAdmin = ['admin', 'super_admin'].includes(userRole);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const initialType = (searchParams.get('type') as 'all' | 'expense' | 'income') || 'all';
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>(initialType);
  const [statusFilter, setStatusFilter] = useState<'all' | 'Approved' | 'Pending' | 'Rejected'>('all');
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  
  const initialPage = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const [currentPage, setCurrentPage] = useState(initialPage);

  const prevFilters = useRef({ searchTerm, typeFilter, statusFilter, from: dateFilter.from, to: dateFilter.to });

  // Sync state changes and handle page reset when filters change
  useEffect(() => {
    const filtersChanged = 
      prevFilters.current.searchTerm !== searchTerm ||
      prevFilters.current.typeFilter !== typeFilter ||
      prevFilters.current.statusFilter !== statusFilter ||
      prevFilters.current.from !== dateFilter.from ||
      prevFilters.current.to !== dateFilter.to;

    let targetPage = currentPage;
    if (filtersChanged) {
      targetPage = 1;
      setCurrentPage(1);
      prevFilters.current = { searchTerm, typeFilter, statusFilter, from: dateFilter.from, to: dateFilter.to };
    }

    const params = new URLSearchParams(searchParams.toString());
    if (targetPage > 1) {
      params.set('page', targetPage.toString());
    } else {
      params.delete('page');
    }
    if (typeFilter !== 'all') {
      params.set('type', typeFilter);
    } else {
      params.delete('type');
    }
    router.push(`/admin/expenses-incomes?${params.toString()}`);
  }, [currentPage, searchTerm, typeFilter, statusFilter, dateFilter.from, dateFilter.to, searchParams, router]);

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

  const handleUpdateStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      const res = await fetch(`/api/admin/expenses-incomes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(`Transaction status updated to ${status}`);
        fetchTransactions();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Failed to update status');
      }
    } catch (err) {
      toast.error('Something went wrong');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete Transaction?',
      text: 'Are you sure you want to delete this transaction record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/admin/expenses-incomes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Transaction deleted');
        fetchTransactions();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Failed to delete transaction');
      }
    } catch (error) {
      toast.error('Failed to delete transaction');
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const term = searchTerm.toLowerCase();
    const title = tx.title?.toLowerCase() || '';
    const matchesSearch = title.includes(term);

    let matchesDate = true;
    if (dateFilter.from) {
      matchesDate = matchesDate && new Date(tx.date) >= new Date(dateFilter.from + 'T00:00:00');
    }
    if (dateFilter.to) {
      matchesDate = matchesDate && new Date(tx.date) <= new Date(dateFilter.to + 'T23:59:59');
    }

    let matchesType = true;
    if (typeFilter !== 'all') {
      matchesType = (tx.type || 'expense') === typeFilter;
    }

    let matchesStatus = true;
    if (statusFilter !== 'all') {
      matchesStatus = (tx.status || 'Approved') === statusFilter;
    }

    return matchesSearch && matchesDate && matchesType && matchesStatus;
  });

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const overviewTransactions = transactions.filter((tx) => {
    const term = searchTerm.toLowerCase();
    const title = tx.title?.toLowerCase() || '';
    const matchesSearch = title.includes(term);

    let matchesDate = true;
    if (dateFilter.from) {
      matchesDate = matchesDate && new Date(tx.date) >= new Date(dateFilter.from + 'T00:00:00');
    }
    if (dateFilter.to) {
      matchesDate = matchesDate && new Date(tx.date) <= new Date(dateFilter.to + 'T23:59:59');
    }

    return matchesSearch && matchesDate;
  });

  // Totals only include Approved transactions (or old transactions with no status, defaults to Approved)
  const totalIncome = overviewTransactions
    .filter((tx) => tx.type === 'income' && (tx.status === 'Approved' || !tx.status))
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const totalExpense = overviewTransactions
    .filter((tx) => (tx.type === 'expense' || !tx.type) && (tx.status === 'Approved' || !tx.status))
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const isFiltered = !!(dateFilter.from || dateFilter.to || searchTerm || statusFilter !== 'all' || typeFilter !== 'all');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">Expenses & Incomes</h1>
          <p className="text-muted-foreground text-sm">Track ads, rent, salary, sales, investments, and other costs or revenues.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button onClick={() => setEditingTransaction(null)} />}>
            <Plus className="mr-2 h-4 w-4" /> Add Record
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] w-full animate-in fade-in duration-200">
            <DialogHeader>
              <DialogTitle>{editingTransaction ? 'Edit' : 'Add'} Transaction</DialogTitle>
            </DialogHeader>
            <TransactionForm
              initialData={editingTransaction}
              onSuccess={(wasEdit) => {
                if (wasEdit) {
                  setIsDialogOpen(false);
                }
                fetchTransactions();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income (Approved)</CardTitle>
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">৳</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ৳ {totalIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isFiltered ? 'Selected range approved inflow' : 'All-time total approved inflow'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expense (Approved)</CardTitle>
            <div className="h-6 w-6 rounded-full bg-destructive/10 flex items-center justify-center font-bold text-xs text-destructive">৳</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ৳ {totalExpense.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isFiltered ? 'Selected range approved outflow' : 'All-time total approved outflow'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4">
          <CardTitle>All Transactions</CardTitle>
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search title..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={typeFilter} onValueChange={(val: any) => setTypeFilter(val)}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-md border text-sm w-full sm:w-auto">
              <Input
                type="date"
                className="h-8 w-32 border-none bg-transparent focus-visible:ring-0"
                value={dateFilter.from}
                onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
              />
              <span className="text-muted-foreground text-xs">to</span>
              <Input
                type="date"
                className="h-8 w-32 border-none bg-transparent focus-visible:ring-0"
                value={dateFilter.to}
                onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>

            {(dateFilter.from || dateFilter.to || searchTerm || typeFilter !== 'all' || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateFilter({ from: '', to: '' });
                  setSearchTerm('');
                  setTypeFilter('all');
                  setStatusFilter('all');
                }}
                className="text-xs text-muted-foreground hover:text-primary w-full sm:w-auto"
              >
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount (Tk)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <div className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                      Loading transactions...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTransactions.map((tx) => {
                  const isExpense = (tx.type || 'expense') === 'expense';
                  return (
                    <TableRow key={tx._id}>
                      <TableCell>{format(new Date(tx.date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <div className="font-medium">{tx.title}</div>
                        {tx.description && (
                          <div className="text-xs text-muted-foreground mt-0.5 max-w-[300px] break-words">
                            {tx.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {isExpense ? (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30">
                            Expense
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">
                            Income
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {(tx.status === 'Approved' || !tx.status) && (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">
                            Approved
                          </span>
                        )}
                        {tx.status === 'Pending' && (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">
                            Pending
                          </span>
                        )}
                        {tx.status === 'Rejected' && (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30">
                            Rejected
                          </span>
                        )}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {isExpense ? '-' : '+'}৳{tx.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isAdmin && tx.status === 'Pending' && (
                              <>
                                <DropdownMenuItem
                                  className="text-emerald-600 focus:text-emerald-600 font-bold"
                                  onClick={() => handleUpdateStatus(tx._id, 'Approved')}
                                >
                                  <Check className="mr-2 h-4 w-4" /> Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-rose-600 focus:text-rose-600 font-bold"
                                  onClick={() => handleUpdateStatus(tx._id, 'Rejected')}
                                >
                                  <X className="mr-2 h-4 w-4" /> Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {(!isAdmin || tx.status === 'Pending') && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingTransaction(tx);
                                  setIsDialogOpen(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(tx._id)}
                            >
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="py-4 border-t bg-background px-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ExpensesIncomesPage() {
  return (
    <Suspense fallback={<div className="flex h-32 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ExpensesIncomesContent />
    </Suspense>
  );
}
