'use client';

import { useState, useEffect, Suspense } from 'react';
import { ShoppingBag, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Pagination } from '@/components/ui/pagination';
import Link from 'next/link';

interface ProductStockItem {
  _id: string;
  name: string;
  sku: string;
  price: number;
  salePrice?: number;
  stock: number;
  isPublished: boolean;
  images?: string[];
  slug: string;
}

function ShowroomStockContent() {
  const [products, setProducts] = useState<ProductStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const limit = 10;

  const fetchStock = async (page = currentPage) => {
    try {
      setLoading(true);
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const response = await fetch(`/api/showroom/stock?page=${page}&limit=${limit}${searchParam}`);
      if (!response.ok) {
        toast.error(`Failed to fetch stock: ${response.status} ${response.statusText}`);
        return;
      }
      const data = await response.json();
      setProducts(data.products || []);
      setPagination(data.pagination || { total: 0, totalPages: 1 });
    } catch (error) {
      toast.error('An error occurred while fetching stock.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock(1);
    setCurrentPage(1);
  }, [search]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchStock(page);
  };

  return (
    <div className="flex-1 space-y-6 py-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Showroom Stock</h2>
          <p className="text-muted-foreground text-xs md:text-sm">
            আপনার শো-রুমের বর্তমান স্টক ও প্রোডাক্টের বিবরণ দেখুন।
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-sm"
          />
        </div>
      </div>

      {/* Main Stock List */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Showroom Stock</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No products found in this showroom.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product._id}>
                    <TableCell>
                      <div className="h-12 w-12 overflow-hidden rounded-md border bg-muted">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium max-w-[300px] truncate">
                      <Link
                        href={`/product/${product.slug}`}
                        target="_blank"
                        className="hover:text-primary transition-colors hover:underline decoration-primary/30 underline-offset-4"
                      >
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium text-xs text-muted-foreground">{product.sku}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className={product.salePrice ? 'text-xs line-through text-muted-foreground' : 'font-semibold'}>
                          ৳{product.price ? Math.round(product.price) : '0'}
                        </span>
                        {product.salePrice && (
                          <span className="font-bold text-primary">
                            ৳{Math.round(product.salePrice)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-bold text-sm ${(product.stock ?? 0) <= 5 ? 'text-destructive' : 'text-primary'}`}>
                        {product.stock ?? 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.isPublished ? 'default' : 'secondary'} className="text-[10px] font-bold">
                        {product.isPublished ? 'Live' : 'Draft'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-border px-4">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No products found in this showroom.
            </div>
          ) : (
            products.map((product) => {
              const primaryImage = product.images?.[0];
              return (
                <div key={product._id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Image */}
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted">
                      {primaryImage ? (
                        <img
                          src={primaryImage}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {/* Title & Info */}
                    <div className="min-w-0">
                      <Link
                        href={`/product/${product.slug}`}
                        target="_blank"
                        className="font-bold text-xs text-foreground truncate hover:underline block"
                      >
                        {product.name}
                      </Link>
                      <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-medium pt-0.5">
                        <span>SKU: {product.sku || 'N/A'}</span>
                        <span>•</span>
                        <span className={(product.stock ?? 0) <= 5 ? 'text-destructive font-semibold' : ''}>
                          Stock: {product.stock ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] font-bold text-primary">
                          ৳{Math.round(product.salePrice || product.price || 0)}
                        </span>
                        {product.salePrice && (
                          <span className="text-[8px] line-through text-muted-foreground">
                            ৳{Math.round(product.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side Status Badge */}
                  <div className="shrink-0">
                    <Badge variant={product.isPublished ? 'default' : 'secondary'} className="text-[8px] px-1.5 py-0.5 font-bold tracking-tight">
                      {product.isPublished ? 'Live' : 'Draft'}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {!loading && pagination.totalPages > 1 && (
        <div className="py-4">
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}

export default function ShowroomStockPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ShowroomStockContent />
    </Suspense>
  );
}
