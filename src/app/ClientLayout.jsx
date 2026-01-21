'use client';

import { CartProvider } from '@/context/CartContext'
import { WishlistProvider } from '@/context/WishlistContext'
import { ConsultationProvider } from '@/context/ConsultationContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function ClientLayout({ children }) {
  return (
    <CartProvider>
      <WishlistProvider>
        <ConsultationProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </ConsultationProvider>
      </WishlistProvider>
    </CartProvider>
  )
}

