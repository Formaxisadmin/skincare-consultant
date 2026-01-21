# Ingredient Context Pointers & Data Structures

This file contains all the pointers, dictionaries, mappings, and data structures that provide context for ingredients in the generated report.

---

## 1. Ingredient Dictionary

**File**: `src/data/ingredientDictionary.js`  
**Export**: `ingredientDictionary`  
**Type**: Object  
**Structure**: `{ 'ingredient-key': { name: string, benefit: string } }`

### Complete Dictionary Entries:

```javascript
export const ingredientDictionary = {
  // ACNE & PORES
  'tea-tree-oil': {
    name: 'Tea Tree Oil',
    benefit: 'Natural antimicrobial that targets acne bacteria and calms inflammation.'
  },
  'tea-tree': {
    name: 'Tea Tree',
    benefit: 'Purifies pores and helps control excess oil production.'
  },
  'tea-tree-water-10k-ppm': {
    name: 'Tea Tree Water (10,000ppm)',
    benefit: 'A gentle, high-concentration base that soothes acne-prone skin instantly.'
  },
  'natural-bha': {
    name: 'Natural BHA',
    benefit: 'Derived from natural sources to gently clear pores without harsh irritation.'
  },
  'willow-bark-water': {
    name: 'Willow Bark Water',
    benefit: 'A natural source of BHA that exfoliates and clears congested pores.'
  },
  'zinc-pca': {
    name: 'Zinc PCA',
    benefit: 'Regulates sebum production and inhibits acne-causing bacteria.'
  },
  'pink-salt': {
    name: 'Pink Salt',
    benefit: 'Osmotic action helps clear out impurities from deep within pores.'
  },

  // EXFOLIANTS
  'aha': {
    name: 'AHA (Alpha Hydroxy Acid)',
    benefit: 'Exfoliates the skin surface to reduce dullness and smooth texture.'
  },
  'bha': {
    name: 'BHA (Salicylic Acid)',
    benefit: 'Oil-soluble acid that dives deep into pores to remove blackheads.'
  },
  'pha': {
    name: 'PHA (Polyhydroxy Acid)',
    benefit: 'Next-gen exfoliant that smooths skin without irritating sensitive barriers.'
  },
  'apple-fruit-water': {
    name: 'Apple Fruit Water',
    benefit: 'Natural AHAs gently remove dead skin cells for a brighter complexion.'
  },

  // BRIGHTENING & TONE
  'niacinamide': {
    name: 'Niacinamide',
    benefit: 'The multitasker: controls oil, brightens tone, and strengthens the barrier.'
  },
  'niacinamide-15': {
    name: 'Niacinamide (15%)',
    benefit: 'Clinical-strength concentration for intensive pore tightening and oil control.'
  },
  'niacinamide-2': {
    name: 'Niacinamide (2%)',
    benefit: 'Gentle daily dose to maintain a clear, bright, and balanced complexion.'
  },
  'ascorbic-acid-23': {
    name: 'Pure Vitamin C (23%)',
    benefit: 'High-potency antioxidant that rapidly fades dark spots and boosts radiance.'
  },
  'l-ascorbic-acid-5': {
    name: 'Pure Vitamin C (5%)',
    benefit: 'Gentle yet effective antioxidant protection suitable for daily use.'
  },
  '3-o-ethyl-ascorbic-acid': {
    name: 'Ethyl Ascorbic Acid',
    benefit: 'A highly stable Vitamin C derivative that brightens without oxidation.'
  },
  'alpha-arbutin-2': {
    name: 'Alpha Arbutin (2%)',
    benefit: 'Safe, powerful ingredient that specifically targets hyperpigmentation and scars.'
  },
  'rice-bran-water': {
    name: 'Rice Bran Water',
    benefit: 'Traditional brightening water rich in vitamins for a "glass skin" glow.'
  },
  'rice-bran-water-68': {
    name: 'Rice Bran Water (68%)',
    benefit: 'High-concentration base that deeply hydrates and illuminates dull skin.'
  },
  'rice-extract-30': {
    name: 'Rice Extract (30%)',
    benefit: 'Softens texture and promotes a clear, radiant skin tone.'
  },
  'tranexamic-acid': {
    name: 'Tranexamic Acid',
    benefit: 'Specialist treatment for stubborn discoloration, melasma, and redness.'
  },
  'n-acetylglucosamine-nag': {
    name: 'N-Acetylglucosamine',
    benefit: 'Works synergistically with Niacinamide to fade pigment and hydrate.'
  },

  // SOOTHING & REPAIR
  'snail-secretion-filtrate': {
    name: 'Snail Mucin',
    benefit: 'Famous for repairing damage, fading acne scars, and deep hydration.'
  },
  'snail-mucin': {
    name: 'Snail Mucin',
    benefit: 'Restores skin elasticity and accelerates natural healing processes.'
  },
  'snail-secretion-filtrate-96': {
    name: 'Snail Mucin (96%)',
    benefit: 'Maximum strength repair essence for intense hydration and barrier support.'
  },
  'snail-secretion-filtrate-92': {
    name: 'Snail Mucin (92%)',
    benefit: 'Rich, soothing concentration that locks in moisture and calms irritation.'
  },
  'snail-mucin-3': {
    name: 'Snail Mucin (3%)',
    benefit: 'A supportive dose of repair capability in a lightweight formulation.'
  },
  'centella-asiatica': {
    name: 'Centella Asiatica',
    benefit: 'The gold standard for calming redness, inflammation, and sensitive skin.'
  },
  'centella-asiatica-extract': {
    name: 'Centella Asiatica Extract',
    benefit: 'Concentrated soothing agent that speeds up skin recovery.'
  },
  'cica': {
    name: 'Cica (Centella)',
    benefit: 'Instant relief for irritated or compromised skin barriers.'
  },
  'madecassoside': {
    name: 'Madecassoside',
    benefit: 'The active healing compound in Centella that reduces itching and redness.'
  },
  'mugwort': {
    name: 'Mugwort',
    benefit: 'Targeted relief for sensitive, acne-prone, or inflamed skin.'
  },
  'guaiazulene': {
    name: 'Guaiazulene',
    benefit: 'Extracted from chamomile; creates a blue tint and rapidly cools heat/redness.'
  },
  'allantoin': {
    name: 'Allantoin',
    benefit: 'Skin protectant that prevents irritation and keeps skin soft.'
  },
  'panthenol': {
    name: 'Panthenol (Vit B5)',
    benefit: 'Converts to Vitamin B5 on skin to heal barrier damage and hydrate.'
  },
  'aloe-vera': {
    name: 'Aloe Vera',
    benefit: 'Classic soothing hydration that cools stressed skin instantly.'
  },
  'aloe-arborescens-leaf-extract-55000ppm': {
    name: 'Aloe Leaf Extract (High Dose)',
    benefit: 'Potent concentration for maximum soothing of sun-exposed or sensitive skin.'
  },

  // ANTI-AGING & VITALITY
  'retinal': {
    name: 'Retinal (Retinaldehyde)',
    benefit: 'Works faster than Retinol to smooth wrinkles with less irritation.'
  },
  'ginseng-root-water': {
    name: 'Ginseng Root Water',
    benefit: 'Energizes tired skin and improves circulation for a healthy look.'
  },
  'ginseng-root-water-80': {
    name: 'Ginseng Root Water (80%)',
    benefit: 'Potent antioxidant base that revitalizes aging or fatigued skin.'
  },
  'ginseng-root-water-63': {
    name: 'Ginseng Root Water (63%)',
    benefit: 'Balanced concentration to firm skin and boost elasticity.'
  },
  'peptides': {
    name: 'Peptides',
    benefit: 'Messengers that tell your skin to produce more collagen.'
  },
  'peptide-9-complex': {
    name: '9-Peptide Complex',
    benefit: 'A diverse blend of peptides targeting multiple signs of aging simultaneously.'
  },
  'adenosine': {
    name: 'Adenosine',
    benefit: 'Proven anti-wrinkle ingredient that energizes the skin surface.'
  },
  'tocotrienol-super-vitamin-e': {
    name: 'Super Vitamin E',
    benefit: '50x more potent than standard Vitamin E for superior antioxidant defense.'
  },
  'vitamin-e-tocopherol': {
    name: 'Vitamin E (Tocopherol)',
    benefit: 'Protects skin from free radical damage and nourishes the barrier.'
  },

  // HYDRATION & MOISTURE
  'hyaluronic-acid': {
    name: 'Hyaluronic Acid',
    benefit: 'Holds 1000x its weight in water to plump skin instantly.'
  },
  'sodium-hyaluronate': {
    name: 'Sodium Hyaluronate',
    benefit: 'A form of Hyaluronic Acid that penetrates deeper for lasting hydration.'
  },
  '5-types-of-hyaluronic-acid': {
    name: '5-Type Hyaluronic Complex',
    benefit: 'hydrates different layers of the skin for comprehensive moisture.'
  },
  '7-hyaluronic-acids': {
    name: '7-Type Hyaluronic Complex',
    benefit: 'Multi-depth hydration strategy to prevent dryness from the inside out.'
  },
  '8-types-of-hyaluronic-acid': {
    name: '8-Type Hyaluronic Complex',
    benefit: 'The ultimate hydration spectrum, targeting every layer of the epidermis.'
  },
  'betula-platyphylla-japonica-juice-birch-sap': {
    name: 'Birch Sap',
    benefit: 'Mimics the skin\'s natural moisture factor (NMF) to hydrate without greasiness.'
  },
  'betaine': {
    name: 'Betaine',
    benefit: 'Balances skin hydration levels and prevents moisture loss.'
  },
  'grain-probiotics': {
    name: 'Grain Probiotics',
    benefit: 'Fermented extracts that strengthen the skin microbiome and barrier.'
  },

  // OILS & BARRIER
  'ceramide-3': {
    name: 'Ceramide NP',
    benefit: 'Replenishes the lipid glue between skin cells to seal in moisture.'
  },
  'shea-butter': {
    name: 'Shea Butter',
    benefit: 'Rich emollient that softens rough skin and provides a protective seal.'
  },
  'squalane': {
    name: 'Squalane',
    benefit: 'Biocompatible oil that moisturizes weightlessly without clogging pores.'
  },
  'jojoba-seed-oil': {
    name: 'Jojoba Oil',
    benefit: 'Mimics human sebum to balance oil production while moisturizing.'
  },
  'ginseng-seed-oil': {
    name: 'Ginseng Seed Oil',
    benefit: 'Protects the skin barrier from external aggressors.'
  },
  'soybean-oil': {
    name: 'Soybean Oil',
    benefit: 'Smooths skin texture and provides essential fatty acids.'
  },
  'arginine': {
    name: 'Arginine',
    benefit: 'Amino acid that helps repair visible skin damage.'
  },

  // SUN PROTECTION
  'chemical-uv-filters': {
    name: 'Chemical UV Filters',
    benefit: 'Absorbs UV rays to prevent sun damage with no white cast.'
  },
  'physical-uv-filters': {
    name: 'Physical UV Filters',
    benefit: 'Reflects UV rays from the skin surface; gentle for sensitive skin.'
  },

  // MISC
  'all-natural-ingredients': {
    name: 'All Natural Ingredients',
    benefit: 'Formulated without harsh synthetics for gentle, clean care.'
  }
};
```

