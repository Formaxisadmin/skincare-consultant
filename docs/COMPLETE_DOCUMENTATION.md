# Skincare Consultant System - Complete Documentation

## 📖 Table of Contents

1. [Overview](#overview)
2. [Quick Start Guide](#quick-start-guide)
3. [System Architecture](#system-architecture)
4. [Database Schema](#database-schema)
5. [Recommendation Engine](#recommendation-engine)
6. [User Interface](#user-interface)
7. [Features & Implementation](#features--implementation)
8. [Data Management](#data-management)
9. [Integration Guides](#integration-guides)
10. [Future Enhancements](#future-enhancements)

---

## Overview

The Skincare Consultant System is a Next.js web application that provides personalized skincare product recommendations based on user questionnaires. The system uses a sophisticated multi-pass recommendation engine with hard/soft constraints, allergy checking, and phased routine rollout.

### Key Features

- **Intelligent Recommendation Engine**: Multi-pass system ensures users always get complete routines
- **Allergy Safety**: Hard constraints prevent products with allergens from being recommended
- **Personalized Scoring**: Age-based texture preferences, climate suitability, product ratings
- **Transparent Recommendations**: Reasoning snippets explain why each product was chosen
- **Phased Routines**: Products organized by priority (Core → Treatment → Boosters)
- **Interactive Alternatives**: Users can swap products and see alternatives
- **Shopify Integration**: Direct cart integration with Shopify store

---

## Quick Start Guide

### Prerequisites

- Node.js v18.17 or later
- MongoDB Atlas account (or local MongoDB)
- Git (for cloning)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Formaxisadmin/skincare-consultant.git
   cd skincare-consultant
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env.local`
   - Add your MongoDB connection string
   - Add Shopify store URL (if using Shopify integration)

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Open http://localhost:3000 in your browser

### Environment Variables

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SHOPIFY_STORE_URL=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-token
```

---

## System Architecture

### Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **State Management**: React Context API
- **UI Components**: Radix UI, Lucide React
- **E-commerce**: Shopify Storefront API

### Application Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API endpoints
│   ├── consultation/      # Consultation flow
│   └── report/            # Report viewing
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── [feature components]
├── context/              # React contexts (Cart, Consultation, Wishlist)
├── data/                 # Static data (questions, mappings)
├── lib/                  # Core logic
│   ├── recommendationEngine.js  # Main recommendation engine
│   ├── mongodb.js        # Database models
│   └── [utility modules]
└── styles/               # Global styles
```

### Key Components

- **RecommendationEngine**: Core recommendation logic with multi-pass system
- **QuestionnaireFlow**: Dynamic questionnaire with conditional questions
- **ReportViewer**: Displays recommendations with reasoning and alternatives
- **CartContext**: Manages shopping cart state
- **ShopifyCart**: Handles Shopify integration

---

## Database Schema

### Product Schema

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `productId` | String | Unique identifier (required, unique) |
| `name` | String | Product name (required) |
| `category` | String | Product category: `cleanser`, `toner`, `serum`, `moisturizer`, `spf`, `mask`, `eye_cream`, `treatment`, `other` (required) |
| `inStock` | Boolean | Availability status (required, default: `true`) |
| `skinTypes` | Array[String] | Compatible skin types: `oily`, `dry`, `combination`, `normal`, `sensitive` (required) |
| `concernsAddressed` | Array[String] | Skin concerns addressed (required, core concerns only after mapping) |
| `sensitivitySafe` | Boolean | Safe for sensitive skin (required) |
| `keyIngredients` | Array[String] | Key active ingredients (required, normalized) |
| `usage` | String | When to use: `morning`, `evening`, `both` (required, default: `both`) |

#### Optional but Important Fields

| Field | Type | Description |
|-------|------|-------------|
| `fullIngredientList` | Array[String] | Complete ingredient list (critical for allergy checking) |
| `texture` | String | Product texture: `gel`, `lightweight`, `gel-cream`, `cream`, `rich-cream`, `balm` |
| `climateSuitability` | Array[String] | Suitable climates: `hot-humid`, `cold-dry`, `temperate`, `tropical` |
| `preferences` | Array[String] | Product preferences (40+ valid values) |
| `rating` | Number | Product rating (0-5 scale) |
| `gender` | String | Gender targeting: `male`, `female`, `neutral` (not used in scoring, backward compatibility) |

#### Full Field List

See [DATABASE_SCHEMA.md](./reference/DATABASE_SCHEMA.md) for complete field definitions and validation rules.

### Consultation Schema

| Field | Type | Description |
|-------|------|-------------|
| `consultationId` | String | Unique consultation ID (required, unique, indexed) |
| `customerInfo` | Object | Customer details (name, email, phone) |
| `responses` | Object | User questionnaire responses |
| `recommendations` | Object | Generated recommendations |
| `phasedRecommendations` | Object | Products organized by phase (Phase 1, 2, 3) |
| `notices` | Array[String] | Multi-pass system notices |
| `createdAt` | Date | Creation timestamp |

---

## Recommendation Engine

### Overview

The recommendation engine uses a sophisticated multi-pass scoring system that ensures users always receive complete routines, even with strict constraints.

### Scoring Components

1. **Skin Type Match** (25 points) - Primary compatibility check
2. **Concern Relevance** (35 points) - Priority-weighted concern matching
3. **Ingredient Match** (20 points) - Key ingredients alignment
4. **Sensitivity Compatibility** (10 points) - Safe for sensitive skin
5. **Texture Match** (8 points) - Age + Skin Type matrix
6. **Climate Suitability** (5 points) - Climate compatibility
7. **Product Rating** (0-10 points) - Normalized rating score
8. **Preferences** (+5/-10 points) - Soft constraint bonuses/penalties
9. **Conditional Logic** (variable) - Shaving, makeup, stress bonuses
10. **Hard Constraints** (-999 points) - Allergies (disqualifies product)

### Multi-Pass System

#### Pass 1: Perfect Match
- All constraints applied (hard, soft, preferences)
- Minimum score: 20 points
- Returns complete routine if successful

#### Pass 2: Relax Preferences
- Ignores preference penalties/bonuses
- Maintains all other constraints
- Notice: "We've relaxed some preference constraints..."

#### Pass 3: Relax Secondary Concerns
- Ignores preferences + removes lowest priority concern
- Focuses on primary concerns
- Minimum score: 15 points (lowered)
- Notice: "We're focusing on your primary concerns..."

#### Pass 4: Essential Fallback
- Minimal scoring (skin type + sensitivity only)
- Only critical categories (cleanser, SPF)
- Ensures basic routine is always available
- Notice: "We've selected essential products..."

### Phased Routine Rollout

Products are organized into three phases:

1. **Phase 1: Core (Must-Haves)**
   - Cleanser, Moisturizer, SPF
   - Essential products for healthy skin
   - Green border/background in UI

2. **Phase 2: Treatment (High-Impact)**
   - One serum/treatment targeting #1 primary concern
   - Added once core routine is established
   - Blue border/background in UI

3. **Phase 3: Boosters (Optimize)**
   - Everything else (toner, eye cream, mask, secondary serums)
   - Optional enhancements
   - Purple border/background in UI

### Reasoning Snippets

Each product recommendation includes reasoning explaining:
- Why the product matches the user's skin type
- Which concerns it addresses
- Key ingredients and their benefits
- Climate suitability
- Product rating
- Preference matches
- Conditional logic explanations (e.g., "Contains soothing ingredients perfect for frequent shaving")

---

## User Interface

### Questionnaire Flow

- **Dynamic Questions**: Conditional questions based on previous responses
- **Two-Column Layout**: Options displayed side-by-side for better UX
- **Progress Bar**: Visual indication of completion progress
- **Save Progress**: Users can save and resume later

### Report Viewer

- **Phased Display**: Products organized by priority phase
- **Reasoning Snippets**: Blue info boxes explain each recommendation
- **Interactive Alternatives**: "See Alternative" button for product swapping
- **Notices Display**: Transparent communication about compromises
- **Add to Cart**: Direct integration with Shopify cart
- **Save Report**: Email-based report saving and retrieval

### Key UI Features

- Responsive design (mobile-first)
- Smooth animations and transitions
- Collapsible sections
- Quick View / Detailed View modes
- Side-by-side product comparison

---

## Features & Implementation

### Phase 0: Technical Foundation ✅

- Category name standardization (`eye-cream` → `eye_cream`)
- Data validation and normalization
- Case-insensitive string comparisons
- Database schema updates

### Phase 1: Enhanced Profile & Concern Analysis ✅

- **Allergies & Preferences**: Hard constraints (allergies) and soft constraints (preferences)
- **Conditional Questions**: Facial hair removal, makeup, stress skin issues
- **Age + Skin Type Texture Matrix**: Improved texture recommendations
- **Behavioral Logic**: Replaces gender-based scoring with behavioral questions

### Phase 2: Flawless Recommendation Core ✅

- **Multi-Pass System**: Ensures complete routines for all users
- **Climate Suitability Scoring**: Products matched to user's climate
- **Product Rating Scoring**: Quality products prioritized
- **Concern Priority Weighting**: Primary concerns weighted higher
- **Product Diversity**: Prefers different brands when scores are similar

### Phase 3: Flawless Report Output ✅

- **Reasoning Snippets**: Transparent explanation of each recommendation
- **Phased Routine Rollout**: Products organized by priority
- **Interactive Swapping**: Users can see and swap alternatives
- **Display Notices**: Clear communication about compromises
- **Enhanced Product Display**: Better UX with reasoning and alternatives

### Phase 4: Advanced User Experience (Planned)

- Routine Integration & Patching
- Enhanced Alternative Suggestions
- User Preferences Learning
- Report Customization

---

## Data Management

### Product Data Upload

See [Data Upload Tool Documentation](../data-upload/README.md) for complete guide.

**Key Points:**
- CSV/Excel file format required
- Automatic normalization and validation
- Category mapping (Excel format → database format)
- Concern mapping (extended → core concerns)
- Ingredient normalization (lowercase, hyphens)

### Required CSV Columns

- `CATEGORY`, `NAME`, `BRAND`, `INSTOCK`, `MRP`
- `SKINTYPES`, `CONCERNSADDRESSED`, `SENSITIVITYSAFE`, `KEYINGREDIENTS`
- `FULLINGREDIENTLIST` (critical for allergies)
- `USAGE`, `TEXTURE`, `CLIMATESUITABILITY`, `PREFERENCES`, `RATING`
- See [DATABASE_SCHEMA.md](./reference/DATABASE_SCHEMA.md) for complete list

---

## Integration Guides

### Shopify Integration

The system integrates with Shopify for cart management and product synchronization.

**Setup:**
1. Create Shopify Storefront API access token
2. Configure environment variables
3. Set up product sync (optional)

**Features:**
- Add to cart functionality
- Variant selection
- Cart state management
- Product URL mapping

See [SHOPIFY_API_SETUP_GUIDE.md](./guides/SHOPIFY_API_SETUP_GUIDE.md) for detailed setup instructions.

---

## Future Enhancements

### Phase 4 Features (Planned)

1. **Routine Integration & Patching** - Let users keep products they love
2. **Enhanced Alternative Suggestions** - Show 3-5 alternatives with filtering
3. **User Preferences Learning** - Learn from user behavior over time
4. **Report Customization** - Allow users to customize report display

See [PHASE_4_PLAN.md](./implementation/PHASE_4_PLAN.md) for detailed planning.

---

## Additional Resources

### Documentation Files

- [Database Schema](./reference/DATABASE_SCHEMA.md) - Complete schema documentation
- [Backend Engine Logic](./reference/BACKEND_ENGINE_LOGIC.md) - Detailed engine explanation
- [UI Structure Documentation](./reference/) - UI specifications
- [Implementation Summaries](./implementation/) - Phase-by-phase implementation details
- [Requirements Analysis](./implementation/REQUIREMENTS_STATUS_ANALYSIS.md) - Requirements status

### Support

For questions or issues:
1. Check the relevant documentation file
2. Review implementation summaries for feature details
3. Consult database schema for data requirements

---

**Last Updated**: December 2025  
**Version**: 1.0.0

