'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X } from 'lucide-react';

export default function WishlistToast({ message, isVisible, onClose, onAction }) {
  if (!isVisible || !message) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-white border border-gray-200 rounded-lg shadow-2xl px-4 py-3 flex items-center gap-3 min-w-[320px] max-w-[500px]"
        style={{ boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)' }}
      >
        <Heart className="w-5 h-5 text-[#008080] fill-[#008080] flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-gray-800">
            {message.split('[Save Report]')[0]}
            {onAction && (
              <button
                onClick={onAction}
                className="ml-1 text-[#008080] hover:text-[#006666] font-semibold underline"
              >
                Save Report
              </button>
            )}
            {message.split('[Save Report]')[1]}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

