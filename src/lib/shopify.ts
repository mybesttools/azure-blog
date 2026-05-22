import { createStorefrontClient } from '@shopify/hydrogen-react';

// Initialize Shopify Storefront API client
export const shopifyClient = createStorefrontClient({
  storeDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '',
  storefrontApiVersion: '2024-10', // Updated to latest stable version
  publicStorefrontToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN || '',
});

// Debug: Log configuration (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Shopify Config:', {
    storeDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
    apiVersion: '2024-10',
    hasToken: !!process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN,
    tokenPrefix: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN?.substring(0, 6),
    apiUrl: shopifyClient.getStorefrontApiUrl(),
  });
}

// GraphQL query to fetch products
const PRODUCTS_QUERY = `#graphql
  query Products($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
          description
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 1) {
            edges {
              node {
                url
                altText
                width
                height
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                id
                availableForSale
              }
            }
          }
        }
      }
    }
  }
`;

// GraphQL query to fetch a single product by handle
const PRODUCT_BY_HANDLE_QUERY = `#graphql
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      title
      handle
      description
      descriptionHtml
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      images(first: 5) {
        edges {
          node {
            url
            altText
            width
            height
          }
        }
      }
      variants(first: 10) {
        edges {
          node {
            id
            title
            availableForSale
            price {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  descriptionHtml?: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  image: {
    url: string;
    altText: string;
    width: number;
    height: number;
  } | null;
  variantId: string;
  availableForSale: boolean;
}

// Fetch multiple products
export async function getProducts(limit: number = 10): Promise<ShopifyProduct[]> {
  try {
    const headers = shopifyClient.getPublicTokenHeaders();
    const url = shopifyClient.getStorefrontApiUrl();
    
    // Debug logging
    console.log('Fetching products from:', url);
    console.log('Headers:', headers);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: PRODUCTS_QUERY,
        variables: { first: limit },
      }),
    });

    const { data, errors } = await response.json();

    if (errors) {
      console.error('Shopify API errors:', JSON.stringify(errors, null, 2));
      return [];
    }
    
    if (!response.ok) {
      console.error('Shopify API HTTP error:', response.status, response.statusText);
      return [];
    }

    const products = data?.products?.edges || [];

    return products.map((edge: any) => {
      const node = edge.node;
      const imageNode = node.images?.edges[0]?.node;
      const variantNode = node.variants?.edges[0]?.node;

      return {
        id: node.id,
        title: node.title,
        handle: node.handle,
        description: node.description,
        price: node.priceRange.minVariantPrice,
        image: imageNode ? {
          url: imageNode.url,
          altText: imageNode.altText || node.title,
          width: imageNode.width,
          height: imageNode.height,
        } : null,
        variantId: variantNode?.id || '',
        availableForSale: variantNode?.availableForSale || false,
      };
    });
  } catch (error) {
    console.error('Error fetching Shopify products:', error);
    return [];
  }
}

// Fetch a single product by handle
export async function getProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  try {
    const response = await fetch(shopifyClient.getStorefrontApiUrl(), {
      method: 'POST',
      headers: shopifyClient.getPublicTokenHeaders(),
      body: JSON.stringify({
        query: PRODUCT_BY_HANDLE_QUERY,
        variables: { handle },
      }),
    });

    const { data, errors } = await response.json();

    if (errors || !data?.product) {
      console.error('Shopify API errors:', errors);
      return null;
    }

    const product = data.product;
    const imageNode = product.images?.edges[0]?.node;
    const variantNode = product.variants?.edges[0]?.node;

    return {
      id: product.id,
      title: product.title,
      handle: product.handle,
      description: product.description,
      descriptionHtml: product.descriptionHtml,
      price: product.priceRange.minVariantPrice,
      image: imageNode ? {
        url: imageNode.url,
        altText: imageNode.altText || product.title,
        width: imageNode.width,
        height: imageNode.height,
      } : null,
      variantId: variantNode?.id || '',
      availableForSale: variantNode?.availableForSale || false,
    };
  } catch (error) {
    console.error('Error fetching Shopify product:', error);
    return null;
  }
}

// Generate Shopify checkout URL for a variant
export function getCheckoutUrl(variantId: string, quantity: number = 1): string {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  if (!domain) return '#';
  
  // Convert variant gid to numeric ID
  const numericId = variantId.split('/').pop();
  return `https://${domain}/cart/${numericId}:${quantity}`;
}
