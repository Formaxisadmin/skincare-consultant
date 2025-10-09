'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle, Clock, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-block mb-6">
            <span className="text-6xl">✨</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Discover Your Perfect
            </span>
            <br />
            <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Skincare Routine
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
            Get personalized product recommendations and a custom skincare routine 
            tailored to your unique skin needs — in just 3 minutes.
          </p>
          
          <Link href="/consultation">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              Start Free Consultation
            </motion.button>
          </Link>
          
          <p className="text-sm text-gray-500 mt-4">
            No signup required • Takes 3-4 minutes • 100% Free
          </p>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              AI-Powered Analysis
            </h3>
            <p className="text-gray-600">
              Advanced algorithm analyzes your skin profile and concerns to find perfect matches
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Personalized Routine
            </h3>
            <p className="text-gray-600">
              Step-by-step morning and evening routines customized just for you
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Quick & Easy
            </h3>
            <p className="text-gray-600">
              Get your complete skincare report in under 5 minutes
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Safe & Trusted
            </h3>
            <p className="text-gray-600">
              Recommendations based on dermatologist-approved ingredients and research
            </p>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              How It Works
            </span>
          </h2>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex gap-6 items-start"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xl">
                1
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Answer Simple Questions
                </h3>
                <p className="text-gray-600 text-lg">
                  Tell us about your skin type, concerns, lifestyle, and preferences through our easy questionnaire
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex gap-6 items-start"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xl">
                2
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  AI Analyzes Your Profile
                </h3>
                <p className="text-gray-600 text-lg">
                  Our smart algorithm processes your answers and matches them with the best products for your unique needs
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex gap-6 items-start"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xl">
                3
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Get Your Custom Report
                </h3>
                <p className="text-gray-600 text-lg">
                  Receive personalized product recommendations and step-by-step routines for morning and evening
                </p>
              </div>
            </motion.div>
          </div>

          <div className="text-center mt-12">
            <Link href="/consultation">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                Start Your Consultation Now
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              What Our Customers Say
            </span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah M.",
                text: "Finally found products that work for my sensitive skin! The recommendations were spot-on.",
                rating: 5
              },
              {
                name: "Jessica L.",
                text: "The routine is so easy to follow and I'm already seeing results after 3 weeks!",
                rating: 5
              },
              {
                name: "Emily R.",
                text: "Best skincare consultation I've had. Better than my last dermatologist visit honestly.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg"
              >
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">★</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                <p className="font-semibold text-gray-900">{testimonial.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl p-12 text-center text-white shadow-2xl"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready for Better Skin?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of customers who've found their perfect skincare routine
          </p>
          <Link href="/consultation">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white text-purple-600 text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              Get Started — It's Free!
            </motion.button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}