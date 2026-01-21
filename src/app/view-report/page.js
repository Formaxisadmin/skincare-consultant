'use client';

import { Suspense } from 'react';
import ViewReportContent from './ViewReportContent';

export default function ViewReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--color-canvas)] flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--color-action-primary)' }}></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ViewReportContent />
    </Suspense>
  );
}
