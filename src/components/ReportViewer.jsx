'use client';

import { motion } from 'framer-motion';
import { Sun, Moon, AlertCircle, Download, Share2, ShoppingCart } from 'lucide-react';

export default function ReportViewer({ consultationId, analysis }) {
  const { profile, concerns, recommendations, morningRoutine, eveningRoutine, tips } = analysis;

  const handleDownload = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Skincare Report',
        text: 'Check out my personalized skincare routine!',
        url: window.location.href,
      });
    }
  };

  const formatCategoryName = (category) => {
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
          Your Personalized Skincare Report
        </h1>
        <p className="text-gray-600">Consultation ID: {consultationId}</p>
        
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            Share
          </button>
        </div>
      </motion.div>

      {/* Skin Profile Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg p-8 mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="text-3xl mr-3">🔍</span>
          Understanding Your Skin
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Skin Type</h3>
            <p className="text-lg capitalize">{profile.skinType}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Sensitivity Level</h3>
            <p className="text-lg capitalize">{profile.sensitivity}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Climate</h3>
            <p className="text-lg capitalize">{profile.climate.replace('-', ' ')}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Sun Exposure</h3>
            <p className="text-lg capitalize">{profile.sunExposure}</p>
          </div>
        </div>
      </motion.section>

      {/* Identified Concerns Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-lg p-8 mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="text-3xl mr-3">🎯</span>
          Your Skin Concerns
        </h2>
        
        <div className="space-y-4">
          {concerns.map((concern, index) => (
            <div key={index} className="border-l-4 border-purple-500 pl-4 py-2">
              <h3 className="font-bold text-lg text-gray-900">{concern.name}</h3>
              <p className="text-gray-600">{concern.description}</p>
              <div className="mt-2">
                <span className="text-sm text-purple-600 font-semibold">
                  Priority Score: {concern.priorityScore.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Product Recommendations Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-lg p-8 mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="text-3xl mr-3">💎</span>
          Recommended Products
        </h2>
        
        <div className="space-y-6">
          {Object.entries(recommendations).map(([category, products]) => (
            <div key={category} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
              <h3 className="font-bold text-lg text-gray-900 mb-4 uppercase tracking-wide">
                {formatCategoryName(category)}
              </h3>
              
              <div className="space-y-4">
                {products.map((product, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-200 to-pink-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🧴</span>
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{product.name}</h4>
                      <p className="text-sm text-gray-600">{product.brand}</p>
                      <p className="text-sm text-gray-700 mt-2">{product.description}</p>
                      
                      <div className="flex items-center gap-4 mt-3">
                        <span className="font-bold text-purple-600">${product.price}</span>
                        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all">
                          <ShoppingCart className="w-4 h-4" />
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Morning Routine Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-lg p-8 mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Sun className="w-8 h-8 mr-3 text-orange-500" />
          Morning Routine (5-10 minutes)
        </h2>
        
        <div className="space-y-4">
          {morningRoutine.map((step) => (
            <div key={step.step} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold flex items-center justify-center flex-shrink-0">
                  {step.step}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 uppercase text-sm tracking-wide mb-1">
                    {formatCategoryName(step.category)}
                  </h3>
                  <p className="text-gray-700 font-semibold mb-2">
                    {step.product.name}
                  </p>
                  <p className="text-gray-600 text-sm mb-2">{step.instruction}</p>
                  
                  {step.important && (
                    <div className="flex items-center gap-2 text-orange-600 text-sm font-semibold">
                      <AlertCircle className="w-4 h-4" />
                      Never skip this step!
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Evening Routine Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-lg p-8 mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Moon className="w-8 h-8 mr-3 text-indigo-600" />
          Evening Routine (10-15 minutes)
        </h2>
        
        <div className="space-y-4">
          {eveningRoutine.map((step) => (
            <div key={step.step} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                  {step.step}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-gray-900 uppercase text-sm tracking-wide">
                      {formatCategoryName(step.category)}
                    </h3>
                    {step.frequency && step.frequency !== 'daily' && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">
                        {step.frequency}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 font-semibold mb-2">
                    {step.product.name}
                  </p>
                  <p className="text-gray-600 text-sm mb-2">{step.instruction}</p>
                  
                  {step.important && (
                    <div className="flex items-center gap-2 text-purple-600 text-sm font-semibold">
                      <AlertCircle className="w-4 h-4" />
                      Start slowly and build tolerance
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Tips Section */}
      {tips && tips.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-3xl mr-3">💡</span>
            Personalized Tips
          </h2>
          
          <ul className="space-y-3">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-purple-500 mt-1">•</span>
                <span className="text-gray-700">{tip}</span>
              </li>
            ))}
          </ul>
        </motion.section>
      )}

      {/* Disclaimer Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="bg-red-50 border-2 border-red-200 rounded-2xl p-8"
      >
        <h2 className="text-xl font-bold text-red-900 mb-4 flex items-center">
          <AlertCircle className="w-6 h-6 mr-2" />
          Important Medical Disclaimer
        </h2>
        
        <div className="text-red-800 space-y-3 text-sm">
          <p className="font-semibold">This is not medical advice.</p>
          
          <p>
            This personalized skincare report is generated by an AI-powered consultation tool based on your self-reported information. It is designed to provide product recommendations for cosmetic skincare purposes only.
          </p>
          
          <p className="font-semibold">This report is NOT:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>A substitute for professional medical advice</li>
            <li>A clinical diagnosis from a dermatologist</li>
            <li>Treatment for medical skin conditions</li>
          </ul>
          
          <p className="font-semibold">Please consult a qualified dermatologist if you:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Have severe acne, cysts, or scarring</li>
            <li>Experience persistent skin conditions (eczema, psoriasis, rosacea)</li>
            <li>Notice unusual moles, lesions, or skin changes</li>
            <li>Are pregnant or nursing (before using active ingredients)</li>
            <li>Have specific medical concerns about your skin</li>
          </ul>
          
          <p>
            While we carefully select products based on your profile, individual results may vary. Always perform patch tests and discontinue use if irritation occurs.
          </p>
        </div>
      </motion.section>
    </div>
  );
}