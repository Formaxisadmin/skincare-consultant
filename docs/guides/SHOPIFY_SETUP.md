# Shopify Integration Setup Guide

## Overview
This system now supports using **Shopify Product IDs** instead of Variant IDs, making it much easier to manage products. The system will automatically fetch variant IDs when needed.

## Setup Steps

### 1. Get Your Shopify Store URL
Your Shopify store URL (e.g., `your-store.myshopify.com`) should already be in your `.env.local`:
```env
NEXT_PUBLIC_SHOPIFY_STORE_URL=your-store.myshopify.com
```

### 2. Set Up Shopify REST Admin API (Recommended)

#### Step 1: Create a Custom App in Shopify
1. Go to your Shopify Admin
2. Navigate to **Settings** > **Apps and sales channels**
3. Click **Develop apps** (or **Build custom app**)
4. Click **Create an app**
5. Name it (e.g., "Skincare Consultant Integration")
6. Click **Create app**

#### Step 2: Configure API Scopes
1. Click **Configure Admin API scopes**
2. Select the following scopes:
   - `read_products` (required)
   - `read_product_listings` (optional, for product listings)
3. Click **Save**

#### Step 3: Install the App
1. Click **Install app**
2. Confirm installation

#### Step 4: Get API Credentials
1. After installation, you'll see **API credentials**
2. Copy the **Admin API access token** (this is your `SHOPIFY_ADMIN_API_SECRET`)
3. The **API key** is also shown (this is your `SHOPIFY_ADMIN_API_KEY`)

#### Step 5: Add to .env.local
Add these to your `.env.local` file:
```env
SHOPIFY_ADMIN_API_KEY=your_api_key_here
SHOPIFY_ADMIN_API_SECRET=your_admin_api_access_token_here
```

### 3. Alternative: Use Storefront API (Optional)

If you prefer to use Storefront API instead:

1. Go to **Settings** > **Apps and sales channels** > **Develop apps**
2. Create a new app or use existing one
3. Go to **API credentials** > **Storefront API**
4. Configure scopes: `unauthenticated_read_product_listings`, `unauthenticated_read_product_inventory`
5. Copy the **Storefront API access token**
6. Add to `.env.local`:
```env
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_token_here
```

### 4. Update Your Database

Instead of adding `shopifyVariantId`, you can now just add `shopifyProductId` to your products:

```javascript
// Example product update in MongoDB
{
  productId: "CLN001",
  name: "Gentle Foaming Cleanser",
  shopifyProductId: "123456789", // Just the numeric product ID from Shopify
  // shopifyVariantId is optional - will be fetched automatically
}
```

#### How to Find Product IDs in Shopify:
1. Go to **Products** in Shopify Admin
2. Click on a product
3. Look at the URL: `https://admin.shopify.com/store/your-store/products/123456789`
4. The number at the end is your **Product ID**
5. Copy this number and add it to your database as `shopifyProductId`

### 5. How It Works

1. **User clicks "Add to Cart"** on a product
2. System checks if product has `shopifyVariantId`
3. If not, it checks for `shopifyProductId`
4. If `shopifyProductId` exists, it calls `/api/shopify/get-variants`
5. API fetches the default variant ID from Shopify
6. Cart URL is built with the variant ID
7. User is redirected to Shopify cart

### 6. Benefits

✅ **Easier Management**: Only need to store Product IDs (one per product)  
✅ **Automatic Variant Fetching**: Variant IDs are fetched automatically  
✅ **Works with Default Variants**: Automatically uses the first/default variant  
✅ **Backward Compatible**: Still supports `shopifyVariantId` if you prefer

### 7. Testing

1. Make sure your `.env.local` has:
   - `NEXT_PUBLIC_SHOPIFY_STORE_URL`
   - `SHOPIFY_ADMIN_API_SECRET` (or `SHOPIFY_STOREFRONT_ACCESS_TOKEN`)

2. Restart your dev server:
   ```bash
   npm run dev
   ```

3. Test by:
   - Viewing a report with products that have `shopifyProductId`
   - Clicking "Add to Cart" on a product
   - Should open Shopify cart with the product

### 8. Troubleshooting

**Error: "Unable to fetch variant IDs"**
- Check that `SHOPIFY_ADMIN_API_SECRET` is set correctly in `.env.local`
- Verify API scopes include `read_products`
- Make sure the app is installed in your Shopify store

**Error: "Product not available"**
- Verify `shopifyProductId` is correct in your database
- Check that the product exists in your Shopify store
- Ensure the product has at least one variant

**Cart doesn't open**
- Check browser console for errors
- Verify `NEXT_PUBLIC_SHOPIFY_STORE_URL` is set correctly
- Make sure variant IDs are being fetched (check network tab)

## Important: About Product Variants

### Shopify Always Creates Variants
- **Every product in Shopify MUST have at least one variant**
- When you create a product, Shopify automatically creates a "Default Title" variant
- Even if you don't explicitly create variants, Shopify creates one for you
- This is a requirement of Shopify's system - products cannot exist without variants

### What Happens If a Product Has No Variants?
While this **shouldn't happen** in normal Shopify operations, the system handles it gracefully:

1. **Detection**: The API will detect if a product has no variants
2. **Warning**: A warning message will be logged in the console
3. **User Feedback**: Users will see an alert explaining the issue
4. **Action Required**: You'll need to check the product in Shopify admin and ensure it has at least one variant

### If You See "No Variants" Errors:
1. Go to your Shopify Admin
2. Navigate to the product
3. Check the "Variants" section
4. If there are no variants, create at least one variant (even if it's just the default)
5. Save the product

## Notes

- The system uses the **first variant** of each product (usually the default variant)
- If a product has multiple variants, only the first one will be added to cart
- For products with multiple variants, customers can change variants on the Shopify product page
- Variant IDs are fetched fresh each time (not cached)
- Products without variants will show helpful error messages to guide you to fix them

