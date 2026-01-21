'use client';

import Link from 'next/link';
import { Search, User, Heart, Menu, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useConsultation } from '@/context/ConsultationContext';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CartSidebar from './CartSidebar';
import WishlistDrawer from './WishlistDrawer';
import ShoppingBagIcon from './icons/ShoppingBagIcon';
import { useRouter } from 'next/navigation';
import AnnouncementBar from './AnnouncementBar';

export default function Header() {
  const { getCartCount, cartItems } = useCart();
  const { getWishlistCount } = useWishlist();
  
  // Use consultation context (may be null if not in a consultation)
  let consultationId = null;
  let customerInfo = null;
  try {
    const consultationContext = useConsultation();
    consultationId = consultationContext?.consultationId || null;
    customerInfo = consultationContext?.customerInfo || null;
  } catch (error) {
    // ConsultationContext not available, use null values
    consultationId = null;
    customerInfo = null;
  }
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSyncingCart, setIsSyncingCart] = useState(false);

  // Get Shopify store URL
  const shopifyStoreUrl = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL || '';
  
  // Helper function to build Shopify store URLs
  const getShopifyUrl = (path) => {
    if (!shopifyStoreUrl) return '#';
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    // Remove trailing slash from store URL if present
    const cleanStoreUrl = shopifyStoreUrl.replace(/\/$/, '');
    let url = `${cleanStoreUrl}${cleanPath}`;
    
    return url;
  };

  // Sync cart to Shopify before navigating using hidden iframe
  const syncCartAndNavigate = async (targetUrl, event) => {
    // Only sync if there are items in cart
    if (cartItems.length === 0) {
      return; // Let default link behavior work
    }

    event?.preventDefault();
    
    if (isSyncingCart) return; // Prevent multiple syncs
    
    setIsSyncingCart(true);

    try {
      const response = await fetch('/api/shopify/sync-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItems }),
      });

      const data = await response.json();

      if (data.success && data.cartUrl) {
        // Use hidden iframe to sync cart (adds items to Shopify cart via cookies)
        // This way we don't interrupt navigation
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.src = data.cartUrl;
        document.body.appendChild(iframe);

        // Wait a moment for iframe to load and sync, then navigate
        setTimeout(() => {
          document.body.removeChild(iframe);
          window.location.href = targetUrl;
          setIsSyncingCart(false);
        }, 500);
      } else {
        // If sync fails, still navigate (cart items remain in localStorage)
        console.warn('Cart sync failed, navigating anyway:', data.error);
        window.location.href = targetUrl;
        setIsSyncingCart(false);
      }
    } catch (error) {
      console.error('Error syncing cart:', error);
      // Navigate anyway if sync fails
      window.location.href = targetUrl;
      setIsSyncingCart(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setCartCount(getCartCount());
      setWishlistCount(getWishlistCount());
      // Update counts periodically (could be improved with context subscription)
      const interval = setInterval(() => {
        setCartCount(getCartCount());
        setWishlistCount(getWishlistCount());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [mounted, getCartCount, getWishlistCount]);

  // Prevent body scroll when mobile menu is open (only on mobile)
  useEffect(() => {
    if (isMobileMenuOpen) {
      // Check if we're on mobile (viewport width < 768px)
      const isMobile = window.innerWidth < 768;
      if (!isMobile) {
        setIsMobileMenuOpen(false);
        return;
      }

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
  }, [isMobileMenuOpen]);

  // Close mobile menu when window is resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);


  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('[data-mobile-menu]')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Announcement Bar */}
      <AnnouncementBar />

      {/* Main Header */}
      <header className="atla-header">
        <div className="atla-header-inner">
          {/* Left Section */}
          <div className="atla-left-section">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => {
                if (window.innerWidth < 900) {
                  setIsMobileMenuOpen(true);
                }
              }}
              className="atla-mobile-toggle"
              aria-label="Open menu"
              data-mobile-menu
            >
              <Menu size={28} color="#5C4033" />
            </button>

            {/* Desktop Navigation */}
            <nav>
              <Link href="/">Our Method</Link>
              
              {/* Brands Link */}
              <a
                href="https://atlabeauty.com/pages/brands"
                onClick={(e) => syncCartAndNavigate('https://atlabeauty.com/pages/brands', e)}
              >
                Brands
              </a>

              {/* Shop Link */}
              <a
                href="https://atlabeauty.com/collections/shop"
                onClick={(e) => syncCartAndNavigate('https://atlabeauty.com/collections/shop', e)}
              >
                Shop
              </a>
            </nav>
          </div>

          {/* Center Logo */}
          <a 
            href="https://atlabeauty.com/"
            onClick={(e) => syncCartAndNavigate('https://atlabeauty.com/', e)}
            className="atla-center-logo"
          >
            ATLA BEAUTY
          </a>

          {/* Right Icons */}
          <div className="atla-right-icons">
            {/* Search - Hidden on mobile */}
            <a
              href="https://atlabeauty.com/search"
              onClick={(e) => syncCartAndNavigate('https://atlabeauty.com/search', e)}
              className="hidden md:flex items-center justify-center p-2 hover:opacity-70 transition-opacity touch-manipulation"
              style={{ minWidth: '44px', minHeight: '44px' }}
              aria-label="Search"
            >
              <Search size={22} color="#5C4033" />
            </a>

            {/* Profile - Hidden on mobile */}
            <a
              href="https://account.atlabeauty.com/"
              onClick={(e) => syncCartAndNavigate('https://account.atlabeauty.com/', e)}
              className="hidden md:flex items-center justify-center p-2 hover:opacity-70 transition-opacity touch-manipulation"
              style={{ minWidth: '44px', minHeight: '44px' }}
              aria-label="Profile"
            >
              <User size={22} color="#5C4033" />
            </a>

            {/* Wishlist - Always visible */}
            <button
              onClick={() => {
                setIsWishlistOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="relative flex items-center justify-center p-2 hover:opacity-70 transition-opacity touch-manipulation"
              style={{ minWidth: '44px', minHeight: '44px' }}
              aria-label="Wishlist"
            >
              <Heart size={22} color="#5C4033" />
              {mounted && wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#008080] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </button>

            {/* Cart - Always visible */}
            <button
              onClick={() => {
                setIsCartOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="relative flex items-center justify-center p-2 hover:opacity-70 transition-opacity touch-manipulation"
              style={{ minWidth: '44px', minHeight: '44px' }}
              aria-label="Shopping Cart"
            >
              <ShoppingBagIcon size={22} color="#5C4033" />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[var(--color-action-primary)] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      
      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        consultationId={consultationId || null}
        customerInfo={customerInfo || null}
      />

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="atla-mobile-backdrop fixed inset-0 bg-black/50 z-40"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
              className={`atla-mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}
              data-mobile-menu
            >
              <div className="atla-mobile-menu-header">
                <h2>Menu</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="atla-mobile-menu-close"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>

              <nav className="atla-mobile-menu-nav">
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Our Method
                </Link>

                <a
                  href="https://atlabeauty.com/pages/brands"
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    syncCartAndNavigate('https://atlabeauty.com/pages/brands', e);
                  }}
                >
                  Brands
                </a>

                <a
                  href="https://atlabeauty.com/collections/shop"
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    syncCartAndNavigate('https://atlabeauty.com/collections/shop', e);
                  }}
                >
                  Shop
                </a>

                <div style={{ borderTop: '1px solid #e5e5e5', margin: '20px 0' }} />

                <a
                  href="https://atlabeauty.com/search"
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    syncCartAndNavigate('https://atlabeauty.com/search', e);
                  }}
                >
                  <Search size={20} />
                  <span>Search</span>
                </a>

                <a
                  href="https://account.atlabeauty.com/"
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    syncCartAndNavigate('https://account.atlabeauty.com/', e);
                  }}
                >
                  <User size={20} />
                  <span>Profile</span>
                </a>

                <button
                  onClick={() => {
                    setIsWishlistOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  style={{ position: 'relative' }}
                >
                  <Heart size={20} />
                  <span>Wishlist</span>
                  {mounted && wishlistCount > 0 && (
                    <span style={{ marginLeft: 'auto', backgroundColor: '#008080', color: 'white', fontSize: '12px', fontWeight: 'bold', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {wishlistCount > 9 ? '9+' : wishlistCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setIsCartOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  style={{ position: 'relative' }}
                >
                  <ShoppingBagIcon size={20} color="#5C4033" />
                  <span>Cart</span>
                  {mounted && cartCount > 0 && (
                    <span style={{ marginLeft: 'auto', backgroundColor: 'var(--color-action-primary)', color: 'white', fontSize: '12px', fontWeight: 'bold', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

