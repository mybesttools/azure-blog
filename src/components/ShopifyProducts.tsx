'use client';

import Image from 'next/image';
import { ShopifyProduct, getCheckoutUrl } from '@/lib/shopify';

interface ProductCardProps {
  product: ShopifyProduct;
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const handleBuyNow = () => {
    const checkoutUrl = getCheckoutUrl(product.variantId);
    window.open(checkoutUrl, '_blank');
  };

  if (compact) {
    return (
      <div className="flex gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-slate-800 dark:border-slate-700">
        {product.image && (
          <div className="flex-shrink-0 w-24 h-24 relative">
            <Image
              src={product.image.url}
              alt={product.image.altText}
              fill
              className="object-cover rounded"
              sizes="96px"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg mb-1 truncate">{product.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
            {product.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: product.price.currencyCode,
              }).format(parseFloat(product.price.amount))}
            </span>
            <button
              onClick={handleBuyNow}
              disabled={!product.availableForSale}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {product.availableForSale ? 'Buy Now' : 'Sold Out'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white dark:bg-slate-800 dark:border-slate-700">
      {product.image && (
        <div className="relative w-full h-64">
          <Image
            src={product.image.url}
            alt={product.image.altText}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <div className="p-6">
        <h3 className="font-bold text-xl mb-2">{product.title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-bold text-2xl">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: product.price.currencyCode,
            }).format(parseFloat(product.price.amount))}
          </span>
          <button
            onClick={handleBuyNow}
            disabled={!product.availableForSale}
            className="px-6 py-3 bg-black text-white rounded hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {product.availableForSale ? 'Buy Now' : 'Sold Out'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ProductGridProps {
  products: ShopifyProduct[];
  columns?: 2 | 3 | 4;
}

export function ProductGrid({ products, columns = 3 }: ProductGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

interface ProductListProps {
  products: ShopifyProduct[];
}

export function ProductList({ products }: ProductListProps) {
  return (
    <div className="space-y-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} compact />
      ))}
    </div>
  );
}
