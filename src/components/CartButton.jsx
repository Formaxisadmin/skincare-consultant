'use client';

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import CartSidebar from './CartSidebar';
import { Toast } from './Toast';

export default function CartButton() {
  const { getCartCount, toastMessage, clearToast } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Only access cart count after component mounts (client-side only)
  // This prevents hydration mismatch between server and client
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const cartCount = mounted ? getCartCount() : 0;
  
  // Check if we're viewing a report (not just the questionnaire or search page)
  // Reports have an 'id' query parameter in the URL
  const hasReportId = searchParams?.get('id');
  
  // Pages where products are displayed (only when a report is actually shown)
  // - /consultation with ?id=xxx (report is shown)
  // - /view-report with ?id=xxx OR when a report is selected (we check for id param)
  const isReportPage = mounted && (
    (pathname === '/consultation' && hasReportId) ||
    (pathname === '/view-report' && hasReportId)
  );
  
  // Show cart button if:
  // 1. There are items in the cart (user can checkout from anywhere), OR
  // 2. User is viewing a report (where products are displayed)
  const shouldShowCart = mounted && (cartCount > 0 || isReportPage);

  // Don't render anything if we shouldn't show the cart
  if (!shouldShowCart) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {shouldShowCart && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-6 right-6 bg-[var(--color-action-primary)] text-white flex items-center justify-center gap-2 px-4 py-3 min-w-[160px] rounded-lg shadow-2xl hover:shadow-3xl transition-all font-semibold z-30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Cart</span>
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-white text-[var(--color-action-primary)] rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
              >
                {cartCount > 9 ? '9+' : cartCount}
              </motion.span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      
      {/* Toast Notification */}
      <Toast 
        message={toastMessage} 
        isVisible={!!toastMessage} 
        onClose={clearToast}
        duration={3000}
      />
    </>
  );
}

