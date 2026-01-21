'use client';

import { createContext, useContext, useState } from 'react';

const ConsultationContext = createContext();

export function ConsultationProvider({ children }) {
  const [consultationId, setConsultationId] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);

  const value = {
    consultationId,
    setConsultationId,
    customerInfo,
    setCustomerInfo,
  };

  return (
    <ConsultationContext.Provider value={value}>
      {children}
    </ConsultationContext.Provider>
  );
}

export function useConsultation() {
  const context = useContext(ConsultationContext);
  // Return default values instead of throwing error to make it optional
  if (!context) {
    return {
      consultationId: null,
      setConsultationId: () => {},
      customerInfo: null,
      setCustomerInfo: () => {},
    };
  }
  return context;
}

