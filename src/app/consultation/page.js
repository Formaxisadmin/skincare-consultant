'use client';

import { Suspense } from 'react';
import ConsultationContent from './ConsultationContent';

export default function ConsultationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--color-canvas)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--color-action-primary)' }}></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ConsultationContent />
    </Suspense>
  );
}