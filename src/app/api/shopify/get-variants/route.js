
/**
 * Fetches Shopify variant IDs from product IDs using Shopify REST Admin API
 * This allows us to use product IDs instead of managing variant IDs manually
 * 
 * Supports both:
 * 1. REST Admin API (recommended) - uses SHOPIFY_ADMIN_API_KEY and SHOPIFY_ADMIN_API_SECRET
 * 2. Storefront API (alternative) - uses SHOPIFY_STOREFRONT_ACCESS_TOKEN
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { productIds } = body;

    if (!productIds || !Array.isArray(productIds)) {
      return Response.json(
        { error: 'Product IDs array is required' },
        { status: 400 }
      );
    }

    const shopifyStoreUrl = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL;
    
    if (!shopifyStoreUrl) {
      return Response.json(
        { error: 'Shopify store URL not configured' },
        { status: 500 }
      );
    }

    // Clean store URL (remove protocol and trailing slash)
    const cleanStoreUrl = shopifyStoreUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Try REST Admin API first (simpler, more common)
    const adminApiKey = process.env.SHOPIFY_ADMIN_API_KEY;
    const adminApiSecret = process.env.SHOPIFY_ADMIN_API_SECRET;
    const storefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

    let variantMap = {};

    // Method 1: REST Admin API (recommended)
    if (adminApiKey && adminApiSecret) {
      try {
        // REST Admin API endpoint
        const apiVersion = '2024-01'; // Use latest stable version
        const apiUrl = `https://${cleanStoreUrl}/admin/api/${apiVersion}/products.json?ids=${productIds.join(',')}`;

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': adminApiSecret,
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.products) {
            data.products.forEach((product) => {
              const productId = product.id.toString();
              
              // Get the first variant (default variant)
              // Note: Shopify ALWAYS creates at least one variant (the "Default Title" variant)
              // But we handle edge cases gracefully
              if (product.variants && product.variants.length > 0) {
                const variantId = product.variants[0].id.toString();
                variantMap[productId] = variantId;
              } else {
                // Edge case: Product exists but has no variants (shouldn't happen, but handle it)
                console.warn(`⚠️ Product ${productId} (${product.title}) has no variants. This is unusual in Shopify.`);
                // We'll track products without variants to provide helpful error messages
                variantMap[productId] = null; // Mark as null so we know it exists but has no variant
              }
            });
          }
        } else {
          console.error(`Shopify API returned status ${response.status}: ${await response.text()}`);
        }
      } catch (err) {
        console.error('Error with REST Admin API:', err);
      }
    }

    // Method 2: Storefront API (fallback)
    if (Object.keys(variantMap).length === 0 && storefrontToken) {
      try {
        const apiUrl = `https://${cleanStoreUrl}/api/2024-01/graphql.json`;

        // Convert numeric product IDs to Shopify GIDs
        const productGids = productIds.map(id => `gid://shopify/Product/${id}`);
        const productIdsString = productGids.map(gid => `"${gid}"`).join(', ');
        
        const graphqlQuery = `
          query {
            nodes(ids: [${productIdsString}]) {
              ... on Product {
                id
                variants(first: 1) {
                  edges {
                    node {
                      id
                    }
                  }
                }
              }
            }
          }
        `;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': storefrontToken,
          },
          body: JSON.stringify({ query: graphqlQuery }),
        });

        const data = await response.json();

        if (!data.errors && data.data && data.data.nodes) {
          data.data.nodes.forEach((product) => {
            if (product) {
              const productGid = product.id;
              const productId = productGid.split('/').pop();
              
              if (product.variants && product.variants.edges.length > 0) {
                // Extract numeric ID from Shopify GID
                const variantGid = product.variants.edges[0].node.id;
                const variantId = variantGid.split('/').pop();
                variantMap[productId] = variantId;
              } else {
                // Edge case: Product exists but has no variants
                console.warn(`⚠️ Product ${productId} has no variants. This is unusual in Shopify.`);
                variantMap[productId] = null; // Mark as null
              }
            }
          });
        } else if (data.errors) {
          console.error('Shopify Storefront API errors:', data.errors);
        }
      } catch (err) {
        console.error('Error with Storefront API:', err);
      }
    }

    // Separate products with variants from those without
    const productsWithVariants = {};
    const productsWithoutVariants = [];
    
    Object.entries(variantMap).forEach(([productId, variantId]) => {
      if (variantId === null) {
        productsWithoutVariants.push(productId);
      } else {
        productsWithVariants[productId] = variantId;
      }
    });

    // If no API method worked at all, return error
    if (Object.keys(variantMap).length === 0) {
      const hasAdminApi = !!(adminApiKey && adminApiSecret);
      const hasStorefrontApi = !!storefrontToken;
      
      let errorMsg = 'Unable to fetch variant IDs from Shopify.';
      let suggestion = '';
      
      if (!hasAdminApi && !hasStorefrontApi) {
        errorMsg = 'Shopify API credentials are not configured.';
        suggestion = 'Please add either SHOPIFY_ADMIN_API_SECRET (REST API) or SHOPIFY_STOREFRONT_ACCESS_TOKEN (Storefront API) to your .env.local file.\n\n';
        suggestion += 'To set up:\n';
        suggestion += '1. Go to Shopify Admin > Settings > Apps and sales channels\n';
        suggestion += '2. Click "Develop apps" > "Create an app"\n';
        suggestion += '3. Configure API scopes (read_products for REST API)\n';
        suggestion += '4. Install the app and copy the API access token\n';
        suggestion += '5. Add to .env.local: SHOPIFY_ADMIN_API_SECRET=your_token_here\n';
        suggestion += '6. Restart your development server';
      } else if (hasAdminApi) {
        errorMsg = 'Shopify REST Admin API call failed.';
        suggestion = 'The API credentials are configured, but the request failed. Please check:\n';
        suggestion += '1. The product IDs are correct (you provided: ' + productIds.join(', ') + ')\n';
        suggestion += '2. The API token has read_products scope\n';
        suggestion += '3. The store URL is correct: ' + cleanStoreUrl;
      } else if (hasStorefrontApi) {
        errorMsg = 'Shopify Storefront API call failed.';
        suggestion = 'The Storefront API token is configured, but the request failed. Please check the token permissions.';
      }
      
      return Response.json(
        { 
          error: errorMsg,
          suggestion: suggestion,
          details: 'Product IDs requested: ' + productIds.join(', '),
          configured: {
            hasAdminApi,
            hasStorefrontApi,
            storeUrl: cleanStoreUrl,
          }
        },
        { status: 500 }
      );
    }

    // Return results, including info about products without variants
    return Response.json({
      success: true,
      variantMap: productsWithVariants, // Only return products that have variants
      productsWithoutVariants, // Inform about products that need attention
      message: productsWithoutVariants.length > 0 
        ? `Warning: ${productsWithoutVariants.length} product(s) have no variants. In Shopify, every product should have at least one variant (default variant). Please check these products in your Shopify admin.`
        : null,
    });

  } catch (error) {
    console.error('Error fetching Shopify variants:', error);
    return Response.json(
      { error: 'Failed to fetch variant IDs', details: error.message },
      { status: 500 }
    );
  }
}

