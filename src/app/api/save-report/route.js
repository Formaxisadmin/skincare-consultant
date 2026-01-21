import connectDB, { Consultation } from '@/lib/mongodb';

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { consultationId, mobile, routine } = body;

    // Validate required fields
    if (!consultationId) {
      return Response.json(
        { error: 'Consultation ID is required' },
        { status: 400 }
      );
    }

    // Find the consultation first to check if customerInfo already exists
    const consultation = await Consultation.findOne({ consultationId });

    if (!consultation) {
      return Response.json(
        { error: 'Consultation not found' },
        { status: 404 }
      );
    }

    // Check if customerInfo already exists
    const hasExistingCustomerInfo = consultation.customerInfo && 
      consultation.customerInfo.phone;
    
    // Mobile (WhatsApp) must be provided (unless only saving routine and customerInfo already exists)
    if (!mobile && !routine) {
      return Response.json(
        { error: 'Please provide your WhatsApp number' },
        { status: 400 }
      );
    }
    
    // If saving routine only and customerInfo exists, allow it
    if (routine && !mobile && hasExistingCustomerInfo) {
      // Allow routine-only save - no validation needed
    } else if (!mobile && !hasExistingCustomerInfo) {
      return Response.json(
        { error: 'Please provide your WhatsApp number to save the report' },
        { status: 400 }
      );
    }

    // Basic phone validation if provided
    if (mobile) {
      const phonePattern = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
      const digitCount = mobile.replace(/\D/g, '').length;
      
      if (digitCount < 7 || !phonePattern.test(mobile.trim())) {
        return Response.json(
          { error: 'Please provide a valid WhatsApp number' },
          { status: 400 }
        );
      }
    }

    // Update customerInfo with mobile (WhatsApp)
    const updateData = {};
    if (mobile) {
      updateData['customerInfo.phone'] = mobile.trim();
    }
    
    // Update routine if provided
    if (routine) {
      updateData['recommendations.savedRoutine'] = routine.selectedProducts || [];
      updateData['recommendations.morningRoutine'] = routine.morning || [];
      updateData['recommendations.eveningRoutine'] = routine.evening || [];
    }

    await Consultation.updateOne(
      { consultationId },
      { $set: updateData }
    );

    return Response.json({
      success: true,
      message: 'Report saved successfully',
    });

  } catch (error) {
    console.error('Error saving report:', error);
    return Response.json(
      { error: 'Failed to save report' },
      { status: 500 }
    );
  }
}

