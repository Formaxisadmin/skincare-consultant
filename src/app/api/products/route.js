import connectDB, { Product } from '@/lib/mongodb';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (category) {
      const products = await Product.find({ 
        category: category.toLowerCase(),
        inStock: true 
      }).lean();
      
      return Response.json({
        success: true,
        products,
      });
    }

    // Get all in-stock products
    const products = await Product.find({ inStock: true }).lean();

    return Response.json({
      success: true,
      products,
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return Response.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { productIds } = body;

    if (!productIds || !Array.isArray(productIds)) {
      return Response.json(
        { error: 'Product IDs array is required' },
        { status: 400 }
      );
    }

    // Fetch products by their productIds
    const products = await Product.find({
      productId: { $in: productIds },
    }).lean();

    // Log products with missing shopifyProductId for debugging
    products.forEach((product) => {
      if (!product.shopifyProductId || (typeof product.shopifyProductId === 'number' && isNaN(product.shopifyProductId))) {
        console.warn('API: Product missing shopifyProductId:', {
          productId: product.productId,
          name: product.name,
          shopifyProductId: product.shopifyProductId,
          shopifyVariantId: product.shopifyVariantId,
        });
      }
    });

    return Response.json({
      success: true,
      products,
    });

  } catch (error) {
    console.error('Error fetching products by IDs:', error);
    return Response.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