---

## 2. Concern-to-Ingredient Mapping

**File**: `src/data/concernMapping.js`  
**Export**: `concernMapping`  
**Type**: Object  
**Structure**: `{ 'concern-key': { keyIngredients: string[], avoidIngredients: string[], ... } }`

### Concern Mappings:

```javascript
const concernMapping = {
  acne: {
    name: 'Acne & Breakouts',
    keyIngredients: [
      'salicylic-acid',
      'benzoyl-peroxide',
      'niacinamide',
      'tea-tree-oil',
      'azelaic-acid',
    ],
    avoidIngredients: ['heavy-oils', 'coconut-oil', 'thick-butters'],
    // ... other properties
  },
  pigmentation: {
    name: 'Pigmentation & Dark Spots',
    keyIngredients: [
      'vitamin-c',
      'niacinamide',
      'alpha-arbutin',
      'kojic-acid',
      'tranexamic-acid',
      'licorice-extract',
    ],
    avoidIngredients: ['harsh-scrubs', 'high-alcohol'],
    // ... other properties
  },
  aging: {
    name: 'Anti-Aging & Fine Lines',
    keyIngredients: [
      'retinol',
      'retinaldehyde',
      'peptides',
      'hyaluronic-acid',
      'vitamin-c',
      'ceramides',
    ],
    avoidIngredients: ['harsh-exfoliants', 'drying-alcohols'],
    // ... other properties
  },
  dryness: {
    name: 'Dryness & Dehydration',
    keyIngredients: [
      'hyaluronic-acid',
      'ceramides',
      'glycerin',
      'squalane',
      'niacinamide',
      'shea-butter',
    ],
    avoidIngredients: ['alcohol', 'harsh-surfactants', 'fragrance'],
    // ... other properties
  },
  oiliness: {
    name: 'Excess Oil & Shine',
    keyIngredients: [
      'niacinamide',
      'salicylic-acid',
      'zinc',
      'clay',
      'tea-tree-oil',
    ],
    avoidIngredients: ['heavy-oils', 'thick-creams', 'coconut-oil'],
    // ... other properties
  },
  dullness: {
    name: 'Dullness & Lack of Radiance',
    keyIngredients: [
      'vitamin-c',
      'niacinamide',
      'aha',
      'glycolic-acid',
      'lactic-acid',
    ],
    avoidIngredients: ['harsh-scrubs', 'high-alcohol'],
    // ... other properties
  },
  redness: {
    name: 'Redness & Sensitivity',
    keyIngredients: [
      'centella',
      'niacinamide',
      'azelaic-acid',
      'ceramides',
      'green-tea',
      'aloe-vera',
    ],
    avoidIngredients: ['fragrance', 'alcohol', 'harsh-acids', 'retinol'],
    // ... other properties
  },
  'dark-circles': {
    name: 'Dark Circles & Under-Eye',
    keyIngredients: [
      'caffeine',
      'vitamin-k',
      'retinol',
      'peptides',
      'hyaluronic-acid',
    ],
    avoidIngredients: ['harsh-acids', 'strong-retinoids'],
    // ... other properties
  },
  'large-pores': {
    name: 'Large Pores',
    keyIngredients: [
      'niacinamide',
      'salicylic-acid',
      'retinol',
      'clay',
    ],
    avoidIngredients: ['heavy-oils', 'thick-butters'],
    // ... other properties
  },
  texture: {
    name: 'Rough Texture',
    keyIngredients: [
      'aha',
      'bha',
      'retinol',
      'niacinamide',
      'glycolic-acid',
    ],
    avoidIngredients: ['harsh-scrubs'],
    // ... other properties
  },
};
```

