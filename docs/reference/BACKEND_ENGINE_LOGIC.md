# Backend Engine Logic Documentation

## Overview

This document provides a comprehensive explanation of the skincare consultation engine's backend logic, covering the complete flow from user input identification to final report generation. The engine uses a sophisticated multi-pass scoring system with priority-based concern weighting, constraint relaxation, and phased product recommendations.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Input Identification & Validation](#input-identification--validation)
3. [Profile Building](#profile-building)
4. [Concern Analysis & Prioritization](#concern-analysis--prioritization)
5. [Product Matching & Scoring](#product-matching--scoring)
6. [Multi-Pass Recommendation System](#multi-pass-recommendation-system)
7. [Routine Building](#routine-building)
8. [Phased Recommendations (3-Phase System)](#phased-recommendations-3-phase-system)
9. [Report Generation](#report-generation)
10. [Database Schema & Storage](#database-schema--storage)

---

## Architecture Overview

### Core Components

1. **RecommendationEngine** (`src/lib/recommendationEngine.js`): The main engine class that orchestrates the entire recommendation process
2. **submit-consultation API** (`src/app/api/submit-consultation/route.js`): The API endpoint that receives user responses and triggers the engine
3. **concernMapping** (`src/data/concernMapping.js`): Defines concern-specific requirements, ingredients, and priority modifiers
4. **MongoDB Models** (`src/lib/mongodb.js`): Database schemas for consultations and products

### High-Level Flow

```
User Responses → Validation → Profile Building → Concern Analysis → 
Product Scoring → Multi-Pass Matching → Routine Building → 
Phased Categorization → Report Generation → Database Storage
```

---

## Input Identification & Validation

### 1. API Endpoint Entry Point

**Location**: `src/app/api/submit-consultation/route.js`

The POST endpoint receives:
```javascript
{
  responses: {
    ageRange: String,
    skinType: String,
    sensitivity: String,
    primaryConcerns: [String],
    acneSeverity: String (conditional),
    currentRoutine: String,
    sunExposure: String,
    climate: String,
    lifestyleFactors: [String],
    facialHairRemovalMethod: String (conditional),
    facialHairRemovalFrequency: String (conditional),
    makeupType: String (conditional),
    stressSkinIssues: [String] (conditional),
    scentPreference: String,
    preferences: [String],
    allergies: [String]
  },
  customerInfo: {
    name: String,
    email: String,
    phone: String
  }
}
```

### 2. Input Validation

**Required Fields Check**:
- `skinType`: Must be provided
- `primaryConcerns`: Must be a non-empty array

**Conditional Fields**:
- `acneSeverity`: Only required if `primaryConcerns` includes 'acne'
- `facialHairRemovalMethod`: Only present if `lifestyleFactors` includes 'facial-hair-removal'
- `makeupType`: Only present if `lifestyleFactors` includes 'makeup'
- `stressSkinIssues`: Only present if `lifestyleFactors` includes 'stress'

### 3. Product Catalog Fetch

The engine fetches all in-stock products from MongoDB:
```javascript
const productList = await Product.find({ inStock: true }).lean();
```

**Critical Check**: If no products are found, the process stops and returns a 503 error.

---

## Profile Building

### 1. Profile Construction

**Location**: `RecommendationEngine.buildProfile()`

The profile aggregates all user responses into a structured object:

```javascript
{
  ageRange: String,
  skinType: String,
  sensitivity: String,
  currentRoutine: String,
  sunExposure: String,
  climate: String,
  lifestyleFactors: [String],
  facialHairRemovalMethod: String,
  facialHairRemovalFrequency: String,
  makeupType: String,
  stressSkinIssues: [String],
  scentPreference: String,
  preferredTexture: [String], // Calculated based on Age + Skin Type matrix
  allergies: [String], // Hard constraints
  preferences: [String] // Soft constraints
}
```

### 2. Texture Preference Calculation

**Location**: `RecommendationEngine.getPreferredTexture()`

This is a **critical calculation** that determines product texture preferences based on:

1. **Skin Type (70% weight)**: Base texture preferences
   - Dry → `['cream', 'rich-cream', 'balm']`
   - Oily → `['gel', 'lightweight', 'gel-cream']`
   - Combination → `['gel-cream', 'cream', 'lightweight']`
   - Normal → `['gel-cream', 'cream', 'lightweight']`
   - Sensitive → `['gel-cream', 'lightweight', 'cream']`

2. **Age Range (30% weight)**: Age-based adjustments
   - Under 18-25: Prefer lightweight textures
   - 26-35: Prefer gel-cream
   - 36-45: Prefer cream
   - 46-55: Prefer rich-cream
   - 56+: Prefer rich-cream/balm

3. **Priority-Based Override**: The #1 concern (highest priority) can override texture preferences
   - If #1 concern is acne/oiliness → Force lightweight textures
   - If #1 concern is dryness/aging → Force heavier textures (cream/rich-cream)

**Example**: A user with oily skin, age 30, but #1 concern is dryness will get `['gel-cream', 'cream', 'rich-cream']` (dryness concern overrides oily skin preference).

---

## Concern Analysis & Prioritization

### 1. Concern Identification

**Location**: `RecommendationEngine.analyzeConcerns()`

The engine maps user-selected concerns to detailed concern objects from `concernMapping.js`:

```javascript
{
  concern: 'acne',
  name: 'Acne & Breakouts',
  description: 'Active breakouts, blackheads, or acne-prone skin',
  priorityScore: 2.1, // Calculated based on modifiers
  requiredCategories: ['cleanser', 'toner', 'serum', 'moisturizer', 'spf'],
  keyIngredients: ['salicylic-acid', 'benzoyl-peroxide', 'niacinamide', ...],
  avoidIngredients: ['heavy-oils', 'coconut-oil', 'thick-butters']
}
```

### 2. Priority Score Calculation

**Location**: `RecommendationEngine.analyzeConcerns()`

Priority scores determine which concerns are most important. The base score is `1.0`, and modifiers are applied:

#### Age-Based Modifiers

```javascript
ageFactors: {
  under18: { acne: 1.5, oiliness: 1.3, aging: 0.3, ... },
  '18-25': { acne: 1.4, oiliness: 1.2, aging: 0.5, ... },
  '26-35': { acne: 1.0, aging: 1.2, pigmentation: 1.3, ... },
  '36-45': { aging: 1.5, pigmentation: 1.4, dryness: 1.2, ... },
  '46-55': { aging: 1.7, dryness: 1.5, pigmentation: 1.3, ... },
  '56+': { aging: 1.8, dryness: 1.6, pigmentation: 1.2, ... }
}
```

**Example**: A 20-year-old with acne gets `1.0 * 1.4 = 1.4` priority score, while a 50-year-old with acne gets `1.0 * 0.5 = 0.5`.

#### Sun Exposure Modifiers

```javascript
sunExposureFactors: {
  minimal: { pigmentation: 1.0, aging: 1.0 },
  moderate: { pigmentation: 1.3, aging: 1.2 },
  high: { pigmentation: 1.6, aging: 1.4 }
}
```

#### Acne Severity Modifiers

```javascript
acneSeverityFactors: {
  mild: 1.0,
  moderate: 1.5,
  severe: 2.0
}
```

**Example**: A 20-year-old with severe acne gets `1.0 * 1.4 (age) * 2.0 (severity) = 2.8` priority score.

### 3. Concern Sorting

Concerns are sorted by priority score (highest first). The #1 concern (highest priority) is used throughout the engine for:
- Texture preference overrides
- Product scoring penalties/bonuses
- Phase 2 product selection (serums/treatments)

---

## Product Matching & Scoring

### 1. Product Validation

**Location**: `RecommendationEngine.validateProduct()`

Before scoring, products are validated and normalized:

**Required Fields**:
- `productId`: Unique identifier
- `name`: Product name
- `category`: Product category (normalized to handle 'eye-cream' vs 'eye_cream')

**Array Fields** (defaulted to empty arrays if missing):
- `skinTypes`: Compatible skin types
- `concernsAddressed`: Concerns the product addresses
- `keyIngredients`: Key active ingredients
- `avoidIngredients`: Ingredients to avoid
- `preferences`: Product preferences (vegan, cruelty-free, etc.)
- `climateSuitability`: Suitable climates
- `fullIngredientList`: Complete ingredient list (for allergy checking)

**Normalization**: All strings are lowercased and trimmed for case-insensitive comparisons.

### 2. Scoring System

**Location**: `RecommendationEngine.calculateProductScore()`

The scoring system uses a **100-point scale** with the following breakdown:

#### Hard Constraints (Allergies) - Checked First

**Score: -999 (Disqualification)**

If a product contains ANY user-allergic ingredient, it is immediately disqualified:
- Checks `fullIngredientList` first (most comprehensive)
- Falls back to `keyIngredients` if `fullIngredientList` is empty
- Uses partial matching (e.g., "vitamin-c" matches "ascorbic-acid")

**Example**: If user is allergic to "vitamin-c" and product contains "ascorbic-acid", product is disqualified.

#### Core Scoring Components

1. **Skin Type Match (25 points)**
   - Full bonus if product's `skinTypes` includes user's skin type or 'all'
   - **Priority-Based Override**: If #1 concern contradicts product skin type, bonus is reduced:
     - #1 concern is acne/oily but product is for dry skin → 8 points (reduced from 25)
     - #1 concern is dryness but product is for oily skin → 10 points (reduced from 25)

2. **Concern Relevance (35 points)**
   - Weighted by priority scores
   - Formula: `(matchedPriorityScore / totalPriorityScore) * 35`
   - Higher priority concerns contribute more to the score
   - Can be relaxed in Pass 3 (ignore secondary concerns)

3. **Ingredient Match (20 points)**
   - Matches product's `keyIngredients` with user's preferred ingredients (from concerns)
   - Formula: `(ingredientMatches / totalPreferredIngredients) * 20`
   - Capped at 20 points

4. **Sensitivity Compatibility (10 points)**
   - If user is very/somewhat sensitive:
     - Sensitivity-safe product: +10 points
     - Non-safe product: -15 points (penalty)
   - If user is not sensitive: +5 points (neutral bonus)

5. **Texture Matching (18-20 points)** ⭐ **HIGHEST WEIGHT**
   - Texture matching is weighted more heavily than rating (18-20 points vs 10 points)
   - Full bonus if product texture matches preferred textures
   - **Priority-Based Penalties**:
     - #1 concern is acne/oily + heavy texture → -15 points
     - #1 concern is dryness + light texture (when heavy preferred) → -8 points
     - General texture mismatch → -5 to -10 points

6. **Climate Suitability (5 points)**
   - Bonus if product's `climateSuitability` includes user's climate or 'all'

7. **Product Rating (10 points)**
   - Normalized from 5-star scale to 10 points
   - Formula: `(rating / 5) * 10`
   - Capped at 10 points

#### Conditional Logic Scoring

**Facial Hair Removal**:
- Shaving: Bonus for soothing ingredients (centella, aloe-vera, niacinamide), penalty for irritants (alcohol)
- Waxing/Threading: Bonus for calming ingredients and barrier repair ingredients
- Laser: Bonus for sensitivity-safe products and gentle ingredients

**Heavy Makeup Use**:
- Double cleansing products (oil cleansers): +5 points
- Non-comedogenic products: +3 points
- Pore-clearing ingredients: +3 points

**Stress-Related Skin Issues**:
- Breakouts: Bonus for acne-fighting ingredients
- Inflammation: Bonus for calming ingredients (+5 points) and barrier repair (+3 points)
- Dryness: Bonus for barrier repair and hydrating ingredients

**Scent Preference**:
- Matches user's scent preference: +3 points
- Fragrance-free when user wants unscented: +3 points

#### Soft Constraints (Preferences)

**Location**: Applied only if `ignorePreferences` option is false

- **Matching Preferences**: +5 points per match (capped at 15 points)
  - Examples: vegan, cruelty-free, organic, fragrance-free, non-comedogenic
- **Mismatched Preferences**: -10 points per mismatch (capped at -30 points)
  - Product doesn't have user's preferred attributes

#### Avoid Ingredients Penalties

- **Concern-Based Avoid Ingredients**: -20 points if product contains ingredients to avoid
- **Product's Avoid Ingredients**: -10 points if product's avoid list overlaps with user's concerns

### 3. Scoring Options

The `calculateProductScore()` function accepts options:

```javascript
{
  ignorePreferences: boolean, // Ignore preference scoring
  ignoreSecondaryConcerns: boolean, // Ignore lower priority concerns
  minimalScoring: boolean // Only skin type + sensitivity (Pass 4 fallback)
}
```

---

## Multi-Pass Recommendation System

### 1. Overview

The engine uses a **4-pass system** to ensure all required categories are filled with quality products:

1. **Pass 1: Perfect Match** - All constraints (hard, soft, preferences)
2. **Pass 2: Relax Preferences** - Ignore preference penalties/bonuses
3. **Pass 3: Relax Secondary Concerns** - Focus on primary concerns only
4. **Pass 4: Essential Fallback** - Minimal scoring for critical categories (cleanser, SPF)

### 2. Pass 1: Perfect Match

**Location**: `RecommendationEngine.recommendProducts()`

1. Score all products with full constraints
2. Filter out products with score <= 0 (includes disqualified products with -999 score)
3. For each required category:
   - Filter products by category and `inStock === true`
   - Sort by score (highest first)
   - Apply **Product Diversity** logic:
     - Prefer different brands when scores are similar (within 5 points)
     - Select top 2 products per category
4. Validate: Check if all required categories have products with score >= 20
5. If valid → Return recommendations

### 3. Pass 2: Relax Preferences

**Triggered**: If Pass 1 doesn't fill all required categories

1. Re-score all products with `ignorePreferences: true`
2. Re-select products for missing categories only
3. Apply product diversity logic
4. Validate: Check if all required categories have products with score >= 20
5. If valid → Return recommendations with notice: "We've relaxed some preference constraints..."

### 4. Pass 3: Relax Secondary Concerns

**Triggered**: If Pass 2 doesn't fill all required categories AND user has multiple concerns

1. Re-score products with:
   - `ignorePreferences: true`
   - `ignoreSecondaryConcerns: true` (removes lowest priority concern from calculation)
2. Re-select products for missing categories
3. Validate: Check if all required categories have products with score >= 15 (lower threshold)
4. If valid → Return recommendations with notice: "We're focusing on your primary concerns..."

### 5. Pass 4: Essential Fallback

**Triggered**: If Pass 3 doesn't fill critical categories (cleanser, SPF)

1. For missing critical categories only:
   - Use `minimalScoring: true` (only skin type + sensitivity)
   - Score: Skin type match (25 points) + Sensitivity compatibility (10 points)
2. Select top 2 products per category
3. Return recommendations with notice: "We've selected essential products based on your skin type and sensitivity..."

### 6. Product Diversity Logic

**Purpose**: Avoid recommending multiple products from the same brand when scores are similar

**Algorithm**:
1. Track used brands in a Set
2. For each product in sorted list:
   - If we have 1 product and this product is from the same brand with score within 5 points → Skip
   - Otherwise → Add to recommendations
3. If we still don't have 2 products, fill with remaining top products (even if same brand)

---

## Routine Building

### 1. Morning Routine

**Location**: `RecommendationEngine.buildMorningRoutine()`

**Steps** (in order):
1. Cleanser
2. Toner
3. Serum
4. Eye Cream
5. Moisturizer
6. SPF

**Usage Time Filtering**:
- Only includes products where `usage === 'morning'` or `usage === 'both'`

**Sensitivity Handling**:
- For very/somewhat sensitive skin:
  - Prioritizes sensitivity-safe products
  - For eye_cream category: Skips if no safe morning option exists (retinol eye creams are photosensitive)

**Instructions** (category-specific):
- Cleanser: "Optional in the morning if skin feels clean. Use lukewarm water." (dry/normal) or "Gently massage onto damp skin, rinse with lukewarm water." (oily)
- Toner: "Apply to clean skin with cotton pad or pat with hands."
- Serum: "Apply 2-3 drops to face and neck. Pat gently until absorbed. Wait 30 seconds before next step."
- Eye Cream: "Gently pat a small amount around eye area using ring finger."
- Moisturizer: "Apply evenly to face and neck. Let it absorb for 1-2 minutes."
- SPF: "Apply generously (2 finger lengths). This is the most important step! Reapply every 2 hours if outdoors." (marked as important)

### 2. Evening Routine

**Location**: `RecommendationEngine.buildEveningRoutine()`

**Steps** (in order):
1. Cleanser
2. Toner
3. Serum
4. Treatment
5. Eye Cream
6. Moisturizer

**Usage Time Filtering**:
- Only includes products where `usage === 'evening'` or `usage === 'both'`

**Frequency Handling**:
- Uses product's `frequency` field if available (e.g., "2-3x per week")
- Defaults to "daily"
- For toner with exfoliating concerns (acne, texture, dullness): "2-3x per week"
- For treatment: "2-3x per week initially"

**Instructions** (category-specific):
- Cleanser: "Double cleanse: First with oil-based cleanser (if wearing makeup/SPF), then with regular cleanser. Massage for 60 seconds."
- Toner: "Apply to clean skin. If using exfoliating toner, start 2x/week and gradually increase."
- Serum: "Layer serums from thinnest to thickest. Wait 30 seconds between each."
- Treatment: "Apply treatment product (retinol/acids). Start 2x/week, build up to daily. Always follow with moisturizer." (marked as important)
- Eye Cream: "Gently pat around eye area. Use ring finger for gentlest application."
- Moisturizer: "Apply generously. Can layer with face oil if very dry."

---

## Phased Recommendations (3-Phase System)

### 1. Overview

**Location**: `RecommendationEngine.categorizeProductsByPhase()`

Products are categorized into 3 phases for gradual routine introduction:

- **Phase 1: The Core Foundation** - Must-haves (cleanser, moisturizer, SPF)
- **Phase 2: The Primary Solution** - Products addressing serious concerns (serums, treatments)
- **Phase 3: The Optimizers & Boosters** - Everything else (toner, eye-cream, mask, secondary serums/treatments)

### 2. Phase 1: The Core Foundation

**Categories**: `['cleanser', 'moisturizer', 'spf']`

All products in these categories are automatically assigned to Phase 1.

### 3. Phase 2: The Primary Solution

**Purpose**: Address the user's #1 concern (highest priority) with active ingredients

#### Serious Concerns Definition

```javascript
const seriousConcerns = ['acne', 'aging', 'pigmentation', 'texture', 'dullness', 'wrinkles'];
```

#### Product Selection Logic

1. **Score Threshold**:
   - Default: 30 points
   - For severe serious concerns (e.g., severe acne): 20 points
   - For very high priority (priorityScore >= 2.5): 20 points

2. **Product Categories**: Serums and treatments only

3. **Scoring**:
   - Re-score with `ignoreSecondaryConcerns: true` (focus on primary concern only)
   - For very sensitive skin: Prioritize sensitivity-safe products
   - For severe acne: Lower threshold to 20 points, or fallback to 15 points if no products meet threshold

4. **Sensitivity Handling**:
   - For very sensitive skin:
     - Prefer sensitivity-safe products
     - If safe products exist, exclude non-safe products
     - If no safe products exist, include top non-safe product as last resort

5. **Fallback Logic**:
   - If no serum/treatment products found in recommendations AND user has serious concern:
     - Search all available products (not just recommendations)
     - Apply lenient scoring (ignore preferences, focus on primary concern)
     - Prioritize sensitivity-safe products
     - Minimum score: 20 for safe, 25 for non-safe

#### Example Scenarios

**Scenario 1**: User has severe acne (priorityScore = 2.8)
- Includes all serums and treatments that score >= 20 points
- Prioritizes sensitivity-safe products if user is very sensitive
- If no products meet threshold, includes top product even if score is 15+

**Scenario 2**: User has aging concern (priorityScore = 1.5)
- Includes top serum AND top treatment if both score >= 30 points
- If only one scores >= 30, includes that one

**Scenario 3**: User has dryness (not a serious concern)
- Includes top serum AND top treatment if both score >= 30 points

### 4. Phase 3: The Optimizers & Boosters

**Categories**: All remaining categories (toner, eye-cream, mask, secondary serums/treatments)

**Logic**:
- Includes all products NOT in Phase 1 or Phase 2
- Marks products that target secondary concerns (#2, #3 concerns) with `isSecondary: true`

### 5. Merging Phase 2 into Recommendations

**Location**: `RecommendationEngine.generateCompleteAnalysis()`

Phase 2 products are merged into the main recommendations object so they appear in routines:

1. For each Phase 2 category:
   - If category exists in recommendations: Merge products (avoid duplicates)
   - If category doesn't exist: Add it with Phase 2 products
2. Sort by: Sensitivity-safe first (for very sensitive skin), then by score
3. Remove `phase` and `phaseLabel` properties before adding to recommendations

---

## Report Generation

### 1. Complete Analysis Generation

**Location**: `RecommendationEngine.generateCompleteAnalysis()`

This is the main entry point that orchestrates the entire process:

```javascript
async generateCompleteAnalysis(products) {
  // 1. Generate product recommendations (multi-pass system)
  const { recommendations, notices } = await this.recommendProducts(products);
  
  // 2. Categorize products by phase (3-phase system)
  const phasedRecommendations = this.categorizeProductsByPhase(recommendations, products);
  
  // 3. Merge Phase 2 products into recommendations
  const mergedRecommendations = { ...recommendations };
  // ... merge logic ...
  
  // 4. Build routines
  const morningRoutine = this.buildMorningRoutine(mergedRecommendations);
  const eveningRoutine = this.buildEveningRoutine(mergedRecommendations);
  
  // 5. Generate personalized tips
  const tips = this.generatePersonalizedTips();
  
  // 6. Return complete analysis
  return {
    profile: this.profile,
    concerns: this.concerns,
    recommendations: mergedRecommendations,
    phasedRecommendations,
    notices,
    morningRoutine,
    eveningRoutine,
    tips
  };
}
```

### 2. Personalized Tips Generation

**Location**: `RecommendationEngine.generatePersonalizedTips()`

Tips are generated based on:
- **Lifestyle Factors**: Stress, sleep, exercise
- **Climate**: Hot-humid, cold-dry, etc.
- **Sun Exposure**: High, moderate, minimal
- **Concerns**: Acne, aging, etc.

**Examples**:
- Stress: "High stress can trigger breakouts and inflammation. Consider incorporating calming facial massage into your routine."
- Hot-humid climate: "In humid climates, use lightweight, gel-based products and consider blotting papers for oil control."
- Acne: "Change pillowcases frequently and avoid touching your face throughout the day."

### 3. Database Storage

**Location**: `src/app/api/submit-consultation/route.js`

The consultation is saved to MongoDB with the following structure:

```javascript
{
  consultationId: String (UUID),
  customerInfo: {
    name: String,
    email: String,
    phone: String
  },
  responses: { ...user responses ... },
  analysis: {
    skinProfile: Object,
    identifiedConcerns: Array,
    priorityScore: Object
  },
  recommendations: {
    products: Object, // Merged recommendations
    phasedRecommendations: Object, // 3-phase system
    morningRoutine: Array,
    eveningRoutine: Array,
    notices: [String]
  },
  createdAt: Date
}
```

### 4. API Response

The API returns:
```javascript
{
  success: true,
  consultationId: String,
  analysis: {
    profile: Object,
    concerns: Array,
    recommendations: Object,
    phasedRecommendations: Object,
    notices: [String],
    morningRoutine: Array,
    eveningRoutine: Array,
    tips: [String]
  }
}
```

---

## Database Schema & Storage

### 1. Consultation Schema

**Location**: `src/lib/mongodb.js`

```javascript
{
  consultationId: String (unique, indexed),
  customerInfo: {
    name: String,
    email: String (lowercase, trimmed, indexed),
    phone: String (trimmed, indexed)
  },
  responses: {
    ageRange: String,
    skinType: String,
    sensitivity: String,
    primaryConcerns: [String],
    acneSeverity: String,
    currentRoutine: String,
    sunExposure: String,
    climate: String,
    lifestyleFactors: [String],
    facialHairRemovalMethod: String,
    facialHairRemovalFrequency: String,
    makeupType: String,
    stressSkinIssues: [String],
    scentPreference: String,
    preferences: [String],
    allergies: [String]
  },
  analysis: {
    skinProfile: Object,
    identifiedConcerns: Array,
    priorityScore: Object
  },
  recommendations: {
    products: Object (Mixed type),
    phasedRecommendations: Object (Mixed type),
    morningRoutine: Array,
    eveningRoutine: Array,
    notices: [String]
  },
  createdAt: Date
}
```

### 2. Product Schema

**Location**: `src/lib/mongodb.js`

```javascript
{
  productId: String (unique, required),
  name: String (required),
  brand: String,
  category: String (enum: ['cleanser', 'toner', 'serum', 'moisturizer', 'spf', 'mask', 'eye_cream', 'treatment']),
  subCategory: String,
  mrp: Number,
  skinTypes: [String],
  concernsAddressed: [String],
  sensitivitySafe: Boolean,
  keyIngredients: [String],
  avoidIngredients: [String],
  fullIngredientList: [String],
  gender: String (enum: ['male', 'female', 'neutral']),
  texture: String (enum: ['gel', 'lightweight', 'gel-cream', 'cream', 'rich-cream', 'balm']),
  climateSuitability: [String],
  preferences: [String],
  usage: String (enum: ['morning', 'evening', 'both']),
  frequency: String,
  description: String,
  benefits: String,
  instructions: String,
  rating: Number,
  imageUrl: String,
  productUrl: String,
  inStock: Boolean (default: true),
  shopifyProductId: String (indexed),
  shopifyVariantId: String
}
```

### 3. Querying Consultations

**Location**: `src/app/api/view-reports/route.js`

Consultations can be retrieved by:
- `consultationId`: Direct lookup
- `email`: Case-insensitive, trimmed
- `phone`: Trimmed
- `$or` query: Find by email OR phone

---

## Key Algorithms & Logic

### 1. Priority-Based Texture Override

**Problem**: User has conflicting needs (e.g., oily skin but dryness concern)

**Solution**: #1 concern (highest priority) overrides skin type preferences

**Algorithm**:
1. Calculate base textures from skin type (70% weight)
2. Apply age adjustments (30% weight)
3. Check #1 concern:
   - If #1 concern is acne/oiliness → Force lightweight textures
   - If #1 concern is dryness/aging → Force heavier textures
4. Reorder textures based on #1 concern priority

### 2. Multi-Pass Constraint Relaxation

**Problem**: Strict constraints may result in missing categories

**Solution**: Gradually relax constraints until all categories are filled

**Algorithm**:
1. Pass 1: Full constraints → Validate
2. If invalid → Pass 2: Relax preferences → Validate
3. If invalid → Pass 3: Relax secondary concerns → Validate
4. If invalid → Pass 4: Minimal scoring for critical categories

### 3. Sensitivity-Safe Product Prioritization

**Problem**: Very sensitive skin may filter out all treatment products

**Solution**: Prioritize sensitivity-safe products, but allow non-safe as fallback

**Algorithm**:
1. For very sensitive skin:
   - Sort products: Sensitivity-safe first, then by score
   - If safe products exist: Include only safe products
   - If no safe products exist: Include top non-safe product as last resort
2. For non-sensitive skin: Sort by score only

### 4. Product Diversity

**Problem**: Multiple products from same brand when scores are similar

**Solution**: Prefer different brands when scores are within 5 points

**Algorithm**:
1. Track used brands in Set
2. For each product:
   - If we have 1 product and this is same brand with score within 5 points → Skip
   - Otherwise → Add to recommendations
3. If we still don't have 2 products: Fill with remaining products (even if same brand)

### 5. Phase 2 Product Selection for Serious Concerns

**Problem**: Serious concerns (acne, aging) need active ingredients, but sensitive skin filters them out

**Solution**: Lenient scoring with sensitivity-safe prioritization

**Algorithm**:
1. Identify serious concerns and severity
2. Set score threshold (30 for normal, 20 for severe)
3. Re-score serums/treatments with `ignoreSecondaryConcerns: true`
4. For very sensitive skin:
   - Prioritize sensitivity-safe products
   - If no safe products exist: Search all products (not just recommendations)
   - Apply lenient scoring (ignore preferences)
   - Minimum score: 20 for safe, 25 for non-safe
5. Include all products that meet threshold (or top product if threshold not met for severe cases)

---

## Error Handling & Edge Cases

### 1. No Products in Database

**Handling**: Return 503 error with message: "Product catalog is unavailable. The database returned no in-stock products."

### 2. Missing Required Categories

**Handling**: Multi-pass system ensures all required categories are filled, even if with lower-scoring products

### 3. All Products Disqualified (Allergies)

**Handling**: Pass 4 (minimal scoring) still runs, but may return empty categories if all products contain allergens

### 4. Very Sensitive Skin + Serious Concerns

**Handling**: Phase 2 product selection uses lenient scoring and prioritizes sensitivity-safe products, but allows non-safe as last resort

### 5. Missing Texture Information

**Handling**: Neutral bonus (+2 points) instead of penalty if texture is missing

### 6. Conflicting Concerns (e.g., Acne + Dryness)

**Handling**: #1 concern (highest priority) takes precedence for texture and product selection

---

## Performance Considerations

### 1. Product Normalization

All products are normalized once during validation to avoid repeated string operations.

### 2. Scoring Caching

Products are scored once per pass and results are reused (no redundant calculations).

### 3. Database Queries

- Products are fetched once with `.lean()` for performance
- Consultations are indexed on `consultationId`, `email`, and `phone` for fast lookups

### 4. Array Operations

- Uses `Set` for efficient ingredient/allergy checking
- Uses `Map` for efficient category lookups

---

## Future Enhancements

### 1. Machine Learning Integration

- Train ML model on user feedback to improve scoring weights
- Personalized ingredient preferences based on user history

### 2. A/B Testing

- Test different scoring weights and constraint relaxation strategies
- Measure conversion rates and user satisfaction

### 3. Real-Time Product Updates

- Webhook integration for product availability changes
- Automatic re-scoring when new products are added

### 4. Advanced Allergy Detection

- NLP-based ingredient parsing for better allergy matching
- Ingredient synonym detection (e.g., "vitamin-c" = "ascorbic-acid")

### 5. Routine Customization

- Allow users to customize routine steps
- Suggest alternatives for specific products

---

## Conclusion

The skincare consultation engine is a sophisticated system that combines:
- **Priority-based concern weighting** for personalized recommendations
- **Multi-pass constraint relaxation** for robust product matching
- **3-phase product categorization** for gradual routine introduction
- **Sensitivity-safe prioritization** for safe product selection
- **Comprehensive scoring system** that considers 10+ factors

The engine ensures that users receive personalized, safe, and effective skincare recommendations tailored to their unique needs and constraints.

