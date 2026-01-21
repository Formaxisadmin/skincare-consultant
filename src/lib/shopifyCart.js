// lib/shopifyCart.js
// Utility functions for Shopify cart integration

/**
 * Builds a Shopify cart permalink URL
 * Format: https://store.myshopify.com/cart/{variant_id}:{quantity},{variant_id}:{quantity}?discount=CODE&checkout[phone]=PHONE
 * 
 * @param {Array} items - Array of objects with { variantId, quantity, productId (optional) }
 * @param {string} storeUrl - Shopify store URL (e.g., 'your-store.myshopify.com')
 * @param {string} discountCode - Optional discount code to apply
 * @param {string} phoneNumber - Optional phone number to prefill in checkout
 * @returns {string|null} - Cart permalink URL, or null if no valid items
 */
export function buildShopifyCartUrl(items, storeUrl, discountCode = null, phoneNumber = null) {
  if (!items || items.length === 0) {
    return null;
  }

  // Filter out items without variant IDs
  const validItems = items.filter(item => item.variantId && item.quantity > 0);
  
  if (validItems.length === 0) {
    return null;
  }

  // Group items by variant ID and sum quantities
  const itemMap = new Map();
  validItems.forEach(item => {
    const currentQty = itemMap.get(item.variantId) || 0;
    itemMap.set(item.variantId, currentQty + (item.quantity || 1));
  });

  // Build cart items string: variant_id:quantity,variant_id:quantity
  const cartItems = Array.from(itemMap.entries())
    .map(([variantId, quantity]) => `${variantId}:${quantity}`)
    .join(',');

  // Ensure storeUrl doesn't have protocol
  const cleanStoreUrl = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // Build base URL
  let url = `https://${cleanStoreUrl}/cart/${cartItems}`;
  
  // Build query parameters
  const params = new URLSearchParams();
  
  if (discountCode) {
    params.append('discount', discountCode);
  }
  
  if (phoneNumber) {
    // Prefill phone number in checkout
    params.append('checkout[phone]', phoneNumber);
  }
  
  // Append query string if we have any parameters
  const queryString = params.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  return url;
}

/**
 * Builds a Shopify product page URL as fallback
 * Used when a product has no variants (shouldn't happen in Shopify, but handles edge cases)
 * 
 * @param {string} productId - Shopify product ID
 * @param {string} storeUrl - Shopify store URL
 * @returns {string} - Product page URL
 */
export function buildShopifyProductUrl(productId, storeUrl) {
  if (!productId || !storeUrl) {
    return null;
  }

  const cleanStoreUrl = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  // Note: This requires the product handle, not just the ID
  // For now, we'll use the product ID in the URL (Shopify may redirect)
  // Better solution: Store product handle in database
  return `https://${cleanStoreUrl}/products/${productId}`;
}

/**
 * Opens Shopify cart in a new window/tab
 * 
 * @param {Array} items - Array of objects with { variantId, quantity }
 * @param {string} storeUrl - Shopify store URL
 * @param {string} discountCode - Optional discount code to apply
 */
export function openShopifyCart(items, storeUrl, discountCode = null) {
  const cartUrl = buildShopifyCartUrl(items, storeUrl, discountCode);
  
  if (cartUrl) {
    window.open(cartUrl, '_blank');
  } else {
    console.error('Unable to build cart URL - missing variant IDs or items');
  }
}

/**
 * Builds a Shopify browse URL with discount code applied
 * Format: https://store.myshopify.com/collections/all?discount=CODE&checkout[phone]=PHONE
 * 
 * @param {string} storeUrl - Shopify store URL (e.g., 'your-store.myshopify.com')
 * @param {string} discountCode - Optional discount code to apply
 * @param {string} collectionPath - Optional collection path (default: 'collections/all')
 * @param {string} phoneNumber - Optional phone number to prefill in checkout
 * @returns {string} - Browse URL with discount code
 */
export function buildShopifyBrowseUrl(storeUrl, discountCode, collectionPath = 'collections/all', phoneNumber = null) {
  if (!storeUrl) {
    return null;
  }

  // Ensure storeUrl doesn't have protocol
  const cleanStoreUrl = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // Build base URL
  let url = `https://${cleanStoreUrl}/${collectionPath}`;
  
  // Build query parameters
  const params = new URLSearchParams();
  
  if (discountCode) {
    params.append('discount', discountCode);
  }
  
  if (phoneNumber) {
    // Prefill phone number in checkout
    params.append('checkout[phone]', phoneNumber);
  }
  
  // Append query string if we have any parameters
  const queryString = params.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  return url;
}

