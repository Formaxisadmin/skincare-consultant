'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { buildShopifyCartUrl, fetchVariantIdsFromProductIds } from '@/lib/shopifyCart';
import { Toast } from '@/components/Toast';

export default function WishlistDrawer({ isOpen, onClose, consultationId, customerInfo, onSaveReportClick }) {
  const { wishlistItems, removeFromWishlist, getWishlistCount } = useWishlist();
  const { addToCart } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  
  const shopifyStoreUrl = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL || '';
  const isLoggedIn = customerInfo && (customerInfo.email || customerInfo.phone);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const handleAddToCart = async (item) => {
    setIsAddingToCart(prev => ({ ...prev, [item.productId]: true }));
    
    try {
      // Add to cart context
      addToCart(item);
      
      // Show success toast notification
      setToastMessage(`${item.name || 'Product'} successfully added to cart`);
      
      // Auto-clear toast after 3 seconds
      setTimeout(() => {
        setToastMessage('');
      }, 3000);
      
      // If user is logged in and has Shopify integration, could redirect here
      // For now, just add to cart context
    } catch (error) {
      console.error('Error adding to cart:', error);
      setToastMessage('Failed to add product to cart. Please try again.');
      setTimeout(() => {
        setToastMessage('');
      }, 3000);
    } finally {
      setIsAddingToCart(prev => ({ ...prev, [item.productId]: false }));
    }
  };

  const handleRemove = (productId) => {
    removeFromWishlist(productId, consultationId, customerInfo);
  };

  const formatMrp = (mrp) => {
    if (!mrp) return 'N/A';
    if (typeof mrp === 'string') {
      return mrp.includes('₹') ? mrp : `₹${mrp}`;
    }
    return `₹${parseFloat(mrp).toFixed(2)}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ 
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              backgroundColor: 'rgba(248, 247, 245, 0.4)'
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:max-w-[400px] bg-[#F8F7F5] z-50 flex flex-col border-l border-[#E5E0D8]"
            style={{ boxShadow: '-10px 0 30px rgba(92, 64, 51, 0.1)' }}
          >
            {/* Header */}
            <div className="bg-white px-6 py-5 border-b border-[#E5E0D8] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-[#008080] fill-[#008080]" />
                <h2 className="text-xl font-bold text-[#5C4033]" style={{ fontFamily: 'Playfair Display, serif' }}>
                  My Wishlist
                </h2>
                {wishlistItems.length > 0 && (
                  <span className="bg-[#008080] text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    {wishlistItems.length}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-[#999] hover:text-[#5C4033] transition-colors"
                aria-label="Close wishlist"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wishlist Items - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-6 cart-scrollable">
              {wishlistItems.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-[#5C4033] text-lg font-medium">Your wishlist is empty</p>
                  <p className="text-[#8c8c8c] text-sm mt-2">Add products you're interested in to your wishlist</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {wishlistItems.map((item) => (
                    <motion.div
                      key={item.productId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-4 rounded-xl border border-[#E5E0D8]"
                      style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
                    >
                      <div className="flex gap-4">
                        {/* Product Image/Icon */}
                        <div className="w-20 h-20 bg-[#F9FAFB] rounded-lg border border-[#eee] flex items-center justify-center flex-shrink-0">
                          <span className="text-3xl">🧴</span>
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-[#5C4033] leading-tight mb-1 line-clamp-2">
                                {item.name || 'Unknown Product'}
                              </h3>
                              {item.brand && (
                                <p className="text-xs text-[#8c8c8c]">
                                  {item.brand}
                                </p>
                              )}
                            </div>
                            {/* Remove button */}
                            <button
                              onClick={() => handleRemove(item.productId)}
                              className="text-[#999] hover:text-red-600 transition-colors flex-shrink-0 ml-2 p-1"
                              aria-label="Remove from wishlist"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Footer: Price and Add to Cart Button */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="font-bold text-[#008080] text-sm">
                              {formatMrp(item.mrp)}
                            </div>
                            <button
                              onClick={() => handleAddToCart(item)}
                              disabled={isAddingToCart[item.productId]}
                              className="px-4 py-1.5 bg-[#008080] hover:bg-[#006666] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                              {isAddingToCart[item.productId] ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Adding...
                                </>
                              ) : (
                                <>
                                  <ShoppingBag className="w-3 h-3" />
                                  Add to Cart
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer - Save Prompt for Anonymous Users */}
            {!isLoggedIn && wishlistItems.length > 0 && (
              <div className="bg-[#FFF8E1] border-t border-[#FFE082] px-6 py-4">
                <p className="text-sm text-[#5C4033] text-center">
                  <span className="font-medium">Save your report</span> to sync your wishlist across devices.
                  {onSaveReportClick && (
                    <button
                      onClick={() => {
                        onClose();
                        onSaveReportClick();
                      }}
                      className="ml-2 text-[#008080] hover:underline font-semibold"
                    >
                      Save Now
                    </button>
                  )}
                </p>
              </div>
            )}
          </motion.div>

          {/* Toast Notification for Add to Cart */}
          <Toast
            message={toastMessage}
            isVisible={!!toastMessage}
            onClose={() => setToastMessage('')}
            duration={3000}
          />
        </>
      )}
    </AnimatePresence>
  );
}