---

## 3. Priority Modifiers

**File**: `src/data/concernMapping.js`  
**Export**: `concernPriorityModifiers`  
**Type**: Object

```javascript
const concernPriorityModifiers = {
  ageFactors: {
    under18: {
      acne: 1.5,
      oiliness: 1.3,
      aging: 0.3,
      pigmentation: 0.8,
    },
    '18-25': {
      acne: 1.4,
      oiliness: 1.2,
      aging: 0.5,
      pigmentation: 1.0,
    },
    '26-35': {
      acne: 1.0,
      aging: 1.2,
      pigmentation: 1.3,
      dryness: 1.1,
    },
    '36-45': {
      aging: 1.5,
      pigmentation: 1.4,
      dryness: 1.2,
      acne: 0.8,
    },
    '46-55': {
      aging: 1.7,
      dryness: 1.5,
      pigmentation: 1.3,
      acne: 0.5,
    },
    '56+': {
      aging: 1.8,
      dryness: 1.6,
      pigmentation: 1.2,
      acne: 0.3,
    },
  },
  sunExposureFactors: {
    minimal: { pigmentation: 1.0, aging: 1.0 },
    moderate: { pigmentation: 1.3, aging: 1.2 },
    high: { pigmentation: 1.6, aging: 1.4 },
  },
  acneSeverityFactors: {
    mild: 1.0,
    moderate: 1.5,
    severe: 2.0,
  },
};
```

---

## 4. Ingredient Emoji Mapping

**File**: `src/components/ReportViewer.jsx`  
**Function**: `getIngredientEmoji(ingredientKey)`  
**Lines**: 1247-1296

### Emoji Categories:

```javascript
// Soothing & Repair → 🌿
Keywords: centella, cica, madecassoside, mugwort, guaiazulene, allantoin, aloe

// Hydration → 💧
Keywords: hyaluronic, hyaluronate, betaine, birch

// Anti-Aging & Vitamins → ✨
Keywords: retinal, peptide, adenosine, vitamin, ginseng

// Brightening → 🌟
Keywords: vitamin-c, ascorbic, arbutin, tranexamic, rice, niacinamide

// Acne & Exfoliation → 🧪
Keywords: tea-tree, bha, aha, pha, salicylic, zinc

// Barrier & Oils → 🛡️
Keywords: ceramide, squalane, jojoba, shea

// Sun Protection → ☀️
Keywords: uv, sun, spf

// Default → 🌿
```

---

## 5. Function Pointers

### Recommendation Engine Functions:

**File**: `src/lib/recommendationEngine.js`

1. **`getPreferredIngredients()`** (Lines 322-331)
   - Returns: `string[]` - Array of ingredient keys
   - Source: Aggregates `keyIngredients` from all concerns
   - Usage: Used in product scoring to match ingredients

