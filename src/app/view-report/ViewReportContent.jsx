'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Search, Loader2, AlertCircle, FileText, Calendar } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import ReportViewer from '@/components/ReportViewer';

export default function ViewReportContent() {
  const [contactInfo, setContactInfo] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [consultations, setConsultations] = useState(null);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Helper function to validate WhatsApp number
  const validateWhatsAppNumber = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    
    // Check if it's a valid phone number (contains digits, may have +, -, spaces, parentheses)
    const phonePattern = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    // Also check if it has at least 7 digits (minimum for a valid phone number)
    const digitCount = trimmed.replace(/\D/g, '').length;
    return digitCount >= 7 && phonePattern.test(trimmed);
  };

  // Internal search function - performs the actual API call
  const handleSearchInternal = async (searchContactInfo, targetConsultationId = null) => {
    setIsSearching(true);
    setError(null);
    
    // Validate WhatsApp number
    if (!validateWhatsAppNumber(searchContactInfo)) {
      setError('Please enter a valid WhatsApp number');
      setIsSearching(false);
      return;
    }
    
    try {
      const requestBody = {
        mobile: searchContactInfo.trim(),
      };
      
      const response = await fetch('/api/view-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        if (data.consultations && data.consultations.length > 0) {
          setConsultations(data.consultations);
          
          // If we have a target ID, select that one
          if (targetConsultationId) {
            const targetConsultation = data.consultations.find(
              c => c.consultationId === targetConsultationId
            );
            if (targetConsultation) {
              await handleSelectConsultation(targetConsultation);
            } else if (data.consultations.length === 1) {
              // Fallback: select the only one
              await handleSelectConsultation(data.consultations[0]);
            }
          } else if (data.consultations.length === 1) {
            // If only one consultation found, auto-select it
            await handleSelectConsultation(data.consultations[0]);
          }
        } else {
          setError('No reports found for the provided WhatsApp number. Please check your number and try again.');
        }
      } else {
        setError(data.error || 'Failed to search for reports. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-load function - loads a consultation directly or via search
  const handleAutoLoad = async (consultationId, savedContactInfo) => {
    setIsLoading(true);
    try {
      // First, fetch the consultation to verify it exists
      const response = await fetch(`/api/submit-consultation?id=${consultationId}`);
      const data = await response.json();
      
      if (data.success && data.consultation) {
        // If we have contact info, search to get the full list, then select the target
        if (savedContactInfo) {
          await handleSearchInternal(savedContactInfo, consultationId);
        } else {
          // Just load the consultation directly (construct minimal consultation object)
          const consultation = {
            consultationId: consultationId,
            customerInfo: data.consultation.customerInfo,
          };
          await handleSelectConsultation(consultation);
        }
      } else {
        setError('Report not found. Please check the URL or search again.');
      }
    } catch (error) {
      console.error('Error auto-loading consultation:', error);
      setError('Failed to load consultation. Please try searching again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = async (e) => {
    e.preventDefault();

    // Validate that contact info is provided
    if (!contactInfo.trim()) {
      setError('Please enter your WhatsApp number');
      return;
    }

    // Validate WhatsApp number
    if (!validateWhatsAppNumber(contactInfo)) {
      setError('Please enter a valid WhatsApp number');
      return;
    }

    setSelectedConsultation(null);
    await handleSearchInternal(contactInfo);
  };

  const handleSelectConsultation = async (consultation) => {
    // Fetch full consultation data
    try {
      const response = await fetch(`/api/submit-consultation?id=${consultation.consultationId}`);
      const data = await response.json();
      
      if (data.success && data.consultation) {
        // Reconstruct the analysis object from saved consultation to match ReportViewer's expected format
        const skinProfile = data.consultation.analysis?.skinProfile || {};
        const identifiedConcerns = data.consultation.analysis?.identifiedConcerns || [];
        
        // Handle products - it might be stored as an object or converted to an array by MongoDB
        let products = data.consultation.recommendations?.products || {};
        if (Array.isArray(products)) {
          products = {};
        }
        if (typeof products !== 'object' || products === null) {
          products = {};
        }
        if (products.toObject) {
          products = products.toObject();
        }
        
        // Handle phasedRecommendations - extract from saved consultation
        let phasedRecommendations = data.consultation.recommendations?.phasedRecommendations || null;
        if (phasedRecommendations && typeof phasedRecommendations === 'object') {
          // Convert to plain object if needed
          if (phasedRecommendations.toObject) {
            phasedRecommendations = phasedRecommendations.toObject();
          }
        } else {
          phasedRecommendations = null;
        }
        
        // Collect all productIds from recommendations, phasedRecommendations, and routines to fetch latest data with shopifyVariantId
        const allProductIds = new Set();
        
        // Collect from recommendations
        Object.values(products).forEach((categoryProducts) => {
          if (Array.isArray(categoryProducts)) {
            categoryProducts.forEach((product) => {
              if (product?.productId) {
                allProductIds.add(product.productId);
              }
            });
          }
        });
        
        // Collect from phasedRecommendations (phase1, phase2, phase3)
        if (phasedRecommendations) {
          ['phase1', 'phase2', 'phase3'].forEach((phase) => {
            const phaseData = phasedRecommendations[phase];
            if (phaseData && typeof phaseData === 'object') {
              Object.values(phaseData).forEach((categoryProducts) => {
                if (Array.isArray(categoryProducts)) {
                  categoryProducts.forEach((product) => {
                    if (product?.productId) {
                      allProductIds.add(product.productId);
                    }
                  });
                }
              });
            }
          });
        }
        
        // Collect from routines
        const morningRoutine = Array.isArray(data.consultation.recommendations?.morningRoutine) 
          ? data.consultation.recommendations.morningRoutine 
          : [];
        const eveningRoutine = Array.isArray(data.consultation.recommendations?.eveningRoutine)
          ? data.consultation.recommendations.eveningRoutine
          : [];
        
        [...morningRoutine, ...eveningRoutine].forEach((step) => {
          if (step?.product?.productId) {
            allProductIds.add(step.product.productId);
          }
        });
        
        // Fetch latest product data with shopifyVariantId from database
        let productMap = new Map();
        if (allProductIds.size > 0) {
          try {
            const productResponse = await fetch('/api/products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productIds: Array.from(allProductIds) }),
            });
            
            const productData = await productResponse.json();
            
            if (productData.success && productData.products) {
              productData.products.forEach((product) => {
                // Log products with missing shopifyProductId for debugging
                if (!product.shopifyProductId || (typeof product.shopifyProductId === 'number' && isNaN(product.shopifyProductId))) {
                  console.warn('Product fetched from DB missing shopifyProductId:', {
                    productId: product.productId,
                    name: product.name,
                    shopifyProductId: product.shopifyProductId,
                    shopifyVariantId: product.shopifyVariantId,
                  });
                }
                productMap.set(product.productId, product);
              });
            }
          } catch (err) {
            console.error('Error fetching product updates:', err);
          }
        }
        
        // Update products in recommendations with latest data
        let updatedProducts = products;
        if (productMap.size > 0) {
          updatedProducts = {};
          Object.entries(products).forEach(([category, categoryProducts]) => {
            if (Array.isArray(categoryProducts)) {
              updatedProducts[category] = categoryProducts.map((savedProduct) => {
                const latestProduct = productMap.get(savedProduct?.productId);
                if (latestProduct) {
                  // Merge products, but preserve non-null values from both sources
                  // Prioritize latestProduct values, but don't overwrite valid values with null/undefined/NaN
                  const merged = { ...savedProduct };
                  Object.keys(latestProduct).forEach((key) => {
                    const latestValue = latestProduct[key];
                    const savedValue = savedProduct[key];
                    
                    // Only overwrite if the new value is valid (not null/undefined/NaN)
                    if (latestValue !== null && latestValue !== undefined) {
                      // For numbers, also check if it's not NaN
                      if (typeof latestValue === 'number') {
                        if (!isNaN(latestValue)) {
                          merged[key] = latestValue;
                        } else if (savedValue !== null && savedValue !== undefined && !isNaN(Number(savedValue))) {
                          // Keep saved value if latest is NaN but saved is valid
                          merged[key] = savedValue;
                        }
                      } else {
                        // For non-numbers, use latest value
                        merged[key] = latestValue;
                      }
                    } else if (savedValue !== null && savedValue !== undefined) {
                      // If latest is null/undefined but saved has a value, keep saved value
                      if (typeof savedValue === 'number' && !isNaN(savedValue)) {
                        merged[key] = savedValue;
                      } else if (typeof savedValue !== 'number') {
                        merged[key] = savedValue;
                      }
                    }
                  });
                  return merged;
                }
                return savedProduct;
              });
            }
          });
        }
        
        // Update products in phasedRecommendations with latest data
        let updatedPhasedRecommendations = phasedRecommendations;
        if (phasedRecommendations && productMap.size > 0) {
          updatedPhasedRecommendations = {
            phase1: {},
            phase2: {},
            phase3: {},
          };
          
          ['phase1', 'phase2', 'phase3'].forEach((phase) => {
            const phaseData = phasedRecommendations[phase];
            if (phaseData && typeof phaseData === 'object') {
              Object.entries(phaseData).forEach(([category, categoryProducts]) => {
                if (Array.isArray(categoryProducts)) {
                  updatedPhasedRecommendations[phase][category] = categoryProducts.map((savedProduct) => {
                    const latestProduct = productMap.get(savedProduct?.productId);
                    if (latestProduct) {
                      // Merge products, but preserve non-null values from both sources
                      // Prioritize latestProduct values, but don't overwrite with null/undefined
                      const merged = { ...savedProduct };
                      Object.keys(latestProduct).forEach((key) => {
                        const latestValue = latestProduct[key];
                        // Only overwrite if the new value is not null/undefined/NaN
                        if (latestValue !== null && latestValue !== undefined) {
                          // For numbers, also check if it's not NaN
                          if (typeof latestValue === 'number' && !isNaN(latestValue)) {
                            merged[key] = latestValue;
                          } else if (typeof latestValue !== 'number') {
                            merged[key] = latestValue;
                          }
                        }
                      });
                      return merged;
                    }
                    return savedProduct;
                  });
                }
              });
            }
          });
        }
        
        // Update routine products with latest data
        let updatedMorningRoutine = morningRoutine.map((step) => {
          if (step?.product?.productId) {
            const latestProduct = productMap.get(step.product.productId);
            if (latestProduct) {
              // Merge products, but preserve non-null values from both sources
              const mergedProduct = { ...step.product };
              Object.keys(latestProduct).forEach((key) => {
                const latestValue = latestProduct[key];
                // Only overwrite if the new value is not null/undefined/NaN
                if (latestValue !== null && latestValue !== undefined) {
                  // For numbers, also check if it's not NaN
                  if (typeof latestValue === 'number' && !isNaN(latestValue)) {
                    mergedProduct[key] = latestValue;
                  } else if (typeof latestValue !== 'number') {
                    mergedProduct[key] = latestValue;
                  }
                }
              });
              return {
                ...step,
                product: mergedProduct,
              };
            }
          }
          return step;
        });
        
        let updatedEveningRoutine = eveningRoutine.map((step) => {
          if (step?.product?.productId) {
            const latestProduct = productMap.get(step.product.productId);
            if (latestProduct) {
              // Merge products, but preserve non-null values from both sources
              const mergedProduct = { ...step.product };
              Object.keys(latestProduct).forEach((key) => {
                const latestValue = latestProduct[key];
                // Only overwrite if the new value is not null/undefined/NaN
                if (latestValue !== null && latestValue !== undefined) {
                  // For numbers, also check if it's not NaN
                  if (typeof latestValue === 'number' && !isNaN(latestValue)) {
                    mergedProduct[key] = latestValue;
                  } else if (typeof latestValue !== 'number') {
                    mergedProduct[key] = latestValue;
                  }
                }
              });
              return {
                ...step,
                product: mergedProduct,
              };
            }
          }
          return step;
        });
        
        // Recalculate sequential step numbers
        updatedMorningRoutine = updatedMorningRoutine.map((step, index) => ({
          ...step,
          step: index + 1,
        }));
        
        updatedEveningRoutine = updatedEveningRoutine.map((step, index) => ({
          ...step,
          step: index + 1,
        }));
        
        // Extract notices from saved consultation
        const notices = Array.isArray(data.consultation.recommendations?.notices) 
          ? data.consultation.recommendations.notices 
          : [];
        
        // Extract saved routine from saved consultation
        const savedRoutine = Array.isArray(data.consultation.recommendations?.savedRoutine)
          ? data.consultation.recommendations.savedRoutine
          : [];
        
        // Build the analysis object
        const analysis = {
          profile: skinProfile,
          concerns: identifiedConcerns,
          recommendations: updatedProducts,
          phasedRecommendations: updatedPhasedRecommendations, // Include phased recommendations
          morningRoutine: updatedMorningRoutine,
          eveningRoutine: updatedEveningRoutine,
          savedRoutine: savedRoutine, // Include saved routine products
          tips: [], // Tips can be regenerated if needed, but for now leave empty
          notices: notices, // Include notices from saved consultation
        };
        
        const updatedConsultation = { ...consultation, analysis };
        setSelectedConsultation(updatedConsultation);
        
        // Update URL with consultation ID for persistence on refresh
        if (consultation.consultationId) {
          router.push(`/view-report?id=${consultation.consultationId}`, { scroll: false });
        }
      } else {
        setError('Failed to load report details. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching consultation details:', err);
      setError('Failed to load report. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Save search data to localStorage
  useEffect(() => {
    if (contactInfo) {
      localStorage.setItem('view-report-contact', contactInfo);
    } else {
      localStorage.removeItem('view-report-contact');
    }
  }, [contactInfo]);

  // Save selected consultation ID
  useEffect(() => {
    if (selectedConsultation) {
      localStorage.setItem('view-report-selected-id', selectedConsultation.consultationId);
    }
  }, [selectedConsultation]);

  // Load saved search data from localStorage on mount and when URL changes
  // IMPORTANT: Clear saved consultation ID if navigating to /view-report without an ID parameter
  // This ensures users always see the search page when clicking "View Report" button
  useEffect(() => {
    const urlConsultationId = searchParams.get('id');
    const savedConsultationId = localStorage.getItem('view-report-selected-id');
    const savedContactInfo = localStorage.getItem('view-report-contact');
    
    // If there's no ID in URL, clear the saved consultation ID to show search page
    // But don't clear consultations list if it exists (user might want to go back to search results)
    if (!urlConsultationId) {
      localStorage.removeItem('view-report-selected-id');
      // Only clear selected consultation if URL doesn't have ID
      // Keep consultations list so user can see their search results when going back
      setSelectedConsultation(null);
      // Don't clear consultations here - let user see their search results
    }
    
    // Load saved contact info
    if (savedContactInfo) {
      setContactInfo(savedContactInfo);
    }
    
    // Only auto-load if there's a consultation ID in URL
    // Don't auto-load from localStorage to prevent unwanted navigation
    if (urlConsultationId) {
      // If we have contact info, use it; otherwise try to load directly
      if (savedContactInfo) {
        handleAutoLoad(urlConsultationId, savedContactInfo);
      } else {
        // Try to load directly if no search criteria
        handleAutoLoad(urlConsultationId, null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-canvas)] flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--color-action-primary)' }}></div>
          <p className="text-gray-600">Loading your report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] py-12">
      {!selectedConsultation ? (
        <div className="max-w-4xl mx-auto px-4">
          {/* Header - Only show when NOT viewing a report */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center mb-12 w-full"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-4 sm:mb-6 px-2">
              View Your Reports
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-3 sm:mb-4 text-center px-2">
              Enter your WhatsApp number to access your saved skincare consultation reports
            </p>
          </motion.div>

          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-8 mb-8"
          >
            <form onSubmit={handleSearch} className="space-y-6">
              <div>
                <label htmlFor="contactInfo" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  id="contactInfo"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="+91 98765 43210"
                  disabled={isSearching}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[var(--color-action-primary)] focus:ring-2 focus:ring-[var(--color-action-primary)]/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-sm text-gray-500 italic mt-2">
                  Enter the WhatsApp number you used when saving your report
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSearching}
                  className="w-full px-4 sm:px-6 py-3 text-white font-bold rounded-lg shadow-lg hover:shadow-xl active:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation text-sm sm:text-base"
                  style={{ minHeight: '44px' }}
                style={{ 
                  backgroundColor: 'var(--color-action-primary)'
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = 'var(--color-action-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-action-primary)';
                }}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'white' }} />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Find My Reports
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Consultation List */}
          <AnimatePresence>
            {consultations && consultations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 mb-6 sm:mb-8"
              >
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
                  <FileText className="w-6 h-6 mr-3" />
                  Your Reports ({consultations.length})
                </h2>

                <div className="space-y-4">
                  {consultations.map((consultation, index) => (
                    <button
                      key={consultation._id || index}
                      onClick={() => handleSelectConsultation(consultation)}
                      className="w-full text-left p-4 sm:p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg sm:rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg active:bg-purple-100 transition-all touch-manipulation"
                      style={{ minHeight: '44px' }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm sm:text-base">
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="font-bold text-base sm:text-lg text-gray-900">
                                Skincare Consultation Report
                              </h3>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3 text-xs sm:text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {formatDate(consultation.createdAt)}
                            </div>
                            {consultation.customerInfo?.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                {consultation.customerInfo.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-purple-600 font-semibold ml-4">
                          View →
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4">
          {/* Selected Report */}
          <AnimatePresence>
            {selectedConsultation && selectedConsultation.analysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Header Container: CSS Grid for perfect centering */}
                <div className="relative w-full mb-8 grid grid-cols-[auto_1fr_auto] items-center">
                  
                  {/* Left: Back Button */}
                  <div className="justify-self-start">
                    <button
                      onClick={() => {
                        setSelectedConsultation(null);
                        setError(null);
                        localStorage.removeItem('view-report-selected-id');
                        router.replace('/view-report', { scroll: false });
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs sm:text-sm bg-white rounded-lg transition-colors font-medium shadow-sm hover:shadow-md active:bg-gray-50 touch-manipulation"
                      style={{ minHeight: '44px' }}
                      style={{ 
                        border: '2px solid #5C4033',
                        color: '#5C4033'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(92, 64, 51, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      ← Back
                    </button>
                  </div>
                  
                  {/* Center: Title (Absolute Center) */}
                  {/* We use absolute positioning here to ignore the button's width */}
                  <div className="absolute left-0 right-0 pointer-events-none flex justify-center">
                    <h1 className="text-2xl md:text-3xl font-bold text-center px-4" style={{ color: '#5C4033' }}>
                      Your Personalized Skincare Report
                    </h1>
                  </div>

                  {/* Right: Empty spacer to balance grid if needed (optional) */}
                  <div className="justify-self-end w-[80px]"></div>
                </div>
                
                {/* Spacer to push content down below the absolute title on mobile if it wraps */}
                <div className="h-4 md:h-0"></div>
                <ReportViewer
                  consultationId={selectedConsultation.consultationId}
                  analysis={selectedConsultation.analysis}
                  customerInfo={selectedConsultation.customerInfo || null}
                  hideSaveForm={true}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

