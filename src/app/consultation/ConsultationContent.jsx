'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import QuestionnaireFlow from '@/components/QuestionnaireFlow';
import ReportViewer from '@/components/ReportViewer';

export default function ConsultationContent() {
  const [showReport, setShowReport] = useState(false);
  const [consultationId, setConsultationId] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load consultation from URL on mount or when ID changes
  useEffect(() => {
    const loadConsultationFromUrl = async () => {
      const id = searchParams.get('id');
      
      if (id) {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/submit-consultation?id=${id}`);
          const data = await response.json();

          if (data.success && data.consultation) {
            // Reconstruct analysis from saved consultation
            const skinProfile = data.consultation.analysis?.skinProfile || {};
            const identifiedConcerns = data.consultation.analysis?.identifiedConcerns || [];
            
            let products = data.consultation.recommendations?.products || {};
            if (Array.isArray(products)) {
              products = {};
            }
            if (typeof products !== 'object' || products === null) {
              products = {};
            }
            
            // Extract phasedRecommendations from saved consultation
            let phasedRecommendations = data.consultation.recommendations?.phasedRecommendations || null;
            if (phasedRecommendations && typeof phasedRecommendations === 'object') {
              // Convert to plain object if needed
              if (phasedRecommendations.toObject) {
                phasedRecommendations = phasedRecommendations.toObject();
              }
            } else {
              phasedRecommendations = null;
            }
            
            // Extract notices from saved consultation
            const notices = Array.isArray(data.consultation.recommendations?.notices) 
              ? data.consultation.recommendations.notices 
              : [];
            
            let morningRoutine = Array.isArray(data.consultation.recommendations?.morningRoutine) 
              ? data.consultation.recommendations.morningRoutine 
              : [];
            let eveningRoutine = Array.isArray(data.consultation.recommendations?.eveningRoutine)
              ? data.consultation.recommendations.eveningRoutine
              : [];
            
            // Recalculate sequential step numbers
            morningRoutine = morningRoutine.map((step, index) => ({
              ...step,
              step: index + 1,
            }));
            
            eveningRoutine = eveningRoutine.map((step, index) => ({
              ...step,
              step: index + 1,
            }));
            
            const fixedAnalysis = {
              profile: skinProfile,
              concerns: identifiedConcerns,
              recommendations: products,
              phasedRecommendations: phasedRecommendations, // Include phased recommendations
              morningRoutine,
              eveningRoutine,
              tips: [],
              notices: notices, // Include notices
            };
            
            setConsultationId(id);
            setAnalysis(fixedAnalysis);
            // Extract customerInfo if it exists (report was saved)
            setCustomerInfo(data.consultation.customerInfo || null);
            setShowReport(true);
          } else {
            // Invalid ID, clear from URL
            router.replace('/consultation');
          }
        } catch (error) {
          console.error('Error loading consultation:', error);
          router.replace('/consultation');
        } finally {
          setIsLoading(false);
        }
      } else {
        // No ID in URL - user is viewing questionnaire or going back from report
        // Set showReport to false to show the questionnaire
        // Progress will be restored automatically by QuestionnaireFlow component
        setShowReport(false);
        setIsLoading(false);
      }
    };

    loadConsultationFromUrl();
  }, [searchParams, router]);

  const handleComplete = (id, analysisData) => {
    // Ensure step numbers are sequential (1, 2, 3...) in routines
    const fixedAnalysis = {
      ...analysisData,
      morningRoutine: analysisData.morningRoutine?.map((step, index) => ({
        ...step,
        step: index + 1,
      })) || [],
      eveningRoutine: analysisData.eveningRoutine?.map((step, index) => ({
        ...step,
        step: index + 1,
      })) || [],
    };
    
    setConsultationId(id);
    setAnalysis(fixedAnalysis);
    setShowReport(true);
    
    // Update URL with consultation ID
    router.push(`/consultation?id=${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-canvas)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--color-action-primary)' }}></div>
          <p className="text-gray-600">Loading your consultation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-canvas)]">
      {!showReport ? (
        <QuestionnaireFlow onComplete={handleComplete} />
      ) : (
        <ReportViewer 
          consultationId={consultationId} 
          analysis={analysis} 
          customerInfo={customerInfo}
        />
      )}
    </div>
  );
}

