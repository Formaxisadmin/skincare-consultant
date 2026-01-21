/**
 * Syncs local cart items to Shopify cart URL
 * Returns a Shopify cart URL with all items pre-added
 */
import { NextResponse } from 'next/server';
import { buildShopifyCartUrl } from '@/lib/shopifyCart';

export async function POST(request) {
  try {
    const body = await request.json();
    const { cartItems, discountCode } = body;

    if (!cartItems || !Array.isArray(cartItems)) {
      return NextResponse.json(
        { error: 'Cart items array is required' },
        { status: 400 }
      );
    }

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    const shopifyStoreUrl = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL;
    
    if (!shopifyStoreUrl) {
      return NextResponse.json(
        { error: 'Shopify store URL not configured' },
        { status: 500 }
      );
    }

    // Fetch variant IDs for products that need them
    // First, get product IDs that need variant fetching
    const productsNeedingVariants = cartItems.filter(
      p => p.shopifyProductId && !p.shopifyVariantId
    );

    let productsWithVariants = cartItems.filter(p => p.shopifyVariantId);

    // If we have products that need variant IDs, fetch them
    if (productsNeedingVariants.length > 0) {
      const productIds = productsNeedingVariants.map(p => p.shopifyProductId);
      
      try {
        const variantResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/shopify/get-variants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds }),
        });

        const variantData = await variantResponse.json();

        if (variantData.success && variantData.variantMap) {
          // Update products with fetched variant IDs
          productsNeedingVariants.forEach(product => {
            if (variantData.variantMap[product.shopifyProductId]) {
              productsWithVariants.push({
                ...product,
                shopifyVariantId: variantData.variantMap[product.shopifyProductId],
              });
            }
          });
        }
      } catch (error) {
        console.error('Error fetching variant IDs:', error);
        // Continue with products that already have variant IDs
      }
    }

    if (productsWithVariants.length === 0) {
      return NextResponse.json(
        { 
          error: 'No products have valid variant IDs',
          suggestion: 'Please ensure products have shopifyProductId or shopifyVariantId configured'
        },
        { status: 400 }
      );
    }

    // Convert to cart items format
    const shopifyCartItems = productsWithVariants.map(product => {
      const cartItem = cartItems.find(item => 
        item.productId === product.productId ||
        (product.shopifyVariantId && item.shopifyVariantId === product.shopifyVariantId) ||
        (product.shopifyProductId && item.shopifyProductId === product.shopifyProductId)
      );

      return {
        variantId: product.shopifyVariantId,
        quantity: cartItem?.quantity || 1,
        productName: product.name,
      };
    });

    // Build Shopify cart URL with optional discount code
    const cartUrl = buildShopifyCartUrl(shopifyCartItems, shopifyStoreUrl, discountCode || null);

    if (!cartUrl) {
      return NextResponse.json(
        { error: 'Unable to build cart URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cartUrl,
      itemsSynced: shopifyCartItems.length,
      totalItems: cartItems.length,
    });

  } catch (error) {
    console.error('Error syncing cart to Shopify:', error);
    return NextResponse.json(
      { error: 'Failed to sync cart', details: error.message },
      { status: 500 }
    );
  }
}

