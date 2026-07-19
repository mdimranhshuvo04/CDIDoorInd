import NavbarV1 from './navbars/NavbarV1';

export const NavbarSelector = ({ style }: { style: string }) => {
  return <NavbarV1 />;
};

// --- HEROS ---
import HeroV1 from './heros/HeroV1';

export const HeroSelector = ({ style, banners, layout }: { style: string, banners: any[], layout?: string }) => {
  return <HeroV1 banners={banners} layout={layout} />;
};

// --- PRODUCT CARDS ---
import ProductCardV6 from './product-cards/ProductCardV6';

export const ProductCardSelector = ({ style, product, isFlashSale, priority, layout }: { style: string, product: any, isFlashSale?: boolean, priority?: boolean, layout?: string }) => {
  return <ProductCardV6 product={product} isFlashSale={isFlashSale} priority={priority} layout={layout} />;
};

// --- CATEGORIES ---
import CategoryV1 from './categories/CategoryV1';

export const CategorySelector = ({ style, categories }: { style: string, categories: any[] }) => {
  return <CategoryV1 categories={categories} />;
};

