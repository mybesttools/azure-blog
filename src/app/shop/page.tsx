import { getProducts } from '@/lib/shopify';
import { ProductGrid } from '@/components/ShopifyProducts';
import Container from '@/app/_components/container';
import Header from '@/app/_components/header';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const products = await getProducts(12);
  const productNames = products.slice(0, 3).map(p => p.title).join(', ');
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  return {
    title: 'Shop Best Tools & Products | My Best Tools',
    description: `Discover our curated collection of premium tools and products. ${products.length > 0 ? `Browse ${productNames} and more.` : 'Quality products for developers and creators.'} Shipping worldwide from Amsterdam.`,
    keywords: ['tools', 'products', 'shop', 'online store', 'buy tools', 'developer tools', 'best tools', 'Amsterdam'],
    authors: [{ name: 'My Best Tools' }],
    openGraph: {
      title: 'Shop Best Tools & Products',
      description: `Browse our collection of ${products.length}+ premium tools and products`,
      url: `${baseUrl}/shop`,
      siteName: 'My Best Tools',
      type: 'website',
      images: products.length > 0 && products[0].image ? [
        {
          url: products[0].image.url,
          width: products[0].image.width,
          height: products[0].image.height,
          alt: products[0].image.altText,
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Shop Best Tools & Products',
      description: `Browse our collection of ${products.length}+ premium tools`,
      images: products.length > 0 && products[0].image ? [products[0].image.url] : [],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: `${baseUrl}/shop`,
    },
  };
}

export default async function ShopPage() {
  const products = await getProducts(12);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Shop Premium Tools & Products',
    description: 'Discover our hand-picked collection of high-quality tools and products for developers and creators. Shipping worldwide from Amsterdam.',
    url: `${baseUrl}/shop`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        '@type': 'Product',
        position: index + 1,
        name: product.title,
        description: product.description,
        image: product.image?.url,
        offers: {
          '@type': 'Offer',
          price: product.price.amount,
          priceCurrency: product.price.currencyCode,
          availability: product.availableForSale 
            ? 'https://schema.org/InStock' 
            : 'https://schema.org/OutOfStock',
          url: `${baseUrl}/shop#${product.handle}`,
        },
      })),
    },
  };

  return (
    <main>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <Header />
      <Container>
        <section className="py-16">
          <h1 className="mb-8 text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
            Shop Premium Tools & Products
          </h1>
          <p className="text-lg md:text-xl mb-12 text-gray-700 dark:text-gray-300 max-w-3xl">
            Discover our hand-picked collection of high-quality tools and products. 
            {products.length > 0 && ` Browse ${products.length} premium items. `}
            Perfect for developers, creators, and professionals. Shipping worldwide from Amsterdam.
          </p>
          
          {products.length > 0 ? (
            <>
              <div className="mb-8">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {products.length} product{products.length !== 1 ? 's' : ''}
                </p>
              </div>
              <ProductGrid products={products} columns={3} />
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">
                No products found. Add some products in your Shopify store to see them here!
              </p>
              <p className="mt-4 text-sm text-gray-500">
                Go to your Shopify Admin → Products → Add product
              </p>
            </div>
          )}
        </section>
      </Container>
    </main>
  );
}
