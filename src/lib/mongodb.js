// lib/mongodb.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // Timeout settings to handle DNS resolution and connection issues
      serverSelectionTimeoutMS: 30000, // 30 seconds - how long to wait for server selection
      socketTimeoutMS: 45000, // 45 seconds - how long to wait for socket operations
      connectTimeoutMS: 30000, // 30 seconds - how long to wait for initial connection
      // Retry settings
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 0, // Minimum connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      // Heartbeat settings to keep connection alive
      heartbeatFrequencyMS: 10000, // Send heartbeat every 10 seconds
      // Retry writes
      retryWrites: true,
      retryReads: true,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('✅ MongoDB connected successfully');
        return mongoose;
      })
      .catch((error) => {
        console.error('❌ MongoDB connection error:', error);
        // Provide more helpful error messages
        if (error.code === 'ETIMEOUT') {
          console.error('   → DNS timeout: Unable to resolve MongoDB Atlas SRV record');
          console.error('   → Possible causes:');
          console.error('      - Network connectivity issues');
          console.error('      - DNS server problems');
          console.error('      - Firewall blocking connection');
          console.error('      - MongoDB Atlas cluster is unreachable');
          console.error('   → Check your internet connection and MongoDB Atlas cluster status');
        } else if (error.code === 'ENOTFOUND') {
          console.error('   → DNS error: Unable to find MongoDB Atlas hostname');
          console.error('   → Check your MONGODB_URI environment variable');
        } else if (error.code === 'ECONNREFUSED') {
          console.error('   → Connection refused: MongoDB server is not accepting connections');
          console.error('   → Check your MongoDB Atlas IP whitelist settings');
        }
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Consultation Schema
const ConsultationSchema = new mongoose.Schema({
  consultationId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  customerInfo: {
    name: String,
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      index: true,
    },
  },
  responses: {
    ageRange: String,
    gender: String, // Kept for backward compatibility, but not used in scoring
    skinType: String,
    sensitivity: String,
    primaryConcerns: [String],
    acneSeverity: String,
    currentRoutine: String,
    sunExposure: String,
    climate: String,
    lifestyleFactors: [String],
    // Conditional questions (only present if user selected relevant lifestyle factors)
    facialHairRemovalMethod: String, // Conditional: only if facial-hair-removal selected
    facialHairRemovalFrequency: String, // Conditional: only if method selected
    makeupType: String, // Conditional: only if makeup selected
    stressSkinIssues: [String], // Conditional: only if stress selected
    scentPreference: mongoose.Schema.Types.Mixed, // Always shown, can be String (legacy) or [String] (multiple choice)
    preferences: [String],
    allergies: [String], // Hard constraints - ingredients to avoid
    budget: String, // Budget preference: 'low', 'medium', 'high'
  },
  analysis: {
    skinProfile: Object,
    identifiedConcerns: Array,
    priorityScore: Object,
  },
      recommendations: {
        products: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
        },
        phasedRecommendations: {
          type: mongoose.Schema.Types.Mixed,
          default: null,
        }, // PHASE 3.3: Phased routine rollout
        morningRoutine: Array,
        eveningRoutine: Array,
        savedRoutine: Array, // User-selected routine products (auto-saved)
        notices: [String], // PHASE 2.1: Multi-pass system notices
      },
      wishlist: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      }, // User's wishlist items (products they're interested in)
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Product Schema
const ProductSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  brand: String,
  category: {
    type: String,
    enum: ['cleanser', 'toner', 'serum', 'moisturizer', 'spf', 'mask', 'eye_cream', 'treatment'],
  },
  subCategory: String,
  skinTypes: [String],
  concernsAddressed: [String],
  sensitivitySafe: Boolean,
  keyIngredients: [String],
  fullIngredientList: [String], // Complete ingredient list for allergy checking
  gender: {
    type: String,
    enum: ['male', 'female', 'neutral'],
    default: 'neutral',
  },
  texture: {
    type: String,
    enum: ['gel', 'lightweight', 'gel-cream', 'cream', 'rich-cream', 'balm'],
  },
  climateSuitability: [String],
  preferences: [String],
  usage: {
    type: String,
    enum: ['morning', 'evening', 'both'],
    default: 'both',
  },
  frequency: {
    type: String,
    // Extended frequency values: daily, weekly, alternate, as-needed, nightly, 
    // 1-2-times-a-week, 2-3-times-a-week, 3-4-times-a-week, reapply-as-needed
    // Removed enum restriction to allow extended values from upload script
    default: 'daily',
  },
  description: String,
  benefits: String,
  instructions: String,
  rating: Number,
  imageUrl: String,
  productUrl: String,
  inStock: {
    type: Boolean,
    default: true,
  },
  // Shopify integration fields
  shopifyProductId: {
    type: mongoose.Schema.Types.Mixed, // Use Mixed to handle both String and Number types
    default: null,
    index: true,
  },
  shopifyVariantId: {
    type: mongoose.Schema.Types.Mixed, // Use Mixed to handle both String and Number types
    default: null,
  },
  // Keep variantId for backward compatibility, but prefer productId
});

export const Consultation = mongoose.models.Consultation || mongoose.model('Consultation', ConsultationSchema);
export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

export default connectDB;