'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QuestionnaireFlow from '@/components/QuestionnaireFlow';
import ReportViewer from '@/components/ReportViewer';

export default function ConsultationPage() {
  const [showReport, setShowReport] = useState(false);
  const [consultationId, setConsultationId] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const router = useRouter();

  const handleComplete = (id, analysisData) => {
    setConsultationId(id);
    setAnalysis(analysisData);
    setShowReport(true);
    
    // Update URL without reload
    window.history.pushState({}, '', `/consultation?id=${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {!showReport ? (
        <>
          <div className="text-center py-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
              Skincare Consultation
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Answer a few questions to get your personalized skincare routine and product recommendations
            </p>
          </div>
          <QuestionnaireFlow onComplete={handleComplete} />
        </>
      ) : (
        <ReportViewer consultationId={consultationId} analysis={analysis} />
      )}
    </div>
  );
}