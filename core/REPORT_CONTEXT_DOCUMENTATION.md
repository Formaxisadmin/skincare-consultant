# Report Context Documentation

This document maps every piece of information in the generated report to its source files and specific code locations.

## Overview

The generated skincare consultation report gets its ingredient context from multiple data files and logic components. This document tracks where each piece of information comes from.

---

## 1. Ingredient Benefits & Descriptions

### Source File: `src/data/ingredientDictionary.js`
**Lines: 1-281**

This file contains the complete dictionary of ingredients with their names and benefits. Each ingredient entry has:
- `name`: Display name for the ingredient
- `benefit`: Description of what the ingredient does and why it's helpful

**Key Sections:**
- **Lines 2-30**: Acne & Pores ingredients (tea-tree-oil, natural-bha, zinc-pca, etc.)
- **Lines 32-48**: Exfoliants (AHA/BHA/PHA)
- **Lines 50-98**: Brightening & Tone ingredients (niacinamide, vitamin-c variants, rice extracts, etc.)
- **Lines 100-160**: Soothing & Repair ingredients (snail mucin, centella, cica, aloe, etc.)
- **Lines 162-198**: Anti-Aging ingredients (retinal, ginseng, peptides, adenosine, etc.)
- **Lines 200-232**: Hydration ingredients (hyaluronic acid variants, birch sap, etc.)
- **Lines 234-262**: Oils & Barrier ingredients (ceramides, squalane, jojoba oil, etc.)
- **Lines 264-272**: Sun Protection ingredients
- **Lines 274-278**: Miscellaneous natural ingredients

**Usage in Report:**
- Referenced in `src/components/ReportViewer.jsx` at **line 15** (import)
- Used in `getKeyActives()` function at **line 1415** to look up ingredient details

---

## 2. Concern-to-Ingredient Mapping

### Source File: `src/data/concernMapping.js`
**Lines: 1-325**

This file maps skin concerns to their recommended ingredients, required product categories, and preferences.

**Key Structure:**
- **Lines 5-262**: `concernMapping` object containing concern definitions
  - Each concern has:
    - `name`: Display name
    - `description`: What the concern addresses
    - `requiredCategories`: Product categories needed
    - `keyIngredients`: Array of ingredient keys that help with this concern
    - `avoidIngredients`: Ingredients to avoid
    - `productPreferences`: Texture and formulation preferences
    - `routine`: Morning/evening/weekly routine structure

**Specific Concern Mappings:**
- **Lines 6-31**: `acne` concern → keyIngredients include: salicylic-acid, benzoyl-peroxide, niacinamide, tea-tree-oil, azelaic-acid
- **Lines 32-57**: `pigmentation` concern → keyIngredients include: vitamin-c, niacinamide, alpha-arbutin, kojic-acid, tranexamic-acid, licorice-extract
- **Lines 58-83**: `aging` concern → keyIngredients include: retinol, retinaldehyde, peptides, hyaluronic-acid, vitamin-c, ceramides
- **Lines 84-110**: `dryness` concern → keyIngredients include: hyaluronic-acid, ceramides, glycerin, squalane, niacinamide, shea-butter
- **Lines 111-136**: `oiliness` concern → keyIngredients include: niacinamide, salicylic-acid, zinc, clay, tea-tree-oil
- **Lines 137-162**: `dullness` concern → keyIngredients include: vitamin-c, niacinamide, aha, glycolic-acid, lactic-acid
- **Lines 163-189**: `redness` concern → keyIngredients include: centella, niacinamide, azelaic-acid, ceramides, green-tea, aloe-vera
- **Lines 190-210**: `dark-circles` concern → keyIngredients include: caffeine, vitamin-k, retinol, peptides, hyaluronic-acid
- **Lines 211-235**: `large-pores` concern → keyIngredients include: niacinamide, salicylic-acid, retinol, clay
- **Lines 236-261**: `texture` concern → keyIngredients include: aha, bha, retinol, niacinamide, glycolic-acid

**Priority Scoring:**
- **Lines 265-314**: `concernPriorityModifiers` object
  - `ageFactors`: Age-based priority adjustments (lines 267-302)
  - `sunExposureFactors`: Sun exposure impact on concerns (lines 304-308)
  - `acneSeverityFactors`: Acne severity multipliers (lines 309-313)

**Usage in Report:**
- Imported in `src/lib/recommendationEngine.js` at **line 2**
- Used in `analyzeConcerns()` method at **line 269** to map user concerns to ingredient requirements
- Used in `getPreferredIngredients()` method at **line 327** to extract ingredient list from concerns

