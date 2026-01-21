import connectDB, { Consultation, Product } from '@/lib/mongodb';
import RecommendationEngine from '@/lib/recommendationEngine';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { responses, customerInfo } = body;

    // Validate required fields
    if (!responses || !responses.skinType || !responses.primaryConcerns) {
      return Response.json(
        { error: 'Missing required consultation data' },
        { status: 400 }
      );
    }

    // Generate unique consultation ID
    const consultationId = uuidv4();

    // --- SIMPLIFIED PRODUCT FETCH ---
    // Get all products from the database that are in stock.
    console.log("🔍 Querying database for products where { inStock: true }...");
    const productList = await Product.find({ inStock: true }).lean();

    // This is now a strict check. If no products are found, the process stops.
if (!productList || productList.length === 0) {
      console.error("❌ CRITICAL (with .lean()): The database query still returned 0 products. This confirms the issue is with the query condition itself or the connection. Please double-check your .env.local file and that your IP is whitelisted in Atlas.");
      return Response.json(
        { error: 'Product catalog is unavailable. The database returned no in-stock products.' },
        { status: 503 }
      );
    }
    
    console.log(`👍 Success (with .lean())! Found ${productList.length} products in the database.`);

    // Create recommendation engine
    const engine = new RecommendationEngine(responses);

    // Generate complete analysis
    const analysis = await engine.generateCompleteAnalysis(productList);

    // Save consultation to database
    const consultation = new Consultation({
      consultationId,
      customerInfo: customerInfo || {},
      responses,
      analysis: {
        skinProfile: analysis.profile,
        identifiedConcerns: analysis.concerns,
        priorityScore: analysis.concerns.reduce((acc, c) => {
          acc[c.concern] = c.priorityScore;
          return acc;
        }, {}),
      },
      recommendations: {
        products: analysis.recommendations,
        phasedRecommendations: analysis.phasedRecommendations || null, // PHASE 3.3: Phased routine rollout
        morningRoutine: analysis.morningRoutine,
        eveningRoutine: analysis.eveningRoutine,
        notices: analysis.notices || [], // PHASE 2.1: Multi-pass system notices
      },
    });

    await consultation.save();

    return Response.json({
      success: true,
      consultationId,
      analysis,
    });

  } catch (error) {
    console.error('Error processing consultation:', error);
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Failed to process consultation';
    let statusCode = 500;
    
    if (error.code === 'ETIMEOUT' || error.message?.includes('ETIMEOUT')) {
      errorMessage = 'Database connection timeout. Please check your internet connection and try again.';
      statusCode = 503; // Service Unavailable
    } else if (error.code === 'ENOTFOUND' || error.message?.includes('ENOTFOUND')) {
      errorMessage = 'Database server not found. Please contact support.';
      statusCode = 503;
    } else if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      errorMessage = 'Database connection refused. Please check your network settings.';
      statusCode = 503;
    } else if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
      errorMessage = 'Database connection error. Please try again in a few moments.';
      statusCode = 503;
    }
    
    return Response.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const consultationId = searchParams.get('id');

    if (!consultationId) {
      return Response.json(
        { error: 'Consultation ID required' },
        { status: 400 }
      );
    }

    await connectDB();

    const consultation = await Consultation.findOne({ consultationId }).lean();

    if (!consultation) {
      return Response.json(
        { error: 'Consultation not found' },
        { status: 404 }
      );
    }

    // Ensure products is properly formatted as an object
    if (consultation.recommendations?.products) {
      // Convert to plain object if needed
      const products = consultation.recommendations.products;
      if (typeof products === 'object' && !Array.isArray(products)) {
        // Good, it's already an object
      } else {
        // If it's somehow not an object, convert to empty object
        consultation.recommendations.products = {};
      }
    }

    return Response.json({
      success: true,
      consultation,
    });

  } catch (error) {
    console.error('Error fetching consultation:', error);
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Failed to fetch consultation';
    let statusCode = 500;
    
    if (error.code === 'ETIMEOUT' || error.message?.includes('ETIMEOUT')) {
      errorMessage = 'Database connection timeout. Please check your internet connection and try again.';
      statusCode = 503;
    } else if (error.code === 'ENOTFOUND' || error.message?.includes('ENOTFOUND')) {
      errorMessage = 'Database server not found. Please contact support.';
      statusCode = 503;
    } else if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      errorMessage = 'Database connection refused. Please check your network settings.';
      statusCode = 503;
    } else if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
      errorMessage = 'Database connection error. Please try again in a few moments.';
      statusCode = 503;
    }
    
    return Response.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}