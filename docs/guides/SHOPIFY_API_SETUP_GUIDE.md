# Shopify API Setup - Step by Step Guide

## Quick Setup (5-10 minutes)

### Step 1: Create Custom App in Shopify

1. **Log in to your Shopify Admin**
   - Go to https://admin.shopify.com
   - Log in with your store credentials

2. **Navigate to Apps**
   - Click on **Settings** (bottom left)
   - Click on **Apps and sales channels**
   - Click on **Develop apps** (or "Build custom app" if you see it)

3. **Create New App**
   - Click the **"Create an app"** button
   - Enter a name: `Skincare Consultant Integration` (or any name you like)
   - Click **"Create app"**

### Step 2: Configure API Scopes

1. **Click on "Configure Admin API scopes"**

2. **Select the following scopes:**
   - ✅ `read_products` (Required - to fetch product and variant information)
   - ✅ `read_product_listings` (Optional - for product listings)

3. **Click "Save"** at the top right

### Step 3: Install the App

1. **Click "Install app"** button
   - This will ask for confirmation
   - Click **"Install"** to confirm

2. **After installation**, you'll see the API credentials section

### Step 4: Get Your API Credentials

1. **Look for "Admin API access token"**
   - You'll see a section showing your API credentials
   - Click **"Reveal token once"** or **"Show token"** to see your access token
   - **⚠️ IMPORTANT: Copy this token immediately** - you won't be able to see it again!
   - This is your `SHOPIFY_ADMIN_API_SECRET`

2. **Also note your API Key** (you might need it later)
   - This is your `SHOPIFY_ADMIN_API_KEY`

### Step 5: Add Credentials to .env.local

1. **Open your `.env.local` file** in your project root

2. **Add these lines:**
   ```env
   SHOPIFY_ADMIN_API_KEY=your_api_key_here
   SHOPIFY_ADMIN_API_SECRET=your_admin_api_access_token_here
   ```

3. **Example:**
   ```env
   SHOPIFY_ADMIN_API_KEY=abc123def456
   SHOPIFY_ADMIN_API_SECRET=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

4. **Save the file**

### Step 6: Restart Your Development Server

1. **Stop your current server:**
   - Press `Ctrl + C` in your terminal

2. **Start it again:**
   ```bash
   npm run dev
   ```

### Step 7: Test It!

1. **Go to your consultation report page**
2. **Click "Add to Cart" on a product**
3. **It should now:**
   - Fetch the variant ID from Shopify
   - Open your Shopify cart with the product
   - ✅ Success!

## Troubleshooting

### Error: "Invalid API credentials"
- Make sure you copied the **Admin API access token** (not the API key)
- The token should start with `shpat_` for private apps
- Check for any extra spaces when copying/pasting

### Error: "Insufficient scope"
- Make sure you selected `read_products` scope
- Re-install the app if you added scopes after installation

### Error: "Store URL not configured"
- Make sure `NEXT_PUBLIC_SHOPIFY_STORE_URL` is set in `.env.local`
- It should be your store URL like: `your-store.myshopify.com`

### Error: "Product not found"
- Verify the `shopifyProductId` in your database matches the actual Shopify product ID
- Check that the product exists in your Shopify store

## Security Notes

- ⚠️ **Never commit `.env.local` to Git** - it contains sensitive credentials
- ⚠️ **Never share your API tokens** - they give full access to your store
- ✅ **Use environment variables** - they're safe and secure
- ✅ **Rotate tokens periodically** - for better security

## What's Next?

Once the API is set up:
- ✅ "Add to Cart" buttons will work automatically
- ✅ Variant IDs will be fetched on-demand
- ✅ No need to manually add variant IDs to database
- ✅ System works with just `shopifyProductId`

## Need Help?

If you're stuck:
1. Check the browser console for detailed error messages
2. Check your server logs for API errors
3. Verify your `.env.local` file has the correct values
4. Make sure you restarted your server after adding credentials

