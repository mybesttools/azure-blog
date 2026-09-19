# Shopify Integration Guide

This blog uses **headless Shopify integration** via the Storefront API, allowing you to display and sell products directly within your blog posts with full control over the UI.

## Why Headless Shopify?

✅ **Full UI Control** - Native React components styled to match your blog  
✅ **Lightning Fast** - Products rendered server-side with Next.js  
✅ **No Redirects** - Seamless shopping experience  
✅ **Free Tier** - Shopify Storefront API is free for development stores

## Setup Instructions

### Step 1: Create a Shopify Store

1. Go to [https://www.shopify.com/](https://www.shopify.com/)
2. Click **"Start free trial"**
3. Enter your email and create your store
4. Choose **"I'm just playing around"** for a development store (free forever)
5. Complete the setup wizard

### Step 2: Create an App in Dev Dashboard

Shopify now uses the **Dev Dashboard** for app creation:

1. In your Shopify Admin, click **Settings** (bottom left, gear icon)
2. Click **"Apps and sales channels"**
3. Look for **"Develop apps"** at the bottom of the page
4. Click **"Create an app"**
5. You'll see: **"Build and manage apps in your Dev Dashboard"**
6. Click **"Go to Dev Dashboard"** (opens `dev.shopify.com`)
   - If prompted, log in with your Shopify account
   - You may need to create a free Shopify Partner account

### Step 3: Create Your App in Dev Dashboard

**Can't find a "Create" button?** Try these locations:

**Method 1: Main Dashboard**
1. Go to `https://dev.shopify.com/dashboard`
2. Look for **"+ Create app"** in the **top right corner**
3. Or look for **"Apps"** section with a create button

**Method 2: From Apps List**
1. In Dev Dashboard, click **"Apps"** in the left navigation
2. Look for **"Create app"** or **"New app"** button
3. Should be near the top of the page

**Method 3: Direct from Shopify Admin (Easier!)**
1. Stay in Shopify Admin (don't go to Dev Dashboard)
2. Settings → Apps and sales channels → Develop apps
3. Click **"Allow custom app development"** if you haven't already
4. Click **"Create an app"** 
5. If it stays in Shopify Admin (doesn't redirect to Dev Dashboard):
   - Enter app name: "Blog Integration"
   - Click **"Create app"**
**If using Dev Dashboard:**
1. In your app's dashboard, click **"Configuration"** (left sidebar)
2. Scroll to **"Storefront API access"** section
3. Click **"Configure"**
4. Select these scopes:
   - ✅ `unauthenticated_read_product_listings`
   - ✅ `unauthenticated_read_product_inventory`
   - ✅ `unauthenticated_read_product_tags`
5. Click **"Save"**

**Step 4A: If using Shopify Admin (Alternative Method):**
1. In your app page, click **"Configuration"** tab
2. Find **"Storefront API integration"** section
3. Click **"Configure"** next to "Storefront API scopes"
4. Check these three boxes:
   - ✅ `unauthenticated_read_product_listings`
   - ✅ `unauthenticated_read_product_inventory`
   - ✅ `unauthenticated_read_product_tags`
5. Scroll down and c **App URL:** `http://localhost:3000`
   - **Allowed redirection URL(s):** `http://localhost:3000`
4. Click **"Create"**
5. Continue to Step 4 below

---

### Alternative Method: Use Shopify Admin Instead of Dev Dashboard

**If Dev Dashboard is confusing, use this simpler approach:**

1. In Shopify Admin: **Settings → Apps and sales channels**
2. Click **"Develop apps"** at the bottom
3. Click **"Allow custom app development"** (first time only)
4. Click **"Create an app"** (should stay in Shopify Admin, not redirect)
5. Enter app name: "Blog Integration"
6. Click **"Create app"**

Now you should see your app page with tabs:
- Overview
- Configuration ← You need this
- API credentials ← And this

**Continue to Step 4A below** (for Shopify Admin method)

### Step 4: Configure Storefront API Scopes

**If using Dev Dashboard:**
1. In Dev Dashboard, click **"Overview"** (left sidebar)
2. Click **"Select store"** and choose your development store
3. Click **"Install app"** to authorize
4. After installation, go to **"Settings"** tab
5. Find **"Storefront API access token"**
   - Starts with `shpat_` (32 characters)
   - Click 📋 to copy
6. **Save this token** - you may not see it again!

**If using Shopify Admin (Alternative Method):**
1. Click **"API credentials"** tab
2. You'll see **"Storefront API access token"** section
3. Click **"Install app"** button
4. After installing, the token will be revealed
   - Starts with `shpat_` (32 characters)
   - Click 📋 to copy
5. **Save this token immediately!**

### Step 5: Install App and Get Access Token

1. In Dev Dashboard, click **"Overview"** (left sidebar)
2. Click **"Select store"** and choose your development store
3. Click **"Install app"** to authorize
4. After installation, go to **"Settings"** tab
5. Find **"Storefront API access token"**
   - Starts with `shpat_` (32 characters)
   - Click 📋 to copy
6. **Save this token** - you may not see it again!

**Find your store domain:**
- In Shopify Admin, check the URL: `https://admin.shopify.com/store/my-store/...`
- Your domain is: `my-store.myshopify.com`

---

**Alternative: Old Interface (Custom Apps)**

If you **don't** see the Dev Dashboard prompt and instead can create apps directly:

1. In Settings → Apps and sales channels → Develop apps
2. Click **"Allow custom app development"** (if prompted)
3. Click **"Create an app"** (stays in Shopify Admin)
4. Name it "Blog Integration" → **Create app**
5. Go to **Configuration** tab → **Storefront API** → **Configure**
6. Enable the 3 scopes above → **Save**
7. Go to **API credentials** tab → **Install app**
8. Copy the **Storefront API access token**

Then continue with Step 6 below.

---

### Step 5: Configure Environment Variables

Now add your credentials to your local environment:

1. Open `.env.local` in your project root
2. Add these two lines (replace with your actual values):

```bash
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=my-awesome-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=shpat_1234567890abcdefghijklmnopqr
```

**Example `.env.local` file:**
```bash
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/azure-blog

# NextAuth configuration
NEXTAUTH_SECRET=YCThzC1X97yNQ2uM7Dm8rLQMGL/e+t98TLKsKIRP9Po=
NEXTAUTH_URL=http://localhost:3000

# Shopify Storefront API
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=my-awesome-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=shpat_1234567890abcdefghijklmnopqr
```

3. Save the file
4. Restart your dev server: `npm run dev`

⚠️ **Production:** Add these same variables to your Azure Container Instances environment or GitHub Secrets.

### Step 6: Add Products to Your Store

1. In Shopify Admin, go to **Products**
2. Click **"Add product"**
3. Fill in:
   - **Title** - Product name
   - **Description** - Detailed description
   - **Media** - Upload product images
   - **Pricing** - Set price and compare-at price
   - **Inventory** - Set stock quantity
4. Under **"Product availability"**, make sure **"Online Store"** is checked
5. Click **"Save"**

## Usage in Your Blog

### Display Products in a Post

There are several ways to display products in your blog:

#### 1. Fetch Products Server-Side (Recommended)

In your post page (`src/app/posts/[slug]/page.tsx`):

```typescript
import { getProducts } from '@/lib/shopify';
import { ProductGrid } from '@/components/ShopifyProducts';

export default async function PostPage({ params }: { params: { slug: string } }) {
  const products = await getProducts(3); // Fetch 3 products
  
  return (
    <article>
      {/* Your blog content */}
      
      <h2>Featured Products</h2>
      <ProductGrid products={products} columns={3} />
    </article>
  );
}
```

#### 2. Inline Product Embed

```typescript
import { getProductByHandle } from '@/lib/shopify';
import { InlineProduct } from '@/components/InlineProduct';

const product = await getProductByHandle('my-product-handle');

return (
  <article>
    <p>Check out this awesome product!</p>
    {product && <InlineProduct product={product} />}
  </article>
);
```

#### 3. Product Button

```typescript
import { getProductByHandle } from '@/lib/shopify';
import { ProductButton } from '@/components/InlineProduct';

const product = await getProductByHandle('my-product-handle');

return (
  <article>
    <p>Want to support this project?</p>
    {product && <ProductButton product={product} />}
  </article>
);
```

## Available Components

### `<ProductCard>`
Individual product card with image, title, price, and buy button.

**Props:**
- `product: ShopifyProduct` - Product data
- `compact?: boolean` - Show compact horizontal layout

### `<ProductGrid>`
Grid layout for multiple products.

**Props:**
- `products: ShopifyProduct[]` - Array of products
- `columns?: 2 | 3 | 4` - Number of columns (default: 3)

### `<ProductList>`
Vertical list of products in compact mode.

**Props:**
- `products: ShopifyProduct[]` - Array of products

### `<InlineProduct>`
Large inline product display for embedding in blog content.

**Props:**
- `product: ShopifyProduct` - Product data

### `<ProductButton>`
Simple button CTA for a product.

**Props:**
- `product: ShopifyProduct` - Product data

## API Functions

### `getProducts(limit?: number)`
Fetch multiple products (default: 10).

```typescript
const products = await getProducts(5);
```

### `getProductByHandle(handle: string)`
Fetch a single product by its handle (URL slug).

```typescript
const product = await getProductByHandle('esp32-dev-board');
```

### `getCheckoutUrl(variantId: string, quantity?: number)`
Generate a Shopify checkout URL.

```typescript
const url = getCheckoutUrl(variant.id, 2);
```

## Product Handles

A product **handle** is the URL-friendly version of your product title.

- **Title:** "ESP32 Development Board"  
- **Handle:** `esp32-development-board`

You See "Release" button instead of "Create app"?

If you see a **"Release"** button, it means:

**Option 1:** You already have an app created
1. Look in the left sidebar for a list of your apps
2. Click on the app name to open it
3. If it's the right app, skip to Step 4 (Configure Storefront API)
4. If you want a new app, look for **"+ Create app"** in the top right

**Option 2:** You're inside an existing app
1. Click **"Apps"** in the top left to go back to the app list
2. Look for **"+ Create app"** or **"Create app"** button
3. Create a new app for your blog integration

**Option 3:** Use existing app
1. If you already have an app, you can use it!
2. Go to Step 4 to configure Storefront API access
3. Make sure to enable the 3 required scopes

### can find or customize handles in Shopify Admin → Products → [Product] → Search engine listing.
### Redirected to Dev Dashboard instead of creating app directly

This is the **new normal**! Shopify now uses the Dev Dashboard for app creation. Follow these steps:

1. Click "Go to Dev Dashboard" when prompted
2. If you don't have a Shopify Partner account, create one (free)
3. Create the app in Dev Dashboard as described in Step 3 above
4. The Dev Dashboard gives you more control and better management

### Need a Shopify Partner account?

When you go to Dev Dashboard, you may need to create a Partner account:

1. Go to `https://partners.shopify.com/signup`
2. Sign up with your email (it's completely free)
3. Complete the brief registration form
4. Return to `https://dev.shopify.com/dashboard` to create your app

**Important:** A Partner account is free and required for Dev Dashboard access.

### Can't find Storefront API in Dev Dashboard

In the Dev Dashboard (after creating your app):

1. Make sure you're **inside your app** (not on the main dashboard)
2. Click **"Configuration"** in the left sidebar
3. Scroll down to find **"Storefront API access"** section
4. If you don't see it:
   - Make sure you selected "Create app manually" (not from a template)
   - Try refreshing the page
   - Check you're logged into the correct account

### Can't find "Develop apps" option

**Solution 1:** Make sure you're the store owner. Custom app development is only available to the store owner account.

**Solution 2:** Direct URL - Go to: `https://admin.shopify.com/store/YOUR-STORE-NAME/settings/apps/development`

**Solution 3:** Use Dev Dashboard directly:
1. Go to `https://dev.shopify.com/dashboard`
2. Log in with your Shopify credentials
3. Create your app there

### Token not showing after install

**In Dev Dashboard:**
1. After clicking "Install app", go to **Settings** tab (left sidebar)
2. Look for **"Storefront API access token"**
3. If not visible, refresh the page or try uninstalling/reinstalling

**In old Shopify Admin interface:**
1. Token appears under **API credentials** tab
2. Make sure you clicked "Install app" (not just "Save")
3. Refresh the page if needed

### Products not showing in blog

**Check 1:** Verify your environment variables are set correctly:
```bash
npm run dev
# Check console for "NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN" errors
```

**Check 2:** Verify products are published to "Online Store":
- Shopify Admin → Products → [Select Product]
- Scroll to "Product availability"
- Make sure "Online Store" is checked

**Check 3:** Check browser console for errors (F12 in Chrome)

### "Buy Now" not working

**Domain issue:** Make sure `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` includes `.myshopify.com`:
```bash
# ✅ Correct
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=my-store.myshopify.com

# ❌ Wrong
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=my-store
```

**Inventory issue:** Check product has available inventory in Shopify Admin

### API errors (403 Forbidden)

**Scopes not configured:** Go back to your app's Configuration tab and make sure you:
1. Checked the three Storefront API scopes
2. Clicked "Save"
3. Clicked "Install app" in the API credentials tab

### Still having issues?

Check the console output when running `npm run dev`. The error messages will show:
- Missing environment variables
- Invalid tokens
- API connection issues_xxx
   ```

2. Deploy as normal - products are fetched at build time and runtime

## Troubleshooting

**Products not showing:**
- Check your Storefront API token is correct
- Verify products are published to "Online Store"
- Check browser console for errors

**"Buy Now" not working:**
- Verify store domain is correct
- Check product has available inventory
- Ensure variant IDs are valid

**API errors:**
- Check Shopify Admin → Apps → [Your App] → API credentials
- Verify Storefront API scopes are enabled
- Check API version (currently using 2024-01)

## Cost

- **Development Store:** FREE forever
- **Basic Shopify:** $32/month (for real sales)
- **Storefront API:** FREE (no additional cost)

## Next Steps

- [Shopify Storefront API Docs](https://shopify.dev/docs/api/storefront)
- [Hydrogen React Components](https://shopify.dev/docs/api/hydrogen-react)
- [Product object reference](https://shopify.dev/docs/api/storefront/2024-01/objects/Product)
