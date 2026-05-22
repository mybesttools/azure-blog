'use client';

import { ShopifyProduct, getCheckoutUrl } from '@/lib/shopify';
import Image from 'next/image';

interface InlineProductProps {
  product: ShopifyProduct;
}

/**
 * Inline product component for embedding within blog post content
 * Usage: <InlineProduct product={productData} />
 */
export function InlineProduct({ product }: InlineProductProps) {
  const handleBuyNow = () => {
    const checkoutUrl = getCheckoutUrl(product.variantId);
    window.open(checkoutUrl, '_blank');
  };

  return (
    <div className="my-8 p-6 border-2 border-gray-200 dark:border-slate-700 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-900">
      <div className="flex flex-col md:flex-row gap-6">
        {product.image && (
          <div className="flex-shrink-0 w-full md:w-48 h-48 relative rounded-lg overflow-hidden">
            <Image
              src={product.image.url}
              alt={product.image.altText}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 192px"
            />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-2xl">{product.title}</h3>
            <span className="text-sm px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-full font-medium">
              {product.availableForSale ? 'In Stock' : 'Sold Out'}
            </span>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {product.description}
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Price</span>
              <span className="font-bold text-3xl">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: product.price.currencyCode,
                }).format(parseFloat(product.price.amount))}
              </span>
            </div>
            <button
              onClick={handleBuyNow}
              disabled={!product.availableForSale}
              className="w-full sm:w-auto px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-semibold text-lg shadow-md hover:shadow-lg"
            >
              {product.availableForSale ? '🛒 Buy Now' : 'Sold Out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Simple product button for inline CTAs
 */
export function ProductButton({ product }: InlineProductProps) {
  const handleBuyNow = () => {
    const checkoutUrl = getCheckoutUrl(product.variantId);
    window.open(checkoutUrl, '_blank');
  };

  return (
    <button
      onClick={handleBuyNow}
      disabled={!product.availableForSale}
      className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
    >
      {product.availableForSale ? (
        <>
          🛒 Buy {product.title} - {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: product.price.currencyCode,
          }).format(parseFloat(product.price.amount))}
        </>
      ) : (
        `${product.title} - Sold Out`
      )}
    </button>
  );
}
