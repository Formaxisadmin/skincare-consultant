import { NextResponse } from 'next/server';
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
      return NextResponse.json(
        { error: 'Missing required consultation data' },
        { status: 400 }
      );
    }

    // Generate unique consultation ID
    const consultationId = uuidv4();

    // Get all products from database
    const products = await Product.find({ inStock: true });

    // ** FIX STARTS HERE **
    // Use a ternary operator for a cleaner fallback
    // and correctly access the '.default' property of the imported module.
    const productList = products.length > 0 
      ? products 
      : (await import('@/data/sampleProducts')).default;
    
    // Ensure productList is a valid array before proceeding
    if (!productList || productList.length === 0) {
        console.error('CRITICAL: No products found in DB and sample data failed to load.');
        return NextResponse.json(
          { error: 'Product catalog is currently unavailable.' },
          { status: 503 } // Service Unavailable
        );
    }
    // ** FIX ENDS HERE **


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
        morningRoutine: analysis.morningRoutine,
        eveningRoutine: analysis.eveningRoutine,
      },
    });

    await consultation.save();

    return NextResponse.json({
      success: true,
      consultationId,
      analysis,
    });

  } catch (error) {
    console.error('Error processing consultation:', error);
    return NextResponse.json(
      { error: 'Failed to process consultation' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const consultationId = searchParams.get('id');

    if (!consultationId) {
      return NextResponse.json(
        { error: 'Consultation ID required' },
        { status: 400 }
      );
    }

    await connectDB();

    const consultation = await Consultation.findOne({ consultationId });

    if (!consultation) {
      return NextResponse.json(
        { error: 'Consultation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      consultation,
    });

  } catch (error) {
    console.error('Error fetching consultation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consultation' },
      { status: 500 }
    );
  }
}