/**
 * Extracts all products from recommendations object
 * 
 * @param {Object} recommendations - Recommendations object with category keys
 * @returns {Array} - Array of all products
 */
export function getAllRecommendedProducts(recommendations) {
  if (!recommendations || typeof recommendations !== 'object') {
    return [];
  }

  const allProducts = [];
  
  Object.values(recommendations).forEach((products) => {
    if (Array.isArray(products)) {
      allProducts.push(...products);
    }
  });

  return allProducts;
}

/**
 * Extracts products from morning and evening routines
 * 
 * @param {Array} morningRoutine - Morning routine steps
 * @param {Array} eveningRoutine - Evening routine steps
 * @returns {Array} - Array of unique products from routines
 */
export function getRoutineProducts(morningRoutine, eveningRoutine) {
  const products = new Map(); // Use Map to avoid duplicates by productId

  [...(morningRoutine || []), ...(eveningRoutine || [])].forEach((step) => {
    if (step?.product?.productId) {
      // Get the full product from recommendations if available
      // For now, we'll use the product info from the step
      if (!products.has(step.product.productId)) {
        products.set(step.product.productId, step.product);
      }
    }
  });

  return Array.from(products.values());
}

/**
 * Converts products to cart items format
 * Supports both shopifyProductId and shopifyVariantId
 * 
 * @param {Array} products - Array of product objects
 * @returns {Array} - Array of cart items with { variantId, quantity, productId (optional) }
 */
export function productsToCartItems(products) {
  return products
    .filter(product => product?.shopifyVariantId || product?.shopifyProductId)
    .map(product => ({
      variantId: product.shopifyVariantId || null, // Will be fetched if not available
      productId: product.shopifyProductId || null,
      quantity: 1, // Default quantity, can be customized
      productName: product.name,
      internalProductId: product.productId,
    }));
}

/**
 * Fetches variant IDs from product IDs using Shopify API
 * This allows using product IDs instead of managing variant IDs manually
 * 
 * @param {Array} products - Array of products with shopifyProductId
 * @returns {Promise<{products: Array, productsWithoutVariants: Array, warning: string|null}>} - Object with updated products and info about products without variants
 */
export async function fetchVariantIdsFromProductIds(products) {
  // Filter products that have productId but no variantId
  const productsNeedingVariants = products.filter(
    p => p.shopifyProductId && !p.shopifyVariantId
  );

  if (productsNeedingVariants.length === 0) {
    // All products already have variant IDs
    return {
      products,
      productsWithoutVariants: [],
      warning: null,
    };
  }

  try {
    const productIds = productsNeedingVariants.map(p => p.shopifyProductId);
    
    const response = await fetch('/api/shopify/get-variants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds }),
    });

    const data = await response.json();
    
    // Check if the response indicates an error (even if status is 200)
    if (!response.ok || data.error) {
      // Handle error response
      return {
        products,
        productsWithoutVariants: [],
        error: data.error || 'Failed to fetch variant IDs',
        suggestion: data.suggestion || null,
        details: data.details || null,
      };
    }

    if (data.success && data.variantMap) {
      const productsWithoutVariants = [];
      
      // Update products with fetched variant IDs
      const updatedProducts = products.map(product => {
        if (product.shopifyProductId && data.variantMap[product.shopifyProductId]) {
          return {
            ...product,
            shopifyVariantId: data.variantMap[product.shopifyProductId],
          };
        } else if (product.shopifyProductId && data.productsWithoutVariants?.includes(product.shopifyProductId)) {
          // Track products that exist but have no variants
          productsWithoutVariants.push(product);
        }
        return product;
      });

      return {
        products: updatedProducts,
        productsWithoutVariants,
        warning: data.message || null,
      };
    } else if (data.error) {
      // API returned an error - likely missing credentials
      console.error('Shopify API Error:', data.error, data.suggestion);
      return {
        products,
        productsWithoutVariants: [],
        error: data.error,
        suggestion: data.suggestion || null,
        details: data.details || null,
      };
    }
  } catch (err) {
    console.error('Error fetching variant IDs:', err);
    return {
      products,
      productsWithoutVariants: [],
      error: 'Network error while fetching variant IDs',
      suggestion: 'Please check your internet connection and try again',
    };
  }

  // Return original if fetch fails
  return {
    products,
    productsWithoutVariants: [],
    error: 'Unable to fetch variant IDs',
    suggestion: 'Please check your Shopify API configuration in .env.local',
  };
}

