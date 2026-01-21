'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  // Initialize state from localStorage immediately (before first render)
  const [cartItems, setCartItems] = useState(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return [];
    }
    
    try {
      const savedCart = localStorage.getItem('skincare-cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
    return [];
  });

  // Toast notification state
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef(null);

  // Save cart to localStorage whenever it changes (but skip initial render to avoid overwriting)
  useEffect(() => {
    // Only save if cartItems is not empty or if we're explicitly clearing
    if (cartItems.length > 0 || localStorage.getItem('skincare-cart')) {
      localStorage.setItem('skincare-cart', JSON.stringify(cartItems));
    }
  }, [cartItems]);

  const addToCart = (product) => {
    setCartItems((prevItems) => {
      // Check if product already exists in cart
      const existingItem = prevItems.find(
        (item) => item.productId === product.productId || 
                  (product.shopifyVariantId && item.shopifyVariantId === product.shopifyVariantId) ||
                  (product.shopifyProductId && item.shopifyProductId === product.shopifyProductId)
      );

      if (existingItem) {
        // Update quantity if product already exists
        const updatedItems = prevItems.map((item) =>
          item.productId === product.productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        
        // Show toast notification
        showToast(`${product.name || 'Product'} added to cart (quantity updated)`);
        
        return updatedItems;
      } else {
        // Add new product to cart
        const newItems = [
          ...prevItems,
          {
            ...product,
            quantity: 1,
            addedAt: new Date().toISOString(),
          },
        ];
        
        // Show toast notification
        showToast(`${product.name || 'Product'} added to cart`);
        
        return newItems;
      }
    });
  };

  const showToast = (message) => {
    // Clear any existing timeout
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    
    setToastMessage(message);
    
    // Auto-clear after 3 seconds
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage('');
      toastTimeoutRef.current = null;
    }, 3000);
  };

  const clearToast = () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToastMessage('');
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.productId !== productId)
    );
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('skincare-cart');
  };

  const getCartCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      // Clean mrp - remove currency symbols
      const cleanMrp = item.mrp ? String(item.mrp).replace(/[^\d.-]/g, '') : '';
      const mrp = parseFloat(cleanMrp) || 0;
      return total + mrp * item.quantity;
    }, 0);
  };

  const getProductQuantity = (productId) => {
    const item = cartItems.find(
      (item) => item.productId === productId
    );
    return item ? item.quantity : 0;
  };

  const isProductInCart = (productId) => {
    return cartItems.some((item) => item.productId === productId);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartCount,
    getCartTotal,
    getProductQuantity,
    isProductInCart,
    toastMessage,
    clearToast,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

