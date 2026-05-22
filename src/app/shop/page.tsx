import { getProducts } from '@/lib/shopify';
import { ProductGrid } from '@/components/ShopifyProducts';
import Container from '@/app/_components/container';
import Header from '@/app/_components/header';

export default async function ShopPage() {
  const products = await getProducts(12);

  return (
    <main>
      <Header />
      <Container>
        <section className="py-16">
          <h1 className="mb-8 text-5xl md:text-7xl font-bold tracking-tighter leading-tight">
            Shop
          </h1>
          <p className="text-lg mb-12">
            Check out our featured products powered by Shopify.
          </p>
          
          {products.length > 0 ? (
            <ProductGrid products={products} columns={3} />
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

export const metadata = {
  title: 'Shop - My Best Tools',
  description: 'Browse our product collection',
};
