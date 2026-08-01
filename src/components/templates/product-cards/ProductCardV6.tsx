/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Plus, Heart, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart, clearCart } from '@/store/slices/cartSlice';
import { toggleWishlist } from '@/store/slices/wishlistSlice';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuickViewModal } from './QuickViewModal';
import { fbEvent } from '@/lib/fpixel';
import { ttEvent } from '@/lib/tiktok';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    salePrice?: number;
    images: string[];
    isFeatured?: boolean;
    isNewArrival?: boolean;
    isTrending?: boolean;
    stock: number;
    categories?: any[];
    variants?: any[];
    ratings?: number;
    numReviews?: number;
    sku?: string;
  };
  isFlashSale?: boolean;
  priority?: boolean;
  layout?: string;
}

export default function ProductCardV6({ product: initialProduct, isFlashSale, priority, layout }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { data: session, status } = useSession();
  const wishlist = useAppSelector((state) => state.wishlist.items);
  const isInWishlist = wishlist.includes(initialProduct._id);

  const isWholesaler = (session?.user as any)?.role === 'wholesaler';

  const resolveWholesale = (p: any) => {
    if (!p) return null;
    return {
      ...p,
      price: (isWholesaler && p.wholesalePrice) ? p.wholesalePrice : p.price,
      salePrice: (isWholesaler && p.wholesaleSalePrice) ? p.wholesaleSalePrice : p.salePrice
    };
  };

  const resolvedInitialProduct = resolveWholesale(initialProduct);
  const firstVariant = resolvedInitialProduct.variants && resolvedInitialProduct.variants.length > 0
    ? resolveWholesale(resolvedInitialProduct.variants[0])
    : null;

  const product = firstVariant ? {
    ...resolvedInitialProduct,
    price: firstVariant.price,
    salePrice: firstVariant.salePrice,
    stock: firstVariant.stock ?? resolvedInitialProduct.stock,
    sku: firstVariant.sku ?? resolvedInitialProduct.sku,
    images: firstVariant.image ? [firstVariant.image, ...resolvedInitialProduct.images.filter((img: string) => img !== firstVariant.image)] : resolvedInitialProduct.images
  } : resolvedInitialProduct;

  const hasVariants = product.variants && product.variants.length > 0;

  const [showQuickViewModal, setShowQuickViewModal] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (hasVariants) {
      setShowQuickViewModal(true);
    } else {
      dispatch(addToCart({
        productId: product._id,
        name: product.name,
        price: product.salePrice ?? product.price,
        basePrice: product.price,
        quantity: 1,
        image: product.images?.[0]
      }));

      // Track AddToCart
      const addToCartPayload = {
        content_name: product.name,
        content_category: 'Beauty',
        content_ids: [product._id],
        content_type: 'product',
        value: product.salePrice || product.price,
        currency: 'BDT',
        quantity: 1
      };
      const trackingUser = {
        em: session?.user?.email || undefined,
        ph: (session?.user as any)?.phone || undefined,
        fn: session?.user?.name || undefined
      };
      fbEvent('AddToCart', addToCartPayload, trackingUser);
      ttEvent('AddToCart', addToCartPayload, trackingUser);

      toast.success(`${product.name} added to cart`);
    }
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    if (hasVariants) {
      setShowQuickViewModal(true);
      return;
    }

    // Clear cart first for a clean "Buy Now" experience
    dispatch(clearCart());

    dispatch(addToCart({
      productId: product._id,
      name: product.name,
      price: product.salePrice ?? product.price,
      basePrice: product.price,
      quantity: 1,
      image: product.images?.[0]
    }));

    // Track InitiateCheckout
    const initiateCheckoutPayload = {
      content_name: product.name,
      content_category: 'Beauty',
      content_ids: [product._id],
      content_type: 'product',
      value: product.salePrice || product.price,
      currency: 'BDT',
      quantity: 1
    };
    const trackingUser = {
      em: session?.user?.email || undefined,
      ph: (session?.user as any)?.phone || undefined,
      fn: session?.user?.name || undefined
    };
    fbEvent('InitiateCheckout', initiateCheckoutPayload, trackingUser);
    ttEvent('InitiateCheckout', initiateCheckoutPayload, trackingUser);

    router.push('/checkout');
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (status === 'unauthenticated') {
      toast.error('Please login to add to wishlist');
      return;
    }
    dispatch(toggleWishlist(product._id));

    if (!isInWishlist) {
      // Track AddToWishlist
      const addToWishlistPayload = {
        content_name: product.name,
        content_category: product.categories?.[0]?.name || 'Uncategorized',
        content_ids: [product._id],
        content_type: 'product',
        value: product.salePrice || product.price,
        currency: 'BDT'
      };
      const trackingUser = {
        em: session?.user?.email || undefined,
        ph: (session?.user as any)?.phone || undefined,
        fn: session?.user?.name || undefined
      };
      fbEvent('AddToWishlist', addToWishlistPayload, trackingUser);
      ttEvent('AddToWishlist', addToWishlistPayload, trackingUser);
    }

    toast.success(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const discount = product.salePrice ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0;

  return (
    <div className={`group relative flex flex-col font-jost animate-in fade-in duration-700 ${layout === 'v3' ? 'lg:rounded-sm lg:overflow-hidden lg:border lg:border-border/40 lg:pb-3 lg:bg-card' : ''}`}>
      {/* Image Container */}
      <div className={`relative aspect-square overflow-hidden bg-muted ${layout === 'v3' ? 'lg:rounded-t-sm' : 'rounded-none'}`}>
        <Link href={`/product/${product.slug}`} className="block h-full w-full">
          <div className="relative h-full w-full">
            <Image
              src={product.images?.[0] || '/placeholder.png'}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
            />
          </div>
        </Link>

        {/* Unified Ribbon Badge (Top Left) */}
        {(isFlashSale || discount > 0 || product.isNewArrival || product.isTrending || product.isFeatured) && (
          <div className="absolute top-0 left-0 overflow-hidden w-24 h-24 z-10 pointer-events-none">
            <div className={`absolute top-0 left-0 text-[10px] font-black py-1 w-32 text-center -rotate-45 -translate-x-10 translate-y-4 shadow-lg uppercase tracking-widest ${isFlashSale ? 'bg-orange-600 text-white animate-pulse' :
              discount > 0 ? 'bg-primary text-black dark:text-neutral-900' :
                product.isNewArrival ? 'bg-emerald-700 text-white' :
                  product.isTrending ? 'bg-rose-600 text-white animate-pulse' :
                    'bg-amber-400 text-neutral-950'
              }`}>
              {isFlashSale ? 'Flash' :
                discount > 0 ? `${discount}% OFF` :
                  product.isNewArrival ? 'New' :
                    product.isTrending ? 'Trending' :
                      'Featured'}
            </div>
          </div>
        )}

        {/* Hover Actions - Centered icons without background/padding */}
        <div className="absolute inset-0 hidden md:flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/10 backdrop-blur-[1px] pointer-events-none">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="text-white hover:text-primary transition-all hover:scale-110 active:scale-95 p-0 bg-transparent border-none outline-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] pointer-events-auto"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowQuickViewModal(true); }}
                  aria-label="Quick view product"
                >
                  <Search className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Quick View</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={`transition-all hover:scale-110 active:scale-95 p-0 bg-transparent border-none outline-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] ${isInWishlist ? 'text-primary' : 'text-white hover:text-primary'} pointer-events-auto`}
                  onClick={(e) => { e.stopPropagation(); handleWishlist(e); }}
                  aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Floating Cart Button on Image (Bottom Right) */}
        <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-20">
          <button
            className="flex items-center justify-center w-[30px] h-[30px] sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground hover:scale-110 active:scale-95 transition-all shadow-lg"
            onClick={(e) => { e.stopPropagation(); handleAddToCart(e); }}
            aria-label="Add to cart"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="mt-4 text-center space-y-4 px-2 pb-2 flex-1 flex flex-col justify-between">
        <div className="min-h-[5.25rem] sm:min-h-[4.5rem] flex flex-col justify-center">
          <Link
            href={`/product/${product.slug}`}
            className={`text-sm ${layout === 'v3' ? 'lg:text-xs' : 'sm:text-base'} font-semibold text-foreground hover:text-primary transition-colors leading-tight px-2 line-clamp-3 sm:line-clamp-2`}
            title={product.name}
          >
            {product.name}
          </Link>
          <div className="flex items-center justify-center gap-2 mt-2">
            {product.salePrice ? (
              <>
                <span className={`text-foreground font-black text-sm ${layout === 'v3' ? 'lg:text-[14px]' : 'sm:text-[16px]'}`}>৳{Math.round(product.salePrice)}</span>
                <span className={`text-muted-foreground line-through text-[11px] ${layout === 'v3' ? 'lg:text-[11px]' : 'sm:text-[13px]'} font-normal`}>৳{Math.round(product.price)}</span>
              </>
            ) : (
              <span className={`text-foreground font-black text-sm ${layout === 'v3' ? 'lg:text-[14px]' : 'sm:text-[16px]'}`}>৳{Math.round(product.price)}</span>
            )}
          </div>
        </div>

        {/* Action Buttons - Visible on hover for Desktop, Always for Mobile */}
        <div className="flex gap-2 pt-2 transition-all duration-300 sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0">
          <Button
            size="sm"
            className="w-full rounded-none bg-primary hover:bg-primary/90 text-white font-bold text-sm sm:text-base h-11 sm:h-10 shadow-lg shadow-primary/20 transition-all active:scale-95 py-2"
            onClick={handleBuyNow}
          >
            অর্ডার করুন
          </Button>
        </div>
      </div>

      <QuickViewModal
        product={initialProduct}
        isOpen={showQuickViewModal}
        onClose={() => setShowQuickViewModal(false)}
      />
    </div>
  );
}
