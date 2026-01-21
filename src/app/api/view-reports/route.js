import connectDB, { Consultation } from '@/lib/mongodb';

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { mobile } = body;

    // Validate mobile is provided
    if (!mobile) {
      return Response.json(
        { error: 'Please provide your WhatsApp number' },
        { status: 400 }
      );
    }

    // Basic phone validation
    const phonePattern = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    const digitCount = mobile.replace(/\D/g, '').length;
    
    if (digitCount < 7 || !phonePattern.test(mobile.trim())) {
      return Response.json(
        { error: 'Please provide a valid WhatsApp number' },
        { status: 400 }
      );
    }

    // Find consultations by phone number
    const consultations = await Consultation.find({
      'customerInfo.phone': mobile.trim(),
    })
      .sort({ createdAt: -1 }) // Most recent first
      .lean();

    // Only return consultations that have customerInfo with phone saved
    const filteredConsultations = consultations.filter(
      (c) => c.customerInfo && c.customerInfo.phone
    );

    return Response.json({
      success: true,
      consultations: filteredConsultations,
      count: filteredConsultations.length,
    });

  } catch (error) {
    console.error('Error fetching consultations:', error);
    return Response.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

