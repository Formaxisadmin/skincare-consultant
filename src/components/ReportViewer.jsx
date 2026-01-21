'use client';

import { useState, useMemo, memo, useRef, useEffect, useLayoutEffect } from 'react';
import { Sun, Moon, AlertCircle, ChevronLeft, ChevronRight, ChevronDown, Save, Phone, HelpCircle, Trash2, Heart } from 'lucide-react';
import { getRoutineProducts, buildShopifyCartUrl, buildShopifyBrowseUrl, fetchVariantIdsFromProductIds, productsToCartItems } from '@/lib/shopifyCart';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useConsultation } from '@/context/ConsultationContext';
import WishlistDrawer from '@/components/WishlistDrawer';
import WishlistToast from '@/components/WishlistToast';
import { Toast } from '@/components/Toast';
import { ingredientDictionary } from '@/data/ingredientDictionary';

const AccordionSection = ({ 
  title, 
  defaultOpen = true, 
  children, 
  containerClassName = 'bg-white', 
  contentClassName = '' 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-2xl shadow-lg mb-8 ${containerClassName}`}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-center px-6 py-3 text-left relative"
        aria-expanded={isOpen}
      >
        <span className="text-xl font-bold text-gray-900 text-center">{title}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 transition-transform duration-300 absolute right-6 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className={`px-6 ${isOpen ? 'pt-1 pb-3' : 'py-0'} ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default function ReportViewer({ consultationId, analysis, hideSaveForm = false, customerInfo: initialCustomerInfo = null }) {
  // State for customerInfo (can be updated when user saves report)
  const [customerInfo, setCustomerInfo] = useState(initialCustomerInfo);
  const { setConsultationId: setGlobalConsultationId, setCustomerInfo: setGlobalCustomerInfo } = useConsultation();
  
  // Update global consultation context when props change
  useEffect(() => {
    if (consultationId) {
      setGlobalConsultationId(consultationId);
    }
  }, [consultationId, setGlobalConsultationId]);
  
  // Sync customerInfo when initialCustomerInfo prop changes (e.g., on page refresh or data reload)
  useEffect(() => {
    if (initialCustomerInfo) {
      setCustomerInfo(initialCustomerInfo);
    }
  }, [initialCustomerInfo]);

  // Fetch customerInfo from API if not provided but consultationId exists (e.g., on page refresh)
  useEffect(() => {
    const fetchCustomerInfo = async () => {
      // Only fetch if:
      // 1. We have a consultationId
      // 2. customerInfo is not already set (or doesn't have phone)
      // 3. initialCustomerInfo is not provided (or doesn't have phone)
      if (consultationId && (!customerInfo || !customerInfo.phone) && (!initialCustomerInfo || !initialCustomerInfo.phone)) {
        try {
          const response = await fetch(`/api/submit-consultation?id=${consultationId}`);
          const data = await response.json();
          
          if (data.success && data.consultation && data.consultation.customerInfo) {
            const fetchedCustomerInfo = data.consultation.customerInfo;
            // Only update if it has a phone number (meaning report was saved)
            if (fetchedCustomerInfo && fetchedCustomerInfo.phone) {
              setCustomerInfo(fetchedCustomerInfo);
              setGlobalCustomerInfo(fetchedCustomerInfo);
            }
          }
        } catch (error) {
          console.error('Error fetching customerInfo:', error);
          // Silently fail - don't block the UI
        }
      }
    };

    // Small delay to ensure component is mounted and other effects have run
    const timer = setTimeout(() => {
      fetchCustomerInfo();
    }, 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId]); // Only depend on consultationId to avoid infinite loops
  
  useEffect(() => {
    if (customerInfo) {
      setGlobalCustomerInfo(customerInfo);
    }
  }, [customerInfo, setGlobalCustomerInfo]);
  
  // Safety check: ensure analysis exists and has required structure
  if (!analysis) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-900 mb-2">Report Not Available</h2>
          <p className="text-red-700">Unable to load report data. Please try again.</p>
        </div>
      </div>
    );
  }

  // Safely destructure with defaults
  const {
    profile = {},
    concerns = [],
    recommendations = {},
    phasedRecommendations = null,
    morningRoutine = [],
    eveningRoutine = [],
    tips = [],
  } = analysis;
  
  // Use global cart context
  const { addToCart } = useCart();
  
  // Use wishlist context
  const { 
    addToWishlist, 
    removeFromWishlist, 
    isProductInWishlist,
    wishlistToastMessage,
    wishlistToastAction,
    clearWishlistToast,
    mergeWishlistWithDatabase
  } = useWishlist();
  
  // Wishlist drawer state
  const [isWishlistDrawerOpen, setIsWishlistDrawerOpen] = useState(false);

  // Use ref for scroll positions to avoid re-renders (prevents scroll reset)
  const carouselScrollPositionsRef = useRef({});
  
  // State for selected routine products
  const [selectedRoutineProducts, setSelectedRoutineProducts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saved', 'saving', 'error'
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveContact, setSaveContact] = useState('');
  const [saveError, setSaveError] = useState('');
  const isInitialLoad = useRef(true);
  
  // State for duplicate category warning
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateWarningData, setDuplicateWarningData] = useState(null);
  
  // State for clear routine confirmation dialog
  const [showClearRoutineDialog, setShowClearRoutineDialog] = useState(false);
  
  // Load saved routine on mount if available
  useEffect(() => {
    if (analysis?.savedRoutine && Array.isArray(analysis.savedRoutine)) {
      setSelectedRoutineProducts(analysis.savedRoutine);
      isInitialLoad.current = true; // Mark as initial load
    }
  }, [analysis?.savedRoutine]);
  
  // Track previous routine to detect changes
  const previousRoutineRef = useRef(JSON.stringify(selectedRoutineProducts));
  
  // Auto-save routine when it changes (with debounce)
  useEffect(() => {
    // Skip auto-save on initial load
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      previousRoutineRef.current = JSON.stringify(selectedRoutineProducts);
      return;
    }
    
    // Check if routine actually changed
    const currentRoutine = JSON.stringify(selectedRoutineProducts);
    if (currentRoutine === previousRoutineRef.current) {
      return; // No change, don't save
    }
    
    previousRoutineRef.current = currentRoutine;
    
    if (!consultationId) return;
    
    // Only auto-save if customerInfo exists (report has been saved at least once)
    if (!customerInfo || !customerInfo.phone) return;
    
    console.log('Routine changed, will auto-save in 2 seconds...', {
      productCount: selectedRoutineProducts.length,
      products: selectedRoutineProducts.map(p => p.productId)
    });
    
    const timeoutId = setTimeout(async () => {
      await saveRoutineToDatabase();
    }, 2000); // Debounce: wait 2 seconds after last change
    
    return () => clearTimeout(timeoutId);
  }, [selectedRoutineProducts, consultationId, customerInfo]);
  
  // Save routine to database
  const saveRoutineToDatabase = async () => {
    if (!consultationId) return;

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      const routine = buildRoutineFromSelected();
      console.log('Saving routine:', {
        consultationId,
        selectedProductsCount: selectedRoutineProducts.length,
        morningSteps: routine.morning.length,
        eveningSteps: routine.evening.length
      });

      const response = await fetch('/api/save-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId,
          mobile: customerInfo?.phone || null,
          routine: {
            selectedProducts: selectedRoutineProducts,
            morning: routine.morning,
            evening: routine.evening
          }
        }),
      });

      const data = await response.json();
      console.log('Save response:', data);

      if (data.success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 3000); // Clear status after 3 seconds
      } else {
        console.error('Save failed:', data.error);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (error) {
      console.error('Error saving routine:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Manual save button handler
  const handleSaveReport = async () => {
    if (!consultationId) {
      alert('No consultation ID found. Cannot save report.');
      return;
    }
    
    // Check if customer info exists
    if (!customerInfo || !customerInfo.phone) {
      // Show dialog for WhatsApp number input
      setSaveContact('');
      setSaveError('');
      setShowSaveDialog(true);
      return;
    }
    
    // If customer info exists, just save routine
    await saveRoutineToDatabase();
  };
  
  // Handle save dialog submission
  const handleSaveDialogSubmit = async () => {
    setSaveError('');
    
    if (!saveContact || !saveContact.trim()) {
      setSaveError('Please enter your WhatsApp number.');
      return;
    }
    
    // Validate WhatsApp number (phone number format)
    const trimmed = saveContact.trim();
    const phonePattern = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    const digitCount = trimmed.replace(/\D/g, '').length;
    
    if (digitCount < 7 || !phonePattern.test(trimmed)) {
      setSaveError('Please enter a valid WhatsApp number.');
      return;
    }
    
    const saveWhatsApp = trimmed;
    
    setIsSaving(true);
    
    try {
      // First save customer info
      const response = await fetch('/api/save-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId,
          mobile: saveWhatsApp,
        }),
      });
      
      const data = await response.json();
      if (!data.success) {
        setSaveError(data.error || 'Failed to save. Please try again.');
        setIsSaving(false);
        return;
      }
      
      // Update customerInfo state
      const newCustomerInfo = {
        phone: saveWhatsApp,
      };
      setCustomerInfo(newCustomerInfo);
      setGlobalCustomerInfo(newCustomerInfo);
      
      // Close dialog
      setShowSaveDialog(false);
      
      // Merge wishlist from localStorage to database
      if (data.consultation && data.consultation.wishlist) {
        await mergeWishlistWithDatabase(consultationId, data.consultation.wishlist);
      } else {
        await mergeWishlistWithDatabase(consultationId, []);
      }
      
      // Then save routine
      await saveRoutineToDatabase();
      
      setIsSaving(false);
    } catch (error) {
      console.error('Error saving customer info:', error);
      setSaveError('Failed to save customer information. Please try again.');
      setIsSaving(false);
    }
  };

  // Mapping from internal category names to Shopify display categories
  const categoryDisplayMap = {
    'cleanser': 'FACIAL CLEANSERS',
    'facial-cleansers': 'FACIAL CLEANSERS',
    'serum': 'FACE SERUMS',
    'face-serums': 'FACE SERUMS',
    'serums-ampoules': 'SERUMS & AMPOULES',
    'serums-&-ampoules': 'SERUMS & AMPOULES',
    'toner': 'TONERS',
    'toners': 'TONERS',
    'moisturizer': 'FACE MOISTURIZERS',
    'face-moisturizers': 'FACE MOISTURIZERS',
    'moisturizers': 'MOISTURIZERS',
    'spf': 'SUNSCREENS',
    'sunscreen': 'SUNSCREEN',
    'sunscreens': 'SUNSCREENS',
    'eye-cream': 'EYE CREAMS',
    'eye_cream': 'EYE CREAMS',
    'eye-creams': 'EYE CREAMS',
    'mask': 'MASKS & PEELS',
    'masks-peels': 'MASKS & PEELS',
    'masks-&-peels': 'MASKS & PEELS',
    'treatment': 'FACE SERUMS', // Treatments are often categorized as serums in Shopify
    'treatments': 'FACE SERUMS',
  };

  // Helper function to format category names
  // Uses Shopify display categories if mapping exists, otherwise falls back to formatted internal name
  // Also checks for product.CATEGORY field (all caps) which is the Shopify category
  const formatCategoryName = (category, product = null) => {
    // First, check if product has a CATEGORY field (Shopify category)
    if (product && product.CATEGORY && typeof product.CATEGORY === 'string') {
      return product.CATEGORY.toUpperCase();
    }
    
    if (!category || typeof category !== 'string') {
      return 'Unknown Category';
    }

    // Normalize the category (handle underscores, hyphens, etc.)
    const normalizedCategory = category.toLowerCase().replace(/_/g, '-').trim();
      
    // Check if we have a direct mapping
    if (categoryDisplayMap[normalizedCategory]) {
      return categoryDisplayMap[normalizedCategory];
      }

    // Try partial matching for variations
    for (const [key, value] of Object.entries(categoryDisplayMap)) {
      if (normalizedCategory.includes(key) || key.includes(normalizedCategory)) {
        return value;
    }
    }
    
    // Fallback: format the category name nicely
    return category.split(/[-_\s]/).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ').toUpperCase();
  };

  // Handle adding product to cart
  const handleAddToCart = async (product) => {
    // If product is missing shopifyProductId, try to fetch it from the database
    let productToAdd = product;
    
    if (!product?.shopifyProductId && !product?.shopifyVariantId && product?.productId) {
      try {
        // Fetch the latest product data from the database
        const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds: [product.productId] }),
      });

      const data = await response.json();
        if (data.success && data.products && data.products.length > 0) {
          const dbProduct = data.products[0];
          // Merge the database product data with the current product
          productToAdd = { ...product, ...dbProduct };
          console.log('Fetched shopifyProductId from database:', {
            productId: product.productId,
            shopifyProductId: dbProduct.shopifyProductId,
            shopifyVariantId: dbProduct.shopifyVariantId,
          });
      }
    } catch (err) {
        console.error('Error fetching product from database:', err);
      }
    }
    
    // Check if product has valid Shopify IDs
    // shopifyProductId can be a number or string (MongoDB may return as string)
    // shopifyVariantId should be a valid number (not NaN) if it exists
    const hasValidProductId = productToAdd?.shopifyProductId && 
                               (typeof productToAdd.shopifyProductId === 'number' || typeof productToAdd.shopifyProductId === 'string') &&
                               productToAdd.shopifyProductId !== 'NaN' &&
                               !isNaN(Number(productToAdd.shopifyProductId)) &&
                               Number(productToAdd.shopifyProductId) > 0;
    
    const hasValidVariantId = productToAdd?.shopifyVariantId && 
                               (typeof productToAdd.shopifyVariantId === 'number' || typeof productToAdd.shopifyVariantId === 'string') &&
                               productToAdd.shopifyVariantId !== 'NaN' &&
                               !isNaN(Number(productToAdd.shopifyVariantId)) &&
                               Number(productToAdd.shopifyVariantId) > 0;
    
    if (!hasValidProductId && !hasValidVariantId) {
      // Still show alert for unavailable products (this is an error case, not a success)
      console.warn('Product missing valid Shopify IDs after database fetch:', {
        productId: productToAdd?.productId,
        name: productToAdd?.name,
        shopifyProductId: productToAdd?.shopifyProductId,
        shopifyVariantId: productToAdd?.shopifyVariantId,
        shopifyProductIdType: typeof productToAdd?.shopifyProductId,
        shopifyVariantIdType: typeof productToAdd?.shopifyVariantId,
      });
      alert('This product is not yet available in our store. Please check back soon!');
      return;
    }

    // Add to global cart using CartContext (toast notification will be shown automatically)
    addToCart(productToAdd);
  };

  // Helper function to normalize category names
  const normalizeCategory = (cat) => {
    if (!cat) return '';
    return cat.toLowerCase().replace(/[^a-z0-9]/g, '-');
  };
  
  // Helper function to check if two products are in the same category
  const areProductsSameCategory = (product1, product2) => {
    const cat1 = normalizeCategory(product1.category || product1.originalCategory || '');
    const cat2 = normalizeCategory(product2.category || product2.originalCategory || '');
    
    if (!cat1 || !cat2) return false;
    
    // Check for exact match
    if (cat1 === cat2) return true;
    
    // Check if one contains the other or vice versa
    if (cat1.includes(cat2) || cat2.includes(cat1)) return true;
    
    // Map variations to common categories
    const categoryGroups = {
      'cleanser': ['cleanser', 'cleansing'],
      'toner': ['toner', 'essence'],
      'serum': ['serum', 'treatment'],
      'moisturizer': ['moisturizer', 'cream', 'lotion'],
      'spf': ['spf', 'sunscreen', 'sun-screen'],
      'eye-cream': ['eye-cream', 'eye_cream', 'eye'],
      'treatment': ['treatment', 'serum'],
    };
    
    // Check if both belong to same category group
    for (const [key, variants] of Object.entries(categoryGroups)) {
      const matches1 = variants.some(v => cat1.includes(v) || cat1 === v);
      const matches2 = variants.some(v => cat2.includes(v) || cat2 === v);
      if (matches1 && matches2) return true;
    }
    
    return false;
  };

  // Handle adding product to routine
  const handleAddToRoutine = (product) => {
    // Check if product is already in routine (same product)
    const isAlreadyAdded = selectedRoutineProducts.some(
      p => p.productId === product.productId || 
      (p.name === product.name && p.brand === product.brand)
    );
    
    if (isAlreadyAdded) {
      return; // Product already in routine
    }
    
    // Check if there's already a product from the same category
    const existingProductInCategory = selectedRoutineProducts.find(
      p => areProductsSameCategory(p, product)
    );
    
    if (existingProductInCategory) {
      // Show warning dialog
      setDuplicateWarningData({
        newProduct: product,
        existingProduct: existingProductInCategory
      });
      setShowDuplicateWarning(true);
      return;
    }
    
    // No duplicate category, add product
    setSelectedRoutineProducts(prev => [...prev, product]);
  };
  
  // Handle confirming duplicate category addition (replace or add anyway)
  const handleConfirmDuplicateAdd = (replace = false) => {
    if (!duplicateWarningData) return;
    
    if (replace) {
      // Replace existing product with new one
      setSelectedRoutineProducts(prev => 
        prev.filter(p => !areProductsSameCategory(p, duplicateWarningData.newProduct))
      );
    }
    // Add the new product
    setSelectedRoutineProducts(prev => [...prev, duplicateWarningData.newProduct]);
    
    // Close dialog
    setShowDuplicateWarning(false);
    setDuplicateWarningData(null);
  };
  
  // Handle removing product from routine
  const handleRemoveFromRoutine = (productId) => {
    setSelectedRoutineProducts(prev => prev.filter(p => p.productId !== productId));
  };

  // Handle clearing all products from routine
  const handleClearRoutine = () => {
    if (selectedRoutineProducts.length === 0) return;
    setShowClearRoutineDialog(true);
  };

  // Confirm clearing routine
  const handleConfirmClearRoutine = () => {
    setSelectedRoutineProducts([]);
    setShowClearRoutineDialog(false);
  };
  
  // Build routine from selected products
  const buildRoutineFromSelected = () => {
    // Define routine order for morning and evening
    const morningOrder = ['cleanser', 'toner', 'serum', 'eye_cream', 'moisturizer', 'spf'];
    const eveningOrder = ['cleanser', 'toner', 'serum', 'treatment', 'eye_cream', 'moisturizer'];
    
    // Use the shared normalizeCategory function defined above
    
    // Get category from product
    const getProductCategory = (product) => {
      return normalizeCategory(product.category || product.originalCategory || '');
    };
    
    // Build morning routine
    const morningSteps = [];
    let morningStepNumber = 1;
    morningOrder.forEach((category) => {
      const product = selectedRoutineProducts.find(p => {
        const prodCat = getProductCategory(p);
        return prodCat === category || 
               prodCat === category.replace('_', '-') ||
               prodCat.includes(category) ||
               category.includes(prodCat);
      });
      
      if (product) {
        const usage = normalizeCategory(product.usage || 'both');
        if (usage === 'morning' || usage === 'both') {
          morningSteps.push({
            step: morningStepNumber++,
            category: product.category || category,
            product: product,
            instruction: getInstructionForCategory(category, 'morning')
          });
        }
      }
    });
    
    // Build evening routine
    const eveningSteps = [];
    let eveningStepNumber = 1;
    eveningOrder.forEach((category) => {
      const product = selectedRoutineProducts.find(p => {
        const prodCat = getProductCategory(p);
        return prodCat === category || 
               prodCat === category.replace('_', '-') ||
               prodCat.includes(category) ||
               category.includes(prodCat);
      });
      
      if (product) {
        const usage = normalizeCategory(product.usage || 'both');
        if (usage === 'evening' || usage === 'both') {
          eveningSteps.push({
            step: eveningStepNumber++,
            category: product.category || category,
            product: product,
            instruction: getInstructionForCategory(category, 'evening')
          });
        }
      }
    });
    
    return { morning: morningSteps, evening: eveningSteps };
  };
  
  // Get instruction for category
  const getInstructionForCategory = (category, timeOfDay) => {
    const normalized = category.toLowerCase().replace('_', '-');
    const instructions = {
      'cleanser': timeOfDay === 'morning' 
        ? 'Optional in the morning if skin feels clean. Use lukewarm water.'
        : 'Double cleanse: First with oil-based cleanser (if wearing makeup/SPF), then with regular cleanser. Massage for 60 seconds.',
      'toner': timeOfDay === 'morning'
        ? 'Apply to clean skin with cotton pad or pat with hands.'
        : 'Apply to clean skin. If using exfoliating toner, start 2x/week and gradually increase.',
      'serum': timeOfDay === 'morning'
        ? 'Apply 2-3 drops to face and neck. Pat gently until absorbed. Wait 30 seconds before next step.'
        : 'Layer serums from thinnest to thickest. Wait 30 seconds between each.',
      'eye-cream': 'Gently pat a small amount around eye area using ring finger.',
      'eye_cream': 'Gently pat a small amount around eye area using ring finger.',
      'moisturizer': timeOfDay === 'morning'
        ? 'Apply evenly to face and neck. Let it absorb for 1-2 minutes.'
        : 'Apply generously. Can layer with face oil if very dry.',
      'spf': 'Apply generously (2 finger lengths). This is the most important step! Reapply every 2 hours if outdoors.',
      'treatment': 'Apply treatment product (retinol/acids). Start 2x/week, build up to daily. Always follow with moisturizer.'
    };
    
    return instructions[normalized] || 'Apply as directed.';
  };
  
  // Handle adding all routine products to cart and redirecting to Shopify with discount code
  const handleAddRoutineToCart = async () => {
    const routine = buildRoutineFromSelected();
    const routineProducts = getRoutineProducts(routine.morning, routine.evening);
    const productIds = routineProducts.map(p => p.productId).filter(Boolean);
    
    if (productIds.length === 0) {
      alert('No products found in your routine.');
      return;
    }

    const shopifyStoreUrl = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL || '';

    if (!shopifyStoreUrl) {
      alert('Shopify store is not configured. Please contact support.');
      return;
    }

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds }),
      });

      const data = await response.json();

      if (data.success && data.products) {
        const productsWithShopify = data.products.filter(
          p => p.shopifyProductId || p.shopifyVariantId
        );
        
        if (productsWithShopify.length === 0) {
          alert('None of the routine products are available in our store yet. Please check back soon!');
          return;
        }

        // Fetch variant IDs for products that need them
        const result = await fetchVariantIdsFromProductIds(productsWithShopify);

        if (result.error) {
          alert(result.error + (result.suggestion ? '\n\n' + result.suggestion : ''));
          return;
        }

        // Get products with variant IDs
        const productsWithVariants = result.products.filter(p => p.shopifyVariantId);

        if (productsWithVariants.length === 0) {
          alert('No products have valid variant IDs. Please try again or contact support.');
          return;
        }

        // Convert to cart items format
        const cartItems = productsToCartItems(productsWithVariants);

        // Get phone number from customerInfo if available (only when checking out from recommendation app)
        const phoneNumber = customerInfo?.phone || null;

        // Build Shopify cart URL with phone number
        const cartUrl = buildShopifyCartUrl(cartItems, shopifyStoreUrl, null, phoneNumber);

        if (cartUrl) {
          // Redirect to Shopify cart with discount code and phone number applied
          window.open(cartUrl, '_blank');
        } else {
          alert('Unable to build cart URL. Please try again.');
        }
      } else {
        alert('Unable to load product information. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      alert('Error loading products. Please try again.');
    }
  };

  // Handle "Shop Something Else" button - redirects to store
  const handleShopSomethingElse = () => {
    const shopifyStoreUrl = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL || '';

    if (!shopifyStoreUrl) {
      alert('Shopify store is not configured. Please contact support.');
      return;
    }

    // Get phone number from customerInfo if available (only when checking out from recommendation app)
    const phoneNumber = customerInfo?.phone || null;

    // Build browse URL with phone number
    const browseUrl = buildShopifyBrowseUrl(shopifyStoreUrl, null, 'collections/all', phoneNumber);

    if (browseUrl) {
      // Redirect to Shopify store with discount code and phone number applied
      window.open(browseUrl, '_blank');
    } else {
      alert('Unable to build store URL. Please try again.');
    }
  };

  // Get products from phased recommendations (only first product per category for main display)
  const getPhaseProducts = (phase) => {
    if (!phasedRecommendations || !phasedRecommendations[phase]) {
      return [];
    }
    const products = [];
    Object.entries(phasedRecommendations[phase]).forEach(([category, categoryProducts]) => {
      if (Array.isArray(categoryProducts) && categoryProducts.length > 0) {
        // Only show the first product (best match) in the main list
        const firstProduct = categoryProducts[0];
        products.push({ ...firstProduct, category });
      }
    });
    return products;
  };

  // Get all products from recommendations (fallback if phased recommendations not available)
  // Only first product per category for main display
  const getAllProducts = () => {
    const products = [];
    Object.entries(recommendations || {}).forEach(([category, categoryProducts]) => {
      if (Array.isArray(categoryProducts) && categoryProducts.length > 0) {
        // Only show the first product (best match) in the main list
        const firstProduct = categoryProducts[0];
        products.push({ ...firstProduct, category });
      }
    });
    return products;
  };

  // Get alternatives for a specific product
  const getAlternativesForProduct = (product) => {
    if (!product || !product.category) {
      return [];
    }

    const category = product.category;
    const alternatives = [];

    // Check phased recommendations first
    if (phasedRecommendations) {
      // Search through all phases
      ['phase1', 'phase2', 'phase3'].forEach((phase) => {
        if (phasedRecommendations[phase] && phasedRecommendations[phase][category]) {
          const categoryProducts = phasedRecommendations[phase][category];
          if (Array.isArray(categoryProducts)) {
            // Find the index of the current product
            const currentIndex = categoryProducts.findIndex(
              p => p.productId === product.productId || 
                   (p.name === product.name && p.brand === product.brand)
            );
            
            // Get all products after the first one (alternatives)
            if (currentIndex === 0 && categoryProducts.length > 1) {
              // Current product is the first, so alternatives are from index 1 onwards
              categoryProducts.slice(1).forEach((altProduct) => {
                alternatives.push({ ...altProduct, category });
              });
            }
          }
        }
      });
    }

    // Fallback to regular recommendations if no phased recommendations
    if (alternatives.length === 0 && recommendations && recommendations[category]) {
      const categoryProducts = recommendations[category];
      if (Array.isArray(categoryProducts)) {
        const currentIndex = categoryProducts.findIndex(
          p => p.productId === product.productId || 
               (p.name === product.name && p.brand === product.brand)
        );
        
        if (currentIndex === 0 && categoryProducts.length > 1) {
          categoryProducts.slice(1).forEach((altProduct) => {
            alternatives.push({ ...altProduct, category });
          });
        }
      }
    }

    return alternatives;
  };



  // Get products for each phase
  const phase1Products = phasedRecommendations ? getPhaseProducts('phase1') : [];
  const phase2Products = phasedRecommendations ? getPhaseProducts('phase2') : [];
  const phase3Products = phasedRecommendations ? getPhaseProducts('phase3') : [];
  
  // Check if we have phased recommendations
  const hasPhasedRecommendations = phasedRecommendations && 
    (phase1Products.length > 0 || phase2Products.length > 0 || phase3Products.length > 0);
  
  // Fallback to all products if no phased recommendations
  const allProducts = hasPhasedRecommendations ? [] : getAllProducts();
  

  // Helper function to count profile factors analyzed
  const countProfileFactors = () => {
    const factors = [
      profile?.skinType,
      profile?.sensitivity,
      profile?.ageRange,
      profile?.currentRoutine,
      profile?.sunExposure,
      profile?.climate,
      profile?.lifestyleFactors,
      profile?.acneSeverity,
      profile?.facialHairRemovalMethod,
      profile?.facialHairRemovalFrequency,
      profile?.makeupType,
      profile?.stressSkinIssues,
    ].filter(Boolean);
    
    // Count lifestyle factors as individual factors if it's an array
    let count = 0;
    factors.forEach(factor => {
      if (Array.isArray(factor)) {
        count += factor.length;
      } else {
        count += 1;
      }
    });
    
    return Math.max(count, 8); // Minimum of 8 to be conservative
  };

  // Helper function to format skin type for display
  const formatSkinType = (skinType) => {
    if (!skinType) return '';
    return skinType.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Helper function to format concern names
  const formatConcernName = (concern) => {
    const name = concern.name || concern.concern || '';
    const concernMap = {
      'acne': 'Acne & Breakouts',
      'pigmentation': 'Pigmentation & Dark Spots',
      'aging': 'Fine Lines & Aging',
      'dryness': 'Dryness & Dehydration',
      'oiliness': 'Excess Oil',
      'redness': 'Redness & Sensitivity',
      'dullness': 'Dullness & Uneven Tone',
      'dark-circles': 'Dark Circles',
      'pores': 'Enlarged Pores',
      'texture': 'Uneven Texture',
    };
    return concernMap[name.toLowerCase()] || name;
  };

  // Generate personalized diagnosis narrative
  const generateDiagnosis = () => {
    if (!profile || !concerns || concerns.length === 0) return '';
    
    const skinType = formatSkinType(profile.skinType);
    const sentences = [];
    
    // Build subject for skin (avoid awkward "Not Sure skin")
    const hasMeaningfulSkinType = skinType && skinType.toLowerCase() !== 'not sure';
    const skinSubject = hasMeaningfulSkinType ? `${skinType} skin` : 'skin';
    
    // Start with skin type assessment
    if (skinSubject) {
      let baseClause = '';

      const topConcern = concerns[0];
      if (topConcern) {
        const concernName = formatConcernName(topConcern).toLowerCase();
        if (concernName.includes('acne') || concernName.includes('breakout')) {
          baseClause = 'is currently experiencing breakouts';
        } else if (concernName.includes('pigmentation') || concernName.includes('dark spot')) {
          baseClause = 'is showing signs of pigmentation';
        } else if (concernName.includes('dryness') || concernName.includes('dehydration')) {
          baseClause = 'is experiencing dehydration';
        } else if (concernName.includes('aging') || concernName.includes('fine line')) {
          baseClause = 'is showing early signs of aging';
        } else {
          baseClause = 'may be experiencing changes';
        }
      } else {
        baseClause = 'may be experiencing changes';
      }

      sentences.push(`Based on your profile, your ${skinSubject} ${baseClause}.`);
    }
    
    // Add sun exposure connection if relevant
    if (profile.sunExposure && ['high', 'moderate'].includes(profile.sunExposure.toLowerCase())) {
      const pigmentationConcern = concerns.find(c => 
        (c.name || c.concern || '').toLowerCase().includes('pigmentation') ||
        (c.name || c.concern || '').toLowerCase().includes('dark')
      );
      if (pigmentationConcern) {
        const sunLevel = profile.sunExposure === 'high' ? 'frequent' : 'regular';
        sentences.push(`Your ${sunLevel} sun exposure can contribute to the pigmentation you're seeing.`);
      }
    }
    
    // Add stress connection if relevant
    if (profile.stressSkinIssues && Array.isArray(profile.stressSkinIssues) && profile.stressSkinIssues.length > 0) {
      const acneConcern = concerns.find(c => 
        (c.name || c.concern || '').toLowerCase().includes('acne') ||
        (c.name || c.concern || '').toLowerCase().includes('breakout')
      );
      if (acneConcern) {
        sentences.push('Stress factors in your lifestyle may be contributing to inflammation and occasional breakouts.');
      }
    }
    
    // Add climate connection if relevant
    if (profile.climate) {
      const climateFormatted = profile.climate.replace('-', ' ');
      const oilinessConcern = concerns.find(c => 
        (c.name || c.concern || '').toLowerCase().includes('oil')
      );
      if (oilinessConcern && ['humid', 'tropical'].includes(profile.climate.toLowerCase())) {
        sentences.push(`The ${climateFormatted} climate you're in can exacerbate oil production.`);
      }
    }
    
    return sentences.join(' ');
  };

  // Generate strategy with priorities and timelines
  const generateStrategy = () => {
    if (!concerns || concerns.length === 0) return [];
    
    // Sort concerns by priority score (highest first)
    const sortedConcerns = [...concerns].sort((a, b) => {
      const scoreA = a.priorityScore || 1;
      const scoreB = b.priorityScore || 1;
      return scoreB - scoreA;
    });
    
    const strategies = [];
    
    // High priority (top 1-2 concerns)
    sortedConcerns.slice(0, 2).forEach((concern, index) => {
      const concernName = formatConcernName(concern);
      const timeline = getTimelineForConcern(concern);
      const why = getStrategyWhy(concern, sortedConcerns);
      
      strategies.push({
        priority: 'high',
        title: getStrategyTitle(concern),
        timeline: timeline,
        why: why,
        concern: concernName,
      });
    });
    
    // Secondary goals (remaining concerns)
    sortedConcerns.slice(2, 4).forEach((concern) => {
      const concernName = formatConcernName(concern);
      const timeline = getTimelineForConcern(concern);
      const why = getStrategyWhy(concern, sortedConcerns);
      
      strategies.push({
        priority: 'secondary',
        title: getStrategyTitle(concern),
        timeline: timeline,
        why: why,
        concern: concernName,
      });
    });
    
    return strategies;
  };

  // Get strategy title based on concern
  const getStrategyTitle = (concern) => {
    const concernName = (concern.name || concern.concern || '').toLowerCase();
    if (concernName.includes('acne') || concernName.includes('breakout')) {
      return 'Acne Control';
    } else if (concernName.includes('pigmentation') || concernName.includes('dark')) {
      return 'Brightening';
    } else if (concernName.includes('dryness') || concernName.includes('dehydration')) {
      return 'Barrier Repair';
    } else if (concernName.includes('redness') || concernName.includes('sensitivity')) {
      return 'Calming & Repair';
    } else if (concernName.includes('aging') || concernName.includes('fine line')) {
      return 'Anti-Aging';
    } else if (concernName.includes('oil')) {
      return 'Oil Balance';
      } else {
      return 'Treatment';
    }
  };

  // Get timeline based on concern type
  const getTimelineForConcern = (concern) => {
    const concernName = (concern.name || concern.concern || '').toLowerCase();
    if (concernName.includes('acne') || concernName.includes('breakout')) {
      return 'Typically 4-8 weeks';
    } else if (concernName.includes('pigmentation') || concernName.includes('dark')) {
      return 'Generally 8-12 weeks with consistent use';
    } else if (concernName.includes('dryness') || concernName.includes('dehydration') || concernName.includes('barrier')) {
      return 'Typically 2-4 weeks for improvement';
    } else if (concernName.includes('redness') || concernName.includes('sensitivity')) {
      return 'Typically 2-4 weeks to see calming effects';
    } else if (concernName.includes('aging') || concernName.includes('fine line')) {
      return 'Generally 8-12 weeks for visible results';
    } else if (concernName.includes('oil')) {
      return 'Typically 3-6 weeks to balance';
    } else {
      return 'Generally 4-8 weeks with consistent use';
    }
  };

  // Get strategy explanation
  const getStrategyWhy = (concern, allConcerns) => {
    const concernName = (concern.name || concern.concern || '').toLowerCase();
    
    // Check if this is a secondary goal that depends on another concern
    if (concernName.includes('pigmentation') || concernName.includes('dark')) {
      const barrierConcern = allConcerns.find(c => 
        (c.name || c.concern || '').toLowerCase().includes('dryness') ||
        (c.name || c.concern || '').toLowerCase().includes('barrier') ||
        (c.name || c.concern || '').toLowerCase().includes('redness')
      );
      if (barrierConcern && allConcerns.indexOf(concern) > allConcerns.indexOf(barrierConcern)) {
        return 'To help fade dark spots once your barrier is strengthened';
      }
      return 'To help fade dark spots and even out skin tone';
    } else if (concernName.includes('dryness') || concernName.includes('barrier')) {
      const inflammationConcern = allConcerns.find(c => 
        (c.name || c.concern || '').toLowerCase().includes('redness') ||
        (c.name || c.concern || '').toLowerCase().includes('acne')
      );
      if (inflammationConcern) {
        return 'We must strengthen your barrier to support effective treatment of other concerns';
      }
      return 'To restore your skin\'s protective barrier and hydration';
    } else if (concernName.includes('acne') || concernName.includes('breakout')) {
      return 'To reduce active breakouts and prevent future ones';
    } else if (concernName.includes('redness') || concernName.includes('sensitivity')) {
      return 'To calm inflammation and soothe irritation';
    } else if (concernName.includes('aging')) {
      return 'To reduce fine lines and support skin firmness';
    } else if (concernName.includes('oil')) {
      return 'To balance sebum production without over-drying';
    } else {
      return 'To address your specific skin concerns';
    }
  };

  // Extract key active ingredients from recommended products
  const extractKeyIngredients = () => {
    const allProductsToCheck = hasPhasedRecommendations 
      ? [...phase1Products, ...phase2Products, ...phase3Products]
      : allProducts;
    
    const ingredientSet = new Set();
    
    allProductsToCheck.forEach(product => {
      if (product.keyIngredients && Array.isArray(product.keyIngredients)) {
        product.keyIngredients.forEach(ingredient => {
          // Format ingredient name (remove hyphens, capitalize)
          const formatted = ingredient
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          ingredientSet.add(formatted);
        });
      }
      
      // Also check if product is SPF - add it as an ingredient if it's an SPF product
      if (product.category && (product.category.toLowerCase() === 'spf' || product.category.toLowerCase() === 'sunscreen')) {
        ingredientSet.add('SPF');
      }
    });
    
    // Return top 5-6 most relevant ingredients
    return Array.from(ingredientSet).slice(0, 6);
  };

  // Generate personalized content
  const factorCount = countProfileFactors();
  const diagnosis = generateDiagnosis();
  const strategies = generateStrategy();
  const keyIngredients = extractKeyIngredients();

  // State for "Why?" dialog
  const [whyDialogOpen, setWhyDialogOpen] = useState(false);
  const [selectedProductForWhy, setSelectedProductForWhy] = useState(null);

  // Get emoji for ingredient category
  const getIngredientEmoji = (ingredientKey) => {
    if (!ingredientKey) return '🌿';
    
    const key = ingredientKey.toLowerCase();
    
    // Soothing & Repair (Cica, Snail, Aloe)
    if (key.includes('centella') || key.includes('cica') || key.includes('madecassoside') || 
        key.includes('mugwort') || key.includes('guaiazulene') || key.includes('allantoin') ||
        key.includes('aloe')) {
      return '🌿';
    }
    
    // Hydration
    if (key.includes('hyaluronic') || key.includes('hyaluronate') || key.includes('betaine') ||
        key.includes('birch')) {
      return '💧';
    }
    
    // Anti-Aging & Vitamins
    if (key.includes('retinal') || key.includes('peptide') || key.includes('adenosine') ||
        key.includes('vitamin') || key.includes('ginseng')) {
      return '✨';
    }
    
    // Brightening
    if (key.includes('vitamin-c') || key.includes('ascorbic') || key.includes('arbutin') ||
        key.includes('tranexamic') || key.includes('rice') || key.includes('niacinamide')) {
      return '🌟';
    }
    
    // Acne & Exfoliation
    if (key.includes('tea-tree') || key.includes('bha') || key.includes('aha') ||
        key.includes('pha') || key.includes('salicylic') || key.includes('zinc')) {
      return '🧪';
    }
    
    // Barrier & Oils
    if (key.includes('ceramide') || key.includes('squalane') || key.includes('jojoba') ||
        key.includes('shea')) {
      return '🛡️';
    }
    
    // Sun Protection
    if (key.includes('uv') || key.includes('sun') || key.includes('spf')) {
      return '☀️';
    }
    
    return '🌿'; // Default
  };

  // Section 1: The Match (Why You?) - Generate personalized explanation
  const getMatchExplanation = (product) => {
    if (!product || !profile || !concerns || concerns.length === 0) {
      return {
        goal: 'Skin Health',
        explanation: 'This product has been selected based on your skin profile and concerns.'
      };
    }

    const topConcerns = [...concerns].sort((a, b) => (b.priorityScore || 1) - (a.priorityScore || 1));
    const productConcerns = product.concernsAddressed || [];
    const normalizedProductConcerns = productConcerns.map(c => c.toLowerCase());

    // Find primary matching concern
    const matchedConcern = topConcerns.find(c => {
      const concernName = (c.name || c.concern || '').toLowerCase();
      return normalizedProductConcerns.some(pc => 
        pc.includes(concernName) || concernName.includes(pc) ||
        (concernName.includes('acne') && (pc.includes('acne') || pc.includes('breakout'))) ||
        (concernName.includes('pigmentation') && (pc.includes('pigmentation') || pc.includes('dark'))) ||
        (concernName.includes('dryness') && (pc.includes('dryness') || pc.includes('barrier'))) ||
        (concernName.includes('aging') && (pc.includes('aging') || pc.includes('wrinkle'))) ||
        (concernName.includes('redness') && (pc.includes('redness') || pc.includes('sensitivity')))
      );
    });

    let goal = 'Skin Health';
    let explanation = '';

    if (matchedConcern) {
      const concernName = formatConcernName(matchedConcern);
      goal = concernName;

      // Build personalized explanation
      const explanationParts = [];

      // Check if user has sensitivity
      const hasSensitivity = profile.sensitivity && ['sensitive', 'very-sensitive'].includes(profile.sensitivity.toLowerCase());
      
      // Check product category/format
      const isSerum = product.category === 'serum' || product.name?.toLowerCase().includes('serum');
      const isSPF = product.category === 'spf' || product.name?.toLowerCase().includes('sun') || product.name?.toLowerCase().includes('spf');
      const isLightweight = product.texture && ['gel', 'lightweight', 'gel-cream'].includes(product.texture.toLowerCase());

      if (concernName.toLowerCase().includes('aging')) {
        if (isSPF) {
          if (hasSensitivity) {
            explanation = `Unlike standard heavy sunscreens, this serum format protects you from UV damage (the #1 cause of aging) while soothing your reactive skin.`;
          } else {
            explanation = `Unlike standard heavy sunscreens, this lightweight formula protects you from UV damage (the #1 cause of aging) without feeling greasy.`;
          }
        } else if (hasSensitivity) {
          explanation = `This gentle formula targets age-related concerns while respecting your sensitive skin barrier.`;
        } else {
          explanation = `This formula was chosen to target your aging concerns effectively without compromising your skin barrier.`;
        }
      } else if (concernName.toLowerCase().includes('acne') || concernName.toLowerCase().includes('breakout')) {
        if (profile.skinType && profile.skinType.toLowerCase().includes('oil')) {
          explanation = `Addresses your acne concerns while controlling oil production without over-drying.`;
        } else if (hasSensitivity) {
          explanation = `Gentle acne-fighting formula that treats breakouts while calming your sensitive skin.`;
        } else {
          explanation = `This formula targets active breakouts and prevents future ones without irritation.`;
        }
      } else if (concernName.toLowerCase().includes('pigmentation') || concernName.toLowerCase().includes('dark')) {
        if (profile.sunExposure && ['high', 'moderate'].includes(profile.sunExposure.toLowerCase())) {
          explanation = `Fades pigmentation worsened by your sun exposure while protecting against further damage.`;
        } else if (hasSensitivity) {
          explanation = `Gentle brightening formula that addresses pigmentation without irritating your reactive skin.`;
        } else {
          explanation = `This formula effectively targets dark spots and uneven tone for a brighter complexion.`;
        }
      } else if (concernName.toLowerCase().includes('dryness') || concernName.toLowerCase().includes('barrier')) {
        if (profile.skinType && profile.skinType.toLowerCase().includes('dry')) {
          explanation = `Strengthens your dry skin's barrier while providing deep, lasting hydration.`;
        } else if (hasSensitivity) {
          explanation = `Repairs your compromised barrier while soothing irritation and reducing redness.`;
        } else {
          explanation = `Restores your skin's protective barrier and prevents moisture loss.`;
        }
      } else if (concernName.toLowerCase().includes('redness') || concernName.toLowerCase().includes('sensitivity')) {
        explanation = `Calms inflammation and soothes irritation while strengthening your skin's natural defenses.`;
      } else {
        explanation = `This formula was chosen to target your ${concernName.toLowerCase()} concerns effectively.`;
      }
    } else if (profile.skinType) {
      // Fallback to skin type match
      const skinTypeFormatted = formatSkinType(profile.skinType);
      const isNotSureSkinType = skinTypeFormatted && skinTypeFormatted.toLowerCase() === 'not sure';

      goal = isNotSureSkinType ? 'Balanced, healthy skin' : skinTypeFormatted;

      if (product.skinTypes && product.skinTypes.some(st => st.toLowerCase() === profile.skinType?.toLowerCase())) {
        explanation = isNotSureSkinType
          ? 'Formulated to be gentle and balanced for most skin types, including when you are still learning your skin.'
          : `Formulated specifically for your ${skinTypeFormatted.toLowerCase()} skin type.`;
      } else {
        explanation = isNotSureSkinType
          ? 'Selected to work harmoniously even when your exact skin type is still being figured out.'
          : `Selected to work harmoniously with your ${skinTypeFormatted.toLowerCase()} skin.`;
      }
    }

    if (!explanation) {
      explanation = 'This product has been selected based on your skin profile and concerns.';
    }

    return { goal, explanation };
  };

  // Section 2: The Science (How it Works) - Get key actives with emoji and description
  const getKeyActives = (product) => {
    if (!product || !product.keyIngredients || product.keyIngredients.length === 0) {
      return [];
    }

    const actives = product.keyIngredients.slice(0, 3).map(ingredientKey => {
      const details = ingredientDictionary[ingredientKey];
      const emoji = getIngredientEmoji(ingredientKey);

      if (details) {
        return {
          emoji,
          name: details.name,
          benefit: details.benefit
        };
      }

      // Fallback: format the key if not in dictionary
      const formattedName = ingredientKey.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      return {
        emoji,
        name: formattedName,
        benefit: 'Active ingredient for skin treatment.'
      };
    });

    return actives;
  };

  // Section 3: Usage Tip - Get usage tip based on category
  const getUsageTip = (product) => {
    if (!product) {
      return 'Use consistently for at least 4 weeks to see visible results.';
    }

    const category = product.category?.toLowerCase() || '';
    const name = product.name?.toLowerCase() || '';
    const isSPF = category === 'spf' || name.includes('sun') || name.includes('spf') || name.includes('sunscreen');
    const isSerum = category === 'serum' || name.includes('serum');
    const texture = product.texture?.toLowerCase() || '';
    const isLightweight = ['gel', 'lightweight', 'gel-cream'].includes(texture);

    if (isSPF) {
      if (isLightweight || isSerum) {
        return 'Apply generously as the final step. Its lightweight texture means no white cast, even on deeper skin tones.';
      }
      return 'Apply generously as the final step. Reapply every 2 hours if outdoors.';
    } else if (isSerum) {
      return 'Apply to slightly damp skin to lock in extra hydration.';
    } else if (category === 'cleanser') {
      return 'Use morning and evening. Massage gently for 30 seconds, then rinse thoroughly.';
    } else if (category === 'moisturizer') {
      return 'Apply after serums. Use morning and evening for optimal barrier support.';
    } else if (category === 'toner') {
      return 'Apply to clean skin with a cotton pad or pat in with hands.';
    } else {
      return 'Use consistently for at least 4 weeks to see visible results.';
    }
  };
  
  // Component to render a product card - memoized with custom comparison to prevent re-renders
  const ProductCard = memo(({ product }) => {
    const alternatives = getAlternativesForProduct(product);
    // Create carousel items
    const carouselProducts = useMemo(() => [product, ...alternatives], [product, alternatives]);
    const hasMultipleOptions = carouselProducts.length > 1;
    
    // Refs
    const carouselRef = useRef(null);
    const productId = product.productId;
    const hasInitializedRef = useRef(false);

    // Save scroll position immediately (without triggering re-render)
    const saveScrollPosition = () => {
      if (carouselRef.current && productId) {
        carouselScrollPositionsRef.current[productId] = carouselRef.current.scrollLeft;
      }
    };

    // Callback ref - initialize scroll position ONLY once on mount
    // Never restore during re-renders to prevent animation
    const setCarouselRef = (element) => {
      if (!element) {
        carouselRef.current = null;
        return;
      }
      
      carouselRef.current = element;
      
      // ONLY restore on the very first mount, never again
      if (!hasInitializedRef.current) {
        const savedPosition = carouselScrollPositionsRef.current[productId];
        if (savedPosition !== undefined && savedPosition > 0) {
          // Temporarily disable smooth scrolling for instant restoration
          element.style.scrollBehavior = 'auto';
          element.scrollLeft = savedPosition;
          // Re-enable smooth scrolling after restoration
          requestAnimationFrame(() => {
            if (element) {
              element.style.scrollBehavior = '';
            }
          });
        }
        hasInitializedRef.current = true;
      }
      // After initialization, NEVER touch scroll position - let it persist naturally
    };

    // Save scroll position when it changes (continuously, without triggering re-render)
    const handleScroll = () => {
      if (carouselRef.current && productId) {
        // Save directly to ref immediately (no re-render, no delays)
        carouselScrollPositionsRef.current[productId] = carouselRef.current.scrollLeft;
      }
    };

    // Manual Scroll Buttons (Left/Right arrows)
    const scrollCarousel = (direction) => {
      if (carouselRef.current) {
        saveScrollPosition(); // Save current position before scrolling
        const containerWidth = carouselRef.current.clientWidth;
        const scrollAmount = containerWidth + 24; 
        const newScrollLeft = carouselRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
        
        carouselRef.current.scrollTo({
          left: newScrollLeft,
          behavior: 'smooth'
        });
        
        // Update scroll position after scroll animation completes
        setTimeout(() => {
          if (carouselRef.current && productId) {
            saveScrollPosition();
          }
        }, 300);
    }
  };

  return (
      <div 
        className="border border-gray-200 rounded-lg p-3 sm:p-4 md:p-5 w-full bg-white shadow-sm relative"
        style={{ maxWidth: '100%', overflow: 'hidden' }}
      >

        {/* Navigation Header */}
        {hasMultipleOptions && (
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-1 rounded" style={{ color: '#008080', backgroundColor: 'rgba(0, 128, 128, 0.1)' }}>
                {carouselProducts.length} Options
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 hidden sm:inline">
                Swipe for alternatives
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => scrollCarousel('left')}
                  className="p-2 sm:p-1.5 rounded hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
                  aria-label="Previous product"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => scrollCarousel('right')}
                  className="p-2 sm:p-1.5 rounded hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
                  aria-label="Next product"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Product Display - Scrollable Carousel */}
        <div 
          ref={setCarouselRef}
          onScroll={handleScroll}
          className="flex items-start gap-6 overflow-x-auto snap-x snap-mandatory"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollBehavior: 'auto' // Prevent smooth scrolling animation during restoration
          }}
        >
          {carouselProducts.map((carouselProduct, idx) => (
            <div
              key={`${product.productId}-${idx}`}
              className="flex-shrink-0 snap-start flex flex-col"
              style={{ 
                flexBasis: '100%',
                width: '100%',
                minWidth: '100%'
              }}
            >
              {/* Product Info Row */}
              <div className="flex-1 relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                      <h4 className="font-semibold text-sm sm:text-base text-gray-900 break-words">{carouselProduct.name || 'Unknown Product'}</h4>
                      {/* Wishlist Heart Icon - Next to Product Name */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          saveScrollPosition();
                          const currentlyInWishlist = isProductInWishlist(carouselProduct.productId);
                          if (currentlyInWishlist) {
                            removeFromWishlist(carouselProduct.productId, consultationId, customerInfo);
                          } else {
                            addToWishlist(carouselProduct, consultationId, customerInfo);
                          }
                        }}
                        className="group p-1.5 sm:p-1 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 touch-manipulation flex-shrink-0 flex items-center justify-center"
                        aria-label={isProductInWishlist(carouselProduct.productId) ? 'Remove from wishlist' : 'Add to wishlist'}
                        style={{ minWidth: '32px', minHeight: '32px' }}
                      >
                        <Heart 
                          className={`w-5 h-5 sm:w-4 sm:h-4 transition-all duration-200 ${
                            isProductInWishlist(carouselProduct.productId)
                              ? 'fill-[#008080] text-[#008080]' 
                              : 'text-gray-400 group-hover:text-[#008080]'
                          }`}
                        />
                      </button>
                      {carouselProduct.bestAvailableMatches && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                          Best available matches
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">{carouselProduct.brand || ''}</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">{formatCategoryName(carouselProduct.category, carouselProduct)}</p>
                    {carouselProduct.showSensitivityWarning && (
                      <p className="text-xs sm:text-sm text-red-600 mt-2 font-medium">
                        ⚠️ Not recommended for sensitive skin
                      </p>
                    )}
                  </div>
                  <div className="ml-2 sm:ml-4 flex-shrink-0">
                    <p className="text-base sm:text-lg font-semibold text-[var(--color-text-primary)] whitespace-nowrap">
                      {carouselProduct.mrp ? (typeof carouselProduct.mrp === 'string' ? carouselProduct.mrp : `₹${parseFloat(carouselProduct.mrp).toFixed(2)}`) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons Row */}
              <div className="mt-auto pt-3 sm:pt-4 flex justify-center">
                <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-3 w-full max-w-lg">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      saveScrollPosition(); // Save current scroll position before opening dialog
                      setSelectedProductForWhy(carouselProduct);
                      setWhyDialogOpen(true);
                    }}
                    className="flex-1 min-w-[100px] sm:min-w-[120px] px-3 sm:px-4 py-3 sm:py-2.5 text-sm sm:text-base text-[var(--color-action-primary)] border border-[var(--color-action-primary)]/40 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 font-medium bg-white touch-manipulation"
                    style={{ minHeight: '44px' }}
                  >
                    <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Why?</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      saveScrollPosition(); // Save current scroll position before adding to routine
                      handleAddToRoutine(carouselProduct);
                    }}
                    className="flex-1 min-w-[100px] sm:min-w-[120px] px-3 sm:px-4 py-3 sm:py-2.5 text-sm sm:text-base bg-[var(--color-action-primary)] text-[var(--color-text-on-action)] rounded-lg hover:bg-[var(--color-action-hover)] active:opacity-90 transition-colors font-semibold touch-manipulation"
                    style={{ minHeight: '44px' }}
                  >
                    Add to Routine
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      saveScrollPosition(); // Save current scroll position before adding to cart
                      handleAddToCart(carouselProduct);
                    }}
                    className="flex-1 min-w-[100px] sm:min-w-[120px] px-3 sm:px-4 py-3 sm:py-2.5 text-sm sm:text-base bg-[var(--color-text-primary)] text-[var(--color-text-on-action)] rounded-lg hover:opacity-90 active:opacity-80 transition-colors font-semibold touch-manipulation"
                    style={{ minHeight: '44px' }}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Only re-render if the product ID changes
    // We ignore parent state changes to prevent the "Jump" bug
    return prevProps.product.productId === nextProps.product.productId;
  });

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] py-4 sm:py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6">
        {/* Header - Only show if not hidden (i.e., when viewing from consultation flow) */}
        {!hideSaveForm && (
          <div className="mb-6 sm:mb-8 md:mb-10 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2" style={{ color: '#5C4033' }}>Your Personalized Skincare Report</h1>
          </div>
        )}


        {/* Save Report Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent className="w-[95vw] sm:w-full sm:max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Save Your Report</DialogTitle>
              <DialogDescription className="text-gray-600">
                Enter your WhatsApp number to save your routine and access it later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label htmlFor="save-contact" className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  WhatsApp Number
                </label>
                <input
                  id="save-contact"
                  type="tel"
                  value={saveContact}
                  onChange={(e) => setSaveContact(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': 'var(--color-action-primary)' }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-action-primary)';
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0, 128, 128, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '';
                    e.currentTarget.style.boxShadow = '';
                  }}
                />
              </div>
              {saveError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {saveError}
                </div>
              )}
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-end">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveError('');
                  setSaveContact('');
                }}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors touch-manipulation font-medium"
                disabled={isSaving}
                style={{ minHeight: '44px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDialogSubmit}
                disabled={isSaving}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-[var(--color-action-primary)] text-[var(--color-text-on-action)] rounded-lg hover:bg-[var(--color-action-hover)] active:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation font-medium"
                style={{ minHeight: '44px' }}
              >
                {isSaving ? 'Saving...' : 'Save Report'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Why? Dialog */}
        <Dialog open={whyDialogOpen} onOpenChange={setWhyDialogOpen}>
          <DialogContent className="w-[95vw] sm:w-full sm:max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
            {selectedProductForWhy && (
              <>
                {/* Header: Product Name */}
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-gray-900 leading-tight pr-8">
                    {selectedProductForWhy.name || 'Product'}
                  </DialogTitle>
                  {selectedProductForWhy.brand && (
                    <p className="text-sm font-medium mt-1" style={{ color: '#5C4033' }}>{selectedProductForWhy.brand}</p>
                  )}
                </DialogHeader>

                <div className="py-4 space-y-6">
                  {/* Section 1: The Match (Why You?) */}
                  {(() => {
                    const match = getMatchExplanation(selectedProductForWhy);
                    return (
                      <div className="rounded-xl p-4 border border-[var(--color-border-subtle)] bg-[var(--color-block-green)]">
                        <div className="flex items-start gap-3">
                          <span className="text-[var(--color-action-primary)] text-lg flex-shrink-0 mt-0.5">✅</span>
                          <div>
                            <h4 className="font-bold text-[var(--color-text-primary)] text-sm mb-1">Best Match For:</h4>
                            <p className="text-sm text-[rgba(92,64,51,0.9)] leading-relaxed mb-2">
                              Your goal of <span className="font-semibold">{match.goal}</span>
                              {profile?.sensitivity && ['sensitive', 'very-sensitive'].includes(profile.sensitivity.toLowerCase()) 
                                ? ` combined with ${profile.sensitivity === 'very-sensitive' ? 'High ' : ''}Sensitivity.`
                                : '.'}
                            </p>
                            <p className="text-sm text-[rgba(92,64,51,0.9)] leading-relaxed">
                              <span className="font-semibold">Why we picked it:</span> {match.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Section 2: The Science (How it Works) */}
                  {(() => {
                    const keyActives = getKeyActives(selectedProductForWhy);
                    if (keyActives.length === 0) return null;
                    
                    return (
          <div>
                        <h4 className="font-bold text-gray-900 text-sm mb-4 mt-2">Key Actives:</h4>
                        <ul className="space-y-3">
                          {keyActives.map((active, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-lg flex-shrink-0 mt-0.5">{active.emoji}</span>
                              <span>
                                <strong className="text-gray-900">{active.name}:</strong> {active.benefit}
                              </span>
                            </li>
                          ))}
                        </ul>
          </div>
                    );
                  })()}

                  {/* Section 3: Usage Tip */}
                  {(() => {
                    const usageTip = getUsageTip(selectedProductForWhy);
                    return (
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                        <div className="flex items-start gap-3">
                          <span className="text-amber-600 text-lg flex-shrink-0 mt-0.5">💡</span>
          <div>
                            <h4 className="font-bold text-amber-900 text-sm mb-2">How to use:</h4>
                            <p className="text-sm text-amber-800 leading-relaxed mt-1">
                              {usageTip}
                            </p>
          </div>
          </div>
          </div>
                    );
                  })()}
        </div>

                <DialogFooter className="justify-center">
                  <button
                    onClick={() => {
                      setWhyDialogOpen(false);
                      setSelectedProductForWhy(null);
                    }}
                    className="px-4 py-2 bg-[var(--color-action-primary)] text-[var(--color-text-on-action)] rounded-lg hover:bg-[var(--color-action-hover)] transition-colors"
                  >
                    Got it
                  </button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Clear Routine Confirmation Dialog */}
        <Dialog open={showClearRoutineDialog} onOpenChange={setShowClearRoutineDialog}>
          <DialogContent className="w-[95vw] sm:w-full sm:max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Clear Your Routine?</DialogTitle>
              <DialogDescription>
                Are you sure you want to clear your entire routine? This will remove all products you have added.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowClearRoutineDialog(false)}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors touch-manipulation font-medium"
                style={{ minHeight: '44px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClearRoutine}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors font-semibold touch-manipulation"
                style={{ minHeight: '44px' }}
              >
                Clear Routine
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Duplicate Category Warning Dialog */}
        <Dialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
          <DialogContent className="w-[95vw] sm:w-full sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Similar Product Already in Routine</DialogTitle>
              <DialogDescription>
                You already have a product from this category in your routine.
              </DialogDescription>
            </DialogHeader>
            {duplicateWarningData && (
              <div className="py-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Current product in routine:</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="font-medium text-gray-900">{duplicateWarningData.existingProduct.name}</p>
                    <p className="text-sm text-gray-600">{duplicateWarningData.existingProduct.brand}</p>
                  </div>
              </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Product you're trying to add:</p>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="font-medium text-gray-900">{duplicateWarningData.newProduct.name}</p>
                    <p className="text-sm text-gray-600">{duplicateWarningData.newProduct.brand}</p>
        </div>
                </div>
                <p className="text-sm text-gray-600">
                  Would you like to replace the current product with this one, or cancel?
                </p>
              </div>
            )}
            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => {
                  setShowDuplicateWarning(false);
                  setDuplicateWarningData(null);
                }}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors touch-manipulation font-medium"
                style={{ minHeight: '44px' }}
              >
                Cancel
              </button>
          <button
                onClick={() => handleConfirmDuplicateAdd(true)}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-[var(--color-action-primary)] text-[var(--color-text-on-action)] rounded-lg hover:bg-[var(--color-action-hover)] active:opacity-90 transition-colors touch-manipulation font-medium"
                style={{ minHeight: '44px' }}
          >
                Replace with This Product
          </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AccordionSection title="Your Personal Skin Analysis" defaultOpen>
          <div className="mb-1">
            <p className="text-sm text-gray-600">
              ✓ Analyzed {factorCount} unique profile factors for personalized recommendations
            </p>
        </div>
        
          {diagnosis && (
            <div className="mt-4 mb-4 pb-4 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">The Diagnosis</h3>
              <p className="text-gray-700 leading-relaxed mt-2">
                {diagnosis}
              </p>
            </div>
          )}

          {strategies.length > 0 && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Our Strategy</h3>
              <p className="text-gray-700 mb-4 mt-2">
                We have structured your routine to tackle immediate issues first while supporting long-term skin health.
              </p>
        <div className="space-y-4">
                {strategies.map((strategy, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      strategy.priority === 'high'
                        ? 'bg-red-50 border-red-500'
                        : 'bg-amber-50 border-amber-500'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span className={`text-xl ${
                        strategy.priority === 'high' ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {strategy.priority === 'high' ? '🔴' : '🟡'}
                    </span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {strategy.priority === 'high' ? 'High' : 'Secondary'} Priority: {strategy.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {strategy.timeline}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Why:</span> {strategy.why}
                        </p>
                  </div>
              </div>
        </div>
                ))}
              </div>
            </div>
          )}

        </AccordionSection>

        <AccordionSection title="Recommended Products" defaultOpen={false}>
          <div className="relative">
            {hasPhasedRecommendations ? (
              <Tabs defaultValue="phase-1" className="w-full">
                <TabsList className="mb-2 flex-wrap gap-1 sm:gap-0">
                  <TabsTrigger value="phase-1" className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 min-h-[44px] touch-manipulation">Phase 1: Your Core Routine</TabsTrigger>
                  <TabsTrigger value="phase-2" className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 min-h-[44px] touch-manipulation">Phase 2: Your Treatment</TabsTrigger>
                  {/* Only show Phase 3 tab if there are products */}
                  {phase3Products.length > 0 && (
                    <TabsTrigger value="phase-3" className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 min-h-[44px] touch-manipulation">Phase 3: Boosters</TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="phase-1" className="mt-2">
                  {phase1Products.length > 0 ? (
                    <div className="space-y-4">
                      {phase1Products.map((product, index) => (
                        <ProductCard 
                          key={product.productId || index} 
                          product={product}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No products in Phase 1 at this time.</p>
                  )}
                </TabsContent>
                
                <TabsContent value="phase-2" className="mt-2">
                  {phase2Products.length > 0 ? (
                    <div className="space-y-4">
                      {phase2Products.map((product, index) => (
                        <ProductCard 
                          key={product.productId || index} 
                          product={product}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No products in Phase 2 at this time.</p>
                  )}
                </TabsContent>
                
                {/* Only show Phase 3 content if there are products */}
                {phase3Products.length > 0 && (
                  <TabsContent value="phase-3" className="mt-2">
                    <div className="space-y-4">
                      {phase3Products.map((product, index) => (
                        <ProductCard 
                          key={product.productId || index} 
                          product={product}
                        />
                      ))}
                    </div>
                  </TabsContent>
                )}
                
              </Tabs>
            ) : (
              <div>
                {allProducts.length > 0 ? (
                  <div className="space-y-4">
                    {allProducts.map((product, index) => (
                      <ProductCard 
                        key={product.productId || index} 
                        product={product}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No products recommended at this time.</p>
                )}
              </div>
            )}
            
          </div>
        </AccordionSection>
        
        <AccordionSection title="Your Routine" defaultOpen={false}>
          {selectedRoutineProducts.length > 0 ? (
            <div className="space-y-6">
                            {(() => {
                const routine = buildRoutineFromSelected();
              return (
                  <>
                    {/* Morning Routine */}
                    {routine.morning.length > 0 && (
                      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 sm:p-6">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                          <Sun className="w-5 h-5 mr-2 text-yellow-500 flex-shrink-0" />
                          Morning Routine
                  </h3>
                        <div className="space-y-3">
                          {routine.morning.map((step, index) => (
                            <div key={index} className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                              <div className="flex items-start gap-3 sm:gap-4">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs sm:text-sm">
                                  {step.step}
                                </div>
                        <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 uppercase text-xs sm:text-sm">
                                    {formatCategoryName(step.category, step.product)}
                                  </h4>
                                  <p className="text-sm sm:text-base text-gray-900 mt-1 break-words">{step.product.name || 'Product not specified'}</p>
                                  {step.product.brand && (
                                    <p className="text-xs sm:text-sm text-gray-600">{step.product.brand}</p>
                                  )}
                                  {step.instruction && (
                                    <p className="text-sm text-gray-600 mt-2">{step.instruction}</p>
                                  )}
                                </div>
                              <button 
                                  onClick={() => handleRemoveFromRoutine(step.product.productId)}
                                  className="text-red-500 hover:text-red-700 text-sm"
                              >
                                  Remove
                              </button>
                            </div>
                          </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Evening Routine */}
                    {routine.evening.length > 0 && (
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 sm:p-6">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                          <Moon className="w-5 h-5 mr-2 text-indigo-500 flex-shrink-0" />
                          Evening Routine
                        </h3>
                        <div className="space-y-3">
                          {routine.evening.map((step, index) => (
                            <div key={index} className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                              <div className="flex items-start gap-3 sm:gap-4">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs sm:text-sm">
                                  {step.step}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 uppercase text-xs sm:text-sm">
                                    {formatCategoryName(step.category, step.product)}
                                  </h4>
                                  <p className="text-sm sm:text-base text-gray-900 mt-1 break-words">{step.product.name || 'Product not specified'}</p>
                                  {step.product.brand && (
                                    <p className="text-xs sm:text-sm text-gray-600">{step.product.brand}</p>
                                  )}
                                  {step.instruction && (
                                    <p className="text-xs sm:text-sm text-gray-600 mt-2">{step.instruction}</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleRemoveFromRoutine(step.product.productId)}
                                  className="text-red-500 hover:text-red-700 text-sm"
                                >
                                  Remove
                                </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                    )}
                    
                    {/* Action Buttons - Clear Routine, Buy Routine, and Shop Something Else */}
                    {(routine.morning.length > 0 || routine.evening.length > 0) && (
                      <div className="flex flex-col gap-3 mt-4">
                        {/* Clear Routine Button */}
                        <button
                          onClick={handleClearRoutine}
                          className="w-full sm:w-auto px-4 sm:px-6 py-3 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2 active:opacity-80 touch-manipulation text-sm sm:text-base"
                          style={{ 
                            backgroundColor: 'rgba(92, 64, 51, 0.1)',
                            color: '#5C4033',
                            minHeight: '44px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(92, 64, 51, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(92, 64, 51, 0.1)';
                          }}
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          Clear Routine
                        </button>
                        
                        {/* Buy Routine Button */}
                        <button
                          onClick={handleAddRoutineToCart}
                          className="w-full px-4 sm:px-6 py-3 bg-[var(--color-action-primary)] text-[var(--color-text-on-action)] rounded-lg hover:bg-[var(--color-action-hover)] active:opacity-90 transition-colors font-semibold touch-manipulation text-sm sm:text-base"
                          style={{ minHeight: '44px' }}
                        >
                          Buy This Routine
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
                  </div>
          ) : (
            <div className="text-center py-8 sm:py-12 px-4">
              <p className="text-gray-500 text-base sm:text-lg mb-2">No products in your routine yet</p>
              <p className="text-gray-400 text-xs sm:text-sm">Click "Add to Routine" on any product to build your custom skincare routine</p>
        </div>
          )}
        </AccordionSection>

        {/* Old Morning Routine - Remove this section */}
        {false && Array.isArray(morningRoutine) && morningRoutine.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Sun className="w-6 h-6 mr-2 text-yellow-500" />
              Morning Routine
        </h2>
        <div className="space-y-4">
              {morningRoutine.map((step, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold flex-shrink-0" style={{ backgroundColor: 'var(--color-action-primary)' }}>
                      {step?.step || index + 1}
                  </div>
                  <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 uppercase text-sm">
                        {formatCategoryName(step?.category || '', step?.product)}
                      </h3>
                      <p className="text-gray-900 mt-1">{step?.product?.name || 'Product not specified'}</p>
                      {step?.instruction && (
                        <p className="text-sm text-gray-600 mt-2">{step.instruction}</p>
                      )}
                    </div>
                      </div>
                  </div>
              ))}
                </div>
              </div>
        )}


        {tips && tips.length > 0 && (
          <AccordionSection title="Personalized Tips" defaultOpen={false}>
            <ul className="space-y-2">
            {tips.map((tip, index) => (
                <li key={index} className="text-gray-700">• {tip}</li>
            ))}
          </ul>
          </AccordionSection>
        )}

      </div>

      {/* Save Report Button */}
      {(selectedRoutineProducts.length > 0 || (morningRoutine && morningRoutine.length > 0) || (eveningRoutine && eveningRoutine.length > 0)) && (
        <div className="fixed right-6 bottom-6 z-30">
          <button
            onClick={handleSaveReport}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-4 py-3 min-w-[160px] bg-[var(--color-action-primary)] text-[var(--color-text-on-action)] rounded-lg shadow-2xl hover:shadow-3xl hover:bg-[var(--color-action-hover)] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            <span>{isSaving ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Report'}</span>
          </button>
          {saveStatus === 'saved' && (
            <div className="absolute bottom-full mb-2 right-0 text-sm text-green-600 bg-white px-3 py-1 rounded-lg shadow-lg whitespace-nowrap">
              ✓ Routine saved successfully
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="absolute bottom-full mb-2 right-0 text-sm text-red-600 bg-white px-3 py-1 rounded-lg shadow-lg whitespace-nowrap">
              ✗ Failed to save routine
            </div>
          )}
        </div>
      )}

      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistDrawerOpen}
        onClose={() => setIsWishlistDrawerOpen(false)}
        consultationId={consultationId}
        customerInfo={customerInfo}
      />

      {/* Wishlist Toast Notification */}
      <WishlistToast
        message={wishlistToastMessage}
        isVisible={!!wishlistToastMessage}
        onClose={clearWishlistToast}
      />
    </div>
  );
}