---

## 3. Ingredient Selection Logic

### Source File: `src/lib/recommendationEngine.js`

#### Preferred Ingredients Extraction
**Lines: 322-331**

The `getPreferredIngredients()` method:
- Iterates through all identified concerns (line 326)
- Collects `keyIngredients` from each concern (line 327)
- Returns a deduplicated array of preferred ingredients (line 330)

**Context Flow:**
1. User selects concerns → stored in `this.responses.primaryConcerns`
2. `analyzeConcerns()` maps concerns to `concernMapping` entries (line 269)
3. Each concern object includes `keyIngredients` from `concernMapping` (line 296)
4. `getPreferredIngredients()` aggregates all ingredient keys (line 323-331)

#### Ingredient Matching in Product Scoring
**Lines: 617-630**

The ingredient matching logic:
- Normalizes preferred ingredients (line 618)
- Normalizes product ingredients (line 619)
- Finds matches between user preferences and product ingredients (lines 620-621)
- Awards up to 20 points for ingredient matches (line 624)
- Formats ingredient names for display (lines 626-628)
- Adds reasoning text about matched ingredients (line 629)

**Key Code:**
```javascript
// Line 618: Get preferred ingredients from concerns
const preferredIngredients = this.getPreferredIngredients().map(ing => this.normalizeString(ing));

// Line 619: Normalize product ingredients
const normalizedProductIngredients = product.keyIngredients.map(ing => this.normalizeString(ing));

// Lines 620-621: Find matches
const ingredientMatches = normalizedProductIngredients.filter((ing) => 
  preferredIngredients.includes(ing)
);

// Line 624: Score based on match ratio
score += Math.min((ingredientMatches.length / preferredIngredients.length) * 20, 20);
```

---

## 4. Report Display Logic

### Source File: `src/components/ReportViewer.jsx`

#### Ingredient Dictionary Import
**Line 15**
```javascript
import { ingredientDictionary } from '@/data/ingredientDictionary';
```

#### Key Ingredients Extraction
**Lines: 1207-1235**

The `extractKeyIngredients()` function:
- Collects ingredients from all recommended products (lines 1209-1211)
- Extracts `keyIngredients` from each product (lines 1216-1224)
- Formats ingredient names (capitalize, remove hyphens) (lines 1219-1222)
- Adds SPF as ingredient if product is sunscreen (lines 1228-1230)
- Returns top 5-6 most relevant ingredients (line 1234)

**Usage:**
- Called at **line 1241** to generate `keyIngredients` array for display

#### Ingredient Emoji Mapping
**Lines: 1247-1296**

The `getIngredientEmoji()` function categorizes ingredients and assigns emojis:
- **Lines 1254-1257**: Soothing & Repair → 🌿 (centella, cica, madecassoside, mugwort, guaiazulene, allantoin, aloe)
- **Lines 1261-1263**: Hydration → 💧 (hyaluronic, hyaluronate, betaine, birch)
- **Lines 1267-1269**: Anti-Aging & Vitamins → ✨ (retinal, peptide, adenosine, vitamin, ginseng)
- **Lines 1273-1275**: Brightening → 🌟 (vitamin-c, ascorbic, arbutin, tranexamic, rice, niacinamide)
- **Lines 1279-1281**: Acne & Exfoliation → 🧪 (tea-tree, bha, aha, pha, salicylic, zinc)
- **Lines 1285-1287**: Barrier & Oils → 🛡️ (ceramide, squalane, jojoba, shea)
- **Lines 1291-1292**: Sun Protection → ☀️ (uv, sun, spf)

**Usage:**
- Called in `getKeyActives()` at **line 1416** to assign emoji to each ingredient

#### Key Actives Display
**Lines: 1408-1439**

The `getKeyActives()` function displays ingredient information in product cards:
- Takes product's `keyIngredients` array (line 1410)
- Limits to top 3 ingredients (line 1414)
- Looks up ingredient in `ingredientDictionary` (line 1415)
- Gets emoji from `getIngredientEmoji()` (line 1416)
- Returns object with `emoji`, `name`, and `benefit` (lines 1419-1423)
- Falls back to formatted name if ingredient not in dictionary (lines 1426-1435)

**Key Code:**
```javascript
// Line 1415: Lookup ingredient details from dictionary
const details = ingredientDictionary[ingredientKey];

// Lines 1418-1423: Return formatted ingredient info
if (details) {
  return {
    emoji,
    name: details.name,
    benefit: details.benefit
  };
}
```

