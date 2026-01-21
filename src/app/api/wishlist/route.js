import connectDB, { Consultation } from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { consultationId, product, productId, products, action } = body;

    if (!consultationId) {
      return Response.json(
        { error: 'Consultation ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const consultation = await Consultation.findOne({ consultationId });

    if (!consultation) {
      return Response.json(
        { error: 'Consultation not found' },
        { status: 404 }
      );
    }

    let updatedWishlist = consultation.wishlist || [];

    if (action === 'add' && product) {
      // Check if product already exists
      const exists = updatedWishlist.some(
        (item) => item.productId === product.productId
      );

      if (!exists) {
        updatedWishlist.push({
          ...product,
          addedAt: new Date().toISOString(),
        });
      }
    } else if (action === 'remove' && productId) {
      updatedWishlist = updatedWishlist.filter(
        (item) => item.productId !== productId
      );
    } else if (action === 'sync' && Array.isArray(products)) {
      // Replace entire wishlist with synced version
      updatedWishlist = products;
    } else {
      return Response.json(
        { error: 'Invalid action or missing required fields' },
        { status: 400 }
      );
    }

    // Update consultation
    consultation.wishlist = updatedWishlist;
    await consultation.save();

    return Response.json({
      success: true,
      wishlist: updatedWishlist,
      message: action === 'add' ? 'Item added to wishlist' : 
               action === 'remove' ? 'Item removed from wishlist' : 
               'Wishlist synced successfully',
    });

  } catch (error) {
    console.error('Error updating wishlist:', error);
    return Response.json(
      { error: 'Failed to update wishlist', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const consultationId = searchParams.get('consultationId');

    if (!consultationId) {
      return Response.json(
        { error: 'Consultation ID is required' },
        { status: 400 }
      );
    }

    await connectDB();
    const consultation = await Consultation.findOne({ consultationId });

    if (!consultation) {
      return Response.json(
        { error: 'Consultation not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      wishlist: consultation.wishlist || [],
    });

  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return Response.json(
      { error: 'Failed to fetch wishlist', details: error.message },
      { status: 500 }
    );
  }
}

