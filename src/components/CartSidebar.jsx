'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, CheckCircle, Truck, Shield, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { buildShopifyCartUrl, fetchVariantIdsFromProductIds, productsToCartItems } from '@/lib/shopifyCart';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import ShoppingBagIcon from './icons/ShoppingBagIcon';

export default function CartSidebar({ isOpen, onClose }) {
  const { cartItems, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [showClearCartDialog, setShowClearCartDialog] = useState(false);

  const shopifyStoreUrl = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL || '';

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Prevent scrolling
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore scrolling when cart closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      return;
    }

    if (!shopifyStoreUrl) {
      setCheckoutError('Shopify store URL is not configured. Please contact support.');
      return;
    }

    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      // Fetch variant IDs for products that only have productId
      const result = await fetchVariantIdsFromProductIds(cartItems);

      if (result.error) {
        setCheckoutError(result.error + (result.suggestion ? '\n\n' + result.suggestion : ''));
        setIsCheckingOut(false);
        return;
      }

      // Get products with variant IDs
      const productsWithVariants = result.products.filter(p => p.shopifyVariantId);

      if (productsWithVariants.length === 0) {
        setCheckoutError('No products have valid variant IDs. Please try again or contact support.');
        setIsCheckingOut(false);
        return;
      }

      // Build cart items with quantities (group by variant ID)
      const cartItemsForShopify = productsWithVariants.map(product => {
        const cartItem = cartItems.find(item => 
          item.productId === product.productId ||
          (product.shopifyVariantId && item.shopifyVariantId === product.shopifyVariantId) ||
          (product.shopifyProductId && item.shopifyProductId === product.shopifyProductId)
        );

        if (!cartItem) return null;

        return {
          variantId: product.shopifyVariantId,
          quantity: cartItem.quantity || 1,
          productName: product.name,
        };
      }).filter(Boolean);

      // Build Shopify cart URL
      const cartUrl = buildShopifyCartUrl(cartItemsForShopify, shopifyStoreUrl, null);

      if (cartUrl) {
        // Clear cart after successful checkout
        clearCart();
        // Open Shopify cart
        window.open(cartUrl, '_blank');
        onClose();
      } else {
        setCheckoutError('Unable to build cart URL. Please try again.');
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      setCheckoutError('An error occurred during checkout. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const total = getCartTotal();
  
  // Free shipping threshold (in INR)
  const FREE_SHIPPING_THRESHOLD = 2000;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - total);
  const shippingProgress = total > 0 ? Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100) : 0;
  
  // Helper function to format mrp
  const formatMrp = (mrp) => {
    if (!mrp) return null;
    // Remove currency symbols and convert to number
    const cleanMrp = String(mrp).replace(/[^\d.-]/g, '');
    const numMrp = parseFloat(cleanMrp);
    if (isNaN(numMrp) || numMrp <= 0) return null;
    return numMrp.toFixed(2);
  };

  // Get product variant/category info for display
  const getProductVariant = (item) => {
    if (item.category) {
      return item.category;
    }
    if (item.description) {
      return item.description.substring(0, 30) + (item.description.length > 30 ? '...' : '');
    }
    return '';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Blur only, no dark overlay */}
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

          {/* Sidebar */}
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
                <ShoppingBagIcon size={20} color="#008080" />
                <h2 className="text-xl font-bold text-[#5C4033]" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Your Regimen
                </h2>
                {cartItems.length > 0 && (
                  <span className="bg-[#008080] text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    {cartItems.length}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-[#999] hover:text-[#5C4033] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Progress Bar */}
            {cartItems.length > 0 && remainingForFreeShipping > 0 && (
              <div className="bg-white px-6 py-4 border-b border-[#E5E0D8]">
                <div className="flex items-center gap-2 text-[13px] mb-2">
                  <Truck className="w-4 h-4 text-[#008080]" />
                  <span className="text-[#5C4033]">
                    Add <strong className="text-[#008080]">₹{remainingForFreeShipping.toFixed(2)}</strong> for free shipping
                  </span>
                </div>
                <div className="h-1.5 bg-[#eee] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#008080] rounded-full transition-all duration-300"
                    style={{ width: `${shippingProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Cart Items - Scrollable area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 cart-scrollable">
              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBagIcon size={64} color="#d1d5db" className="mx-auto mb-4" />
                  <p className="text-[#5C4033] text-lg font-medium">Your cart is empty</p>
                  <p className="text-[#8c8c8c] text-sm mt-2">Add products from your report to get started</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {cartItems.map((item) => {
                    const itemMrp = formatMrp(item.mrp) ? parseFloat(formatMrp(item.mrp)) : 0;
                    const itemTotal = itemMrp * (item.quantity || 1);
                    const variant = getProductVariant(item);
                    
                    return (
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
                                {variant && (
                                  <p className="text-xs text-[#8c8c8c]">
                                    {variant}
                                  </p>
                                )}
                              </div>
                              {/* Remove button - subtle, appears on hover */}
                              <button
                                onClick={() => removeFromCart(item.productId)}
                                className="text-[#999] hover:text-red-600 transition-colors flex-shrink-0 ml-2 p-1"
                                aria-label="Remove item"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Footer: Quantity Controls and Price */}
                            <div className="flex items-center justify-between mt-3">
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-2.5 bg-[#F4F4F5] border border-[#E4E4E7] rounded-md px-2 py-1">
                                <button
                                  onClick={() => {
                                    if (item.quantity <= 1) {
                                      removeFromCart(item.productId);
                                    } else {
                                      updateQuantity(item.productId, item.quantity - 1);
                                    }
                                  }}
                                  className="text-[#666] hover:text-[#008080] transition-colors flex items-center"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-xs font-semibold w-4 text-center text-[#5C4033]">
                                  {item.quantity || 1}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  className="text-[#008080] hover:text-[#006666] transition-colors flex items-center"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Price */}
                              <div className="font-bold text-[#008080] text-sm">
                                ₹{itemTotal.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="bg-white border-t border-[#E5E0D8] px-6 py-6 pb-8">
                {checkoutError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm whitespace-pre-line">{checkoutError}</p>
                  </div>
                )}

                {/* Summary */}
                <div className="mb-5">
                  <div className="flex justify-between text-sm text-[#666] mb-2">
                    <span>Subtotal</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#666]">
                    <span>Shipping</span>
                    <span className="text-xs text-[#999]">(Calculated at checkout)</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between text-lg font-bold text-[#5C4033] mb-4 pt-3 border-t border-[#eee]">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>

                {/* Clear Cart Button */}
                <button
                  onClick={() => setShowClearCartDialog(true)}
                  className="w-full text-[#999] hover:text-red-600 text-sm py-2 mb-3 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Cart
                </button>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full bg-[#008080] hover:bg-[#006666] text-white py-4 px-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCheckingOut ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Secure Checkout
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {/* Security Note */}
                <div className="flex items-center justify-center gap-1.5 mt-4">
                  <Shield className="w-4 h-4 text-[#008080]" />
                  <span className="text-xs text-[#999]">Guaranteed safe & secure checkout</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Clear Cart Dialog */}
          <Dialog open={showClearCartDialog} onOpenChange={setShowClearCartDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Clear Your Cart?</DialogTitle>
                <DialogDescription>
                  Are you sure you want to clear all items from your cart? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setShowClearCartDialog(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    clearCart();
                    setShowClearCartDialog(false);
                  }}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Clear Cart
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </AnimatePresence>
  );
}