2. **`calculateProductScore(product)`** (Lines 447-1172)
   - Ingredient matching logic: Lines 617-630
   - Awards up to 20 points for ingredient matches
   - Returns: `{ score: number, reasoning: string[] }`

3. **`analyzeConcerns()`** (Lines 264-306)
   - Maps user concerns to `concernMapping` entries
   - Extracts `keyIngredients` for each concern (Line 296)
   - Returns: Array of concern objects with ingredient lists

### Report Viewer Functions:

**File**: `src/components/ReportViewer.jsx`

1. **`extractKeyIngredients()`** (Lines 1207-1235)
   - Returns: `string[]` - Top 5-6 ingredient names (formatted)
   - Source: Product `keyIngredients` arrays
   - Usage: Displayed in report summary

2. **`getKeyActives(product)`** (Lines 1408-1439)
   - Returns: `Array<{ emoji: string, name: string, benefit: string }>`
   - Source: `ingredientDictionary[ingredientKey]` (Line 1415)
   - Usage: Displayed in product cards "The Science" section

3. **`getIngredientEmoji(ingredientKey)`** (Lines 1247-1296)
   - Returns: `string` - Emoji character
   - Source: Keyword matching logic
   - Usage: Assigned to ingredients in `getKeyActives()`

---

## 6. Data Flow Pointers

### Flow 1: User Concern → Preferred Ingredients
```
User selects concerns
  ↓
recommendationEngine.analyzeConcerns()
  ↓ (uses concernMapping)
Concern objects with keyIngredients
  ↓
recommendationEngine.getPreferredIngredients()
  ↓
Array of ingredient keys
```

### Flow 2: Product Scoring → Ingredient Matching
```
Product with keyIngredients
  ↓
recommendationEngine.calculateProductScore()
  ↓ (compares with preferredIngredients)
Ingredient match score (0-20 points)
  ↓
Product recommendation ranking
```

### Flow 3: Report Display → Ingredient Information
```
Recommended products
  ↓
ReportViewer.extractKeyIngredients()
  ↓ (from product.keyIngredients)
Top ingredient names
  ↓
ReportViewer.getKeyActives(product)
  ↓ (looks up in ingredientDictionary)
Ingredient details (name, benefit, emoji)
  ↓
Displayed in report
```

---

## 7. Key Constants & Variables

### Import Statements:

```javascript
// In src/lib/recommendationEngine.js
import { concernMapping, concernPriorityModifiers } from '@/data/concernMapping';

// In src/components/ReportViewer.jsx
import { ingredientDictionary } from '@/data/ingredientDictionary';
```

### Normalization Function:

**File**: `src/lib/recommendationEngine.js`  
**Method**: `normalizeString(str)`  
**Usage**: Normalizes ingredient keys for case-insensitive matching

---

## 8. Product Data Structure

### Product Object (in recommendations):
```javascript
{
  productId: string,
  name: string,
  category: string,
  keyIngredients: string[],  // Array of ingredient keys (e.g., ['niacinamide', 'hyaluronic-acid'])
  concernsAddressed: string[],  // Array of concern keys
  skinTypes: string[],
  sensitivitySafe: boolean,
  fullIngredientList: string[],  // Complete ingredient list for allergy checking
  texture: string,
  // ... other properties
}
```

---

## 9. Ingredient Key Format

- **Format**: kebab-case (lowercase with hyphens)
- **Examples**: 
  - `tea-tree-oil`
  - `hyaluronic-acid`
  - `snail-secretion-filtrate-96`
  - `3-o-ethyl-ascorbic-acid`
- **Normalization**: All matching is case-insensitive via `normalizeString()`

---

## 10. Display Limits

- **Key Ingredients Summary**: Top 5-6 ingredients (line 1234)
- **Key Actives per Product**: Top 3 ingredients (line 1414)
- **Ingredient Match Score**: Maximum 20 points (line 624)

---

## Summary

All ingredient context comes from these core data structures:
1. **`ingredientDictionary`** - Complete ingredient database
2. **`concernMapping`** - Concern-to-ingredient mappings
3. **`concernPriorityModifiers`** - Priority scoring factors
4. Product `keyIngredients` arrays - Stored in product data
5. Function logic in `recommendationEngine.js` and `ReportViewer.jsx` - Processes and displays the data