**Usage:**
- Called when displaying product cards to show "The Science (How it Works)" section
- Referenced in "Why?" dialog at **line 1835**

---

## 5. Data Flow Summary

### Complete Flow from User Input to Report Display:

1. **User Input** → User selects skin concerns in questionnaire
   - Stored in: `responses.primaryConcerns`

2. **Concern Analysis** → `recommendationEngine.analyzeConcerns()`
   - **File**: `src/lib/recommendationEngine.js`
   - **Lines**: 264-306
   - Maps concerns to `concernMapping` entries
   - Extracts `keyIngredients` from each concern mapping

3. **Ingredient Preference Extraction** → `recommendationEngine.getPreferredIngredients()`
   - **File**: `src/lib/recommendationEngine.js`
   - **Lines**: 322-331
   - Aggregates all `keyIngredients` from identified concerns

4. **Product Scoring** → `recommendationEngine.calculateProductScore()`
   - **File**: `src/lib/recommendationEngine.js`
   - **Lines**: 617-630
   - Matches product ingredients against preferred ingredients
   - Awards points for ingredient matches

5. **Report Generation** → Products recommended based on scores

6. **Report Display** → `ReportViewer` component
   - **File**: `src/components/ReportViewer.jsx`
   - **Lines**: 1207-1439
   - Extracts key ingredients from recommended products
   - Looks up ingredient details in `ingredientDictionary`
   - Displays ingredient name, emoji, and benefit

---

## 6. Key Data Structures

### ingredientDictionary Structure
```javascript
{
  'ingredient-key': {
    name: 'Display Name',
    benefit: 'Description of what it does and why it helps'
  }
}
```

### concernMapping Structure
```javascript
{
  'concern-key': {
    name: 'Display Name',
    description: 'What it addresses',
    keyIngredients: ['ingredient-key-1', 'ingredient-key-2', ...],
    avoidIngredients: ['ingredient-to-avoid-1', ...],
    // ... other properties
  }
}
```

### Product Structure (in recommendations)
```javascript
{
  productId: '...',
  name: '...',
  keyIngredients: ['ingredient-key-1', 'ingredient-key-2', ...],
  concernsAddressed: ['concern-1', 'concern-2', ...],
  // ... other properties
}
```

---

## 7. Context Locations by Report Section

### "Key Ingredients" Section
- **Source**: `src/components/ReportViewer.jsx`
- **Function**: `extractKeyIngredients()` (lines 1207-1235)
- **Data**: Product `keyIngredients` arrays from recommendations

### "The Science (How it Works)" Section (per product)
- **Source**: `src/components/ReportViewer.jsx`
- **Function**: `getKeyActives()` (lines 1408-1439)
- **Data Lookup**: 
  - `ingredientDictionary[ingredientKey]` (line 1415)
  - `getIngredientEmoji(ingredientKey)` (line 1416)

### "Why You?" Section (product matching explanation)
- **Source**: `src/components/ReportViewer.jsx`
- **Function**: `getMatchExplanation()` (lines 1298-1406)
- **Context**: Uses `concernMapping` data indirectly through product `concernsAddressed` field

### Strategy Section (concern priorities)
- **Source**: `src/components/ReportViewer.jsx`
- **Function**: `generateStrategy()` (lines 1084-1168)
- **Data**: Concern priority scores from `analyzeConcerns()` which uses `concernPriorityModifiers` from `concernMapping.js`

---

## 8. Important Notes

1. **Ingredient Keys**: All ingredient keys use kebab-case (e.g., `tea-tree-oil`, `hyaluronic-acid`)
2. **Normalization**: Ingredient matching uses case-insensitive normalization via `normalizeString()` method
3. **Fallback**: If an ingredient key is not found in `ingredientDictionary`, the system formats the key name and uses a generic benefit message
4. **Priority**: Ingredients are prioritized based on concern priority scores, which are calculated using age, sun exposure, and severity factors
5. **Display Limit**: Only top 3 ingredients per product are shown in the "Key Actives" section
6. **Emoji Assignment**: Emojis are assigned based on ingredient category keywords, not exact matches

---

## Summary

The report's ingredient context comes from:
1. **`src/data/ingredientDictionary.js`** - Complete ingredient database with names and benefits
2. **`src/data/concernMapping.js`** - Maps concerns to recommended ingredients
3. **`src/lib/recommendationEngine.js`** - Logic that selects ingredients based on user concerns
4. **`src/components/ReportViewer.jsx`** - Display logic that shows ingredient information in the report

All ingredient information flows from these four core files through the analysis and recommendation pipeline to the final report display.

