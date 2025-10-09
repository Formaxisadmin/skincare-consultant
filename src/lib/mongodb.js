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
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
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
  },
  customerInfo: {
    name: String,
    email: String,
    phone: String,
  },
  responses: {
    ageRange: String,
    gender: String,
    skinType: String,
    sensitivity: String,
    primaryConcerns: [String],
    acneSeverity: String,
    currentRoutine: String,
    sunExposure: String,
    climate: String,
    lifestyleFactors: [String],
    budget: String,
    preferences: [String],
  },
  analysis: {
    skinProfile: Object,
    identifiedConcerns: Array,
    priorityScore: Object,
  },
  recommendations: {
    products: Array,
    morningRoutine: Array,
    eveningRoutine: Array,
  },
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
  price: Number,
  skinTypes: [String],
  concernsAddressed: [String],
  sensitivitySafe: Boolean,
  keyIngredients: [String],
  avoidIngredients: [String],
  climateSuitability: [String],
  budgetTier: {
    type: String,
    enum: ['budget', 'mid', 'premium'],
  },
  preferences: [String],
  usage: {
    type: String,
    enum: ['morning', 'evening', 'both'],
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'alternate'],
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
});

export const Consultation = mongoose.models.Consultation || mongoose.model('Consultation', ConsultationSchema);
export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

export default connectDB;