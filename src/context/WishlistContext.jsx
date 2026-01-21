'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  // Initialize state from localStorage immediately (before first render)
  const [wishlistItems, setWishlistItems] = useState(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return [];
    }
    
    try {
      const savedWishlist = localStorage.getItem('skincare-wishlist');
      if (savedWishlist) {
        const parsed = JSON.parse(savedWishlist);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.error('Error loading wishlist from localStorage:', error);
    }
    return [];
  });

  // Toast notification state for wishlist-specific messages
  const [wishlistToastMessage, setWishlistToastMessage] = useState('');
  const [wishlistToastAction, setWishlistToastAction] = useState(null); // Callback function for action button
  const wishlistToastTimeoutRef = useRef(null);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (wishlistItems.length > 0 || localStorage.getItem('skincare-wishlist')) {
      localStorage.setItem('skincare-wishlist', JSON.stringify(wishlistItems));
    }
  }, [wishlistItems]);

  const showWishlistToast = (message, actionCallback = null) => {
    // Clear any existing timeout
    if (wishlistToastTimeoutRef.current) {
      clearTimeout(wishlistToastTimeoutRef.current);
    }
    
    setWishlistToastMessage(message);
    setWishlistToastAction(actionCallback);
    
    // Auto-clear after 5 seconds (longer than regular toast for action button)
    wishlistToastTimeoutRef.current = setTimeout(() => {
      setWishlistToastMessage('');
      setWishlistToastAction(null);
      wishlistToastTimeoutRef.current = null;
    }, 5000);
  };

  const clearWishlistToast = () => {
    if (wishlistToastTimeoutRef.current) {
      clearTimeout(wishlistToastTimeoutRef.current);
      wishlistToastTimeoutRef.current = null;
    }
    setWishlistToastMessage('');
    setWishlistToastAction(null);
  };

  // Add to wishlist - handles both anonymous and logged-in users
  const addToWishlist = async (product, consultationId = null, customerInfo = null) => {
    const isLoggedIn = customerInfo && (customerInfo.email || customerInfo.phone);

    // Optimistic UI update - immediately add to local state
    setWishlistItems((prevItems) => {
      // Check if product already exists in wishlist
      const existingItem = prevItems.find(
        (item) => item.productId === product.productId
      );

      if (existingItem) {
        return prevItems; // Already in wishlist
      }

      return [
        ...prevItems,
        {
          ...product,
          addedAt: new Date().toISOString(),
        },
      ];
    });

    if (isLoggedIn && consultationId) {
      // User is logged in - sync with database
      try {
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consultationId,
            product,
            action: 'add',
          }),
        });

        const data = await response.json();
        if (!data.success) {
          console.error('Failed to save wishlist item:', data.error);
          // Revert optimistic update on error
          setWishlistItems((prevItems) =>
            prevItems.filter((item) => item.productId !== product.productId)
          );
        }
      } catch (error) {
        console.error('Error adding to wishlist:', error);
        // Revert optimistic update on error
        setWishlistItems((prevItems) =>
          prevItems.filter((item) => item.productId !== product.productId)
        );
      }
    } else {
      // Anonymous user - show toast with save prompt
      showWishlistToast(
        "Added to temporary wishlist. [Save Report] to keep it forever.",
        () => {
          // This callback will be handled by the component that renders the toast
          return { type: 'openSaveDialog' };
        }
      );
    }
  };

  // Remove from wishlist
  const removeFromWishlist = async (productId, consultationId = null, customerInfo = null) => {
    const isLoggedIn = customerInfo && (customerInfo.email || customerInfo.phone);

    // Optimistic UI update
    const removedItem = wishlistItems.find((item) => item.productId === productId);
    setWishlistItems((prevItems) =>
      prevItems.filter((item) => item.productId !== productId)
    );

    if (isLoggedIn && consultationId) {
      // Sync with database
      try {
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consultationId,
            productId,
            action: 'remove',
          }),
        });

        const data = await response.json();
        if (!data.success) {
          console.error('Failed to remove wishlist item:', data.error);
          // Restore item on error
          if (removedItem) {
            setWishlistItems((prevItems) => [...prevItems, removedItem]);
          }
        }
      } catch (error) {
        console.error('Error removing from wishlist:', error);
        // Restore item on error
        if (removedItem) {
          setWishlistItems((prevItems) => [...prevItems, removedItem]);
        }
      }
    }
  };

  // Check if product is in wishlist
  const isProductInWishlist = (productId) => {
    return wishlistItems.some((item) => item.productId === productId);
  };

  // Get wishlist count
  const getWishlistCount = () => {
    return wishlistItems.length;
  };

  // Merge localStorage wishlist with database wishlist (called when user saves report)
  const mergeWishlistWithDatabase = async (consultationId, dbWishlist = []) => {
    // Combine localStorage items with database items, avoiding duplicates
    const localItems = wishlistItems;
    const dbItemIds = new Set(dbWishlist.map((item) => item.productId));
    
    const uniqueLocalItems = localItems.filter(
      (item) => !dbItemIds.has(item.productId)
    );

    const merged = [...dbWishlist, ...uniqueLocalItems];

    // Update local state
    setWishlistItems(merged);

    // If there are new items from localStorage, sync them to database
    if (uniqueLocalItems.length > 0) {
      try {
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consultationId,
            products: merged,
            action: 'sync',
          }),
        });

        const data = await response.json();
        if (data.success) {
          // Update localStorage with merged list
          localStorage.setItem('skincare-wishlist', JSON.stringify(merged));
        }
      } catch (error) {
        console.error('Error syncing wishlist:', error);
      }
    }
  };

  // Load wishlist from database (called when viewing saved report)
  const loadWishlistFromDatabase = (dbWishlist) => {
    if (Array.isArray(dbWishlist) && dbWishlist.length > 0) {
      setWishlistItems(dbWishlist);
      localStorage.setItem('skincare-wishlist', JSON.stringify(dbWishlist));
    }
  };

  // Clear wishlist (mainly for testing/cleanup)
  const clearWishlist = () => {
    setWishlistItems([]);
    localStorage.removeItem('skincare-wishlist');
  };

  const value = {
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    isProductInWishlist,
    getWishlistCount,
    mergeWishlistWithDatabase,
    loadWishlistFromDatabase,
    clearWishlist,
    wishlistToastMessage,
    wishlistToastAction,
    clearWishlistToast,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}

