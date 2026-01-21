# Database Schema Documentation
## Complete Product Schema for Skincare Recommendation Engine

This document defines the complete database schema, validation rules, Excel/CSV mapping, and all requirements for products in the MongoDB database.

**Last Updated**: November 2025

---

## 📋 PRODUCT SCHEMA

### Required Fields (Must Have)

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `productId` | String | ✅ Yes | Unique product identifier | Must be unique, alphanumeric with hyphens/underscores |
| `name` | String | ✅ Yes | Product name | Cannot be empty |
| `category` | String | ✅ Yes | Product category | Must be one of: `cleanser`, `toner`, `serum`, `moisturizer`, `spf`, `mask`, `eye_cream`, `treatment` |
| `inStock` | Boolean | ✅ Yes | Product availability | Must be `true` or `false` (default: `true`) |
| `skinTypes` | Array[String] | ✅ Yes | Compatible skin types | Must be array, values: `oily`, `dry`, `combination`, `normal`, `sensitive`, or empty array for "all" |
| `concernsAddressed` | Array[String] | ✅ Yes | Skin concerns this product addresses | Must be array, values must match concernMapping.js keys |
| `sensitivitySafe` | Boolean | ✅ Yes | Safe for sensitive skin | Must be `true` or `false` |
| `keyIngredients` | Array[String] | ✅ Yes | Key active ingredients | Must be array, normalized format: lowercase, hyphens for spaces |
| `usage` | String | ✅ Yes | When to use | Must be one of: `morning`, `evening`, `both` (default: `both`) |

### Core Product Information (Optional)

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `brand` | String | ❌ No | Brand name | Recommended but optional |
| `subCategory` | String | ❌ No | Product subcategory | e.g., "gel", "foaming", "cream", "eye-serum", "eye-cream" |
| `mrp` | Number | ❌ No | Manufacturer's suggested retail price | Should be positive number |
| `weight` | String | ❌ No | Product weight/volume | e.g., "100ml", "50g" |
| `description` | String | ❌ No | Product description | Plain text |
| `benefits` | String | ❌ No | Key benefits | Plain text |
| `instructions` | String | ❌ No | Usage instructions | Plain text |
| `rating` | Number | ❌ No | Product rating | Should be 0-5 (will be used in scoring) |
| `imageUrl` | String | ❌ No | Product image URL | Valid URL format |
| `productUrl` | String | ❌ No | Product page URL | Valid URL format |
| `cheapestStoreLink` | String | ❌ No | Link to cheapest store | Valid URL format |

### Recommendation Engine Fields (Optional but Important)

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `fullIngredientList` | Array[String] | ❌ No | Complete ingredient list | Must be array, normalized format. **⭐ CRITICAL for allergy checking** |
| `gender` | String | ❌ No | Gender targeting | Must be one of: `male`, `female`, `neutral` (default: `neutral`). ⚠️ **NOT used in scoring** - kept for backward compatibility only |
| `texture` | String | ❌ No | Product texture | Must be one of: `gel`, `lightweight`, `gel-cream`, `cream`, `rich-cream`, `balm` |
| `climateSuitability` | Array[String] | ❌ No | Suitable climates | Must be array, values: `hot-humid`, `cold-dry`, `temperate`, `tropical` |
| `preferences` | Array[String] | ❌ No | Product preferences | Must be array, 40+ valid values (see Preferences section) |
| `frequency` | String | ❌ No | Recommended frequency | Core: `daily`, `weekly`, `alternate`. Extended: `as-needed`, `nightly`, `1-2-times-a-week`, `2-3-times-a-week`, `3-4-times-a-week`, `reapply-as-needed` (default: `daily`) |

### Shopify Integration Fields (Optional)

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `shopifyProductId` | String | ❌ No | Shopify product ID | Should be valid Shopify product ID |
| `shopifyVariantId` | String | ❌ No | Shopify variant ID | Should be valid Shopify variant ID (legacy, prefer productId) |

---

## 🔍 FIELD VALIDATION RULES

### Category Field
- **MUST** be lowercase in database
- **MUST** be one of: `cleanser`, `toner`, `serum`, `moisturizer`, `spf`, `mask`, `eye_cream`, `treatment`
- **NOTE**: Use `eye_cream` (with underscore) to match database schema
- **DO NOT** use `eye-cream` (with hyphen) - this will cause mismatches
- **Excel Format**: Uppercase (e.g., `CLEANSERS`, `EYE CARE`) - automatically converted during upload

### Subcategory Field
- **Purpose**: Used for subcategory-aware matching in recommendation engine
- **For Eye Care Products**:
  - Use `eye-serum` or `eye-essence` for lighter, serum-type eye products
  - Use `eye-cream` for heavier, cream-type eye products
  - Use `eye-mask` for eye masks
- **How It Works**: 
  - Users with lighter texture preferences (gel, lightweight) get bonus for `eye-serum` subcategory
  - Users with heavier texture preferences (cream, rich-cream) get bonus for `eye-cream` subcategory
  - Products with texture/subcategory mismatch get small penalty
- **Recommendation**: Always include subcategory for eye care products to ensure accurate recommendations

### Skin Types Array
- **MUST** be an array (even if empty)
- **VALID VALUES**: `oily`, `dry`, `combination`, `normal`, `sensitive`
- **EMPTY ARRAY**: Treated as "suitable for all skin types"
- **CASE**: Must be lowercase
- **FORMAT**: Comma-separated in CSV, e.g., `oily,dry,combination`

### Concerns Addressed Array
- **MUST** be an array (even if empty)
- **CORE VALUES** (used by recommendation engine): Must match keys in `concernMapping.js`:
  - `acne`, `pigmentation`, `aging`, `dryness`, `oiliness`, `dullness`, `redness`, `dark-circles`, `large-pores`, `texture`
- **EXTENDED VALUES** (automatically mapped to core concerns during upload):
  - **Acne variations**: `blackheads`, `whiteheads`, `pimples`, `blemishes`, `mild-acne`, `acne-prone`, `breakouts` → Maps to `acne`
  - **Pigmentation variations**: `hyperpigmentation`, `acne-scars`, `dark-spots`, `uneven-tone`, `uneven-skin-tone`, `scars` → Maps to `pigmentation`
  - **Aging variations**: `fine-lines`, `wrinkles`, `anti-aging`, `loss-of-elasticity`, `loss-of-firmness`, `elasticity` → Maps to `aging`
  - **Dryness variations**: `dehydration`, `compromised-barrier`, `barrier-repair`, `barrier-support`, `flakiness`, `chapped-lips` → Maps to `dryness`
  - **Oiliness variations**: `sebum-control`, `excess-sebum`, `oil-control` → Maps to `oiliness`
  - **Dullness variations**: `loss-of-glow` → Maps to `dullness`
  - **Redness variations**: `sensitivity`, `irritation` → Maps to `redness`
  - **Dark circles variations**: `puffiness` → Maps to `dark-circles`
  - **Pore variations**: `pores`, `pore-care`, `pore-cleansing`, `enlarged-pores` → Maps to `large-pores`
  - **Texture variations**: `uneven-texture`, `rough-texture`, `gentle-exfoliation`, `mild-exfoliation` → Maps to `texture`
- **MAPPING**: Extended concerns are automatically mapped to core concerns during upload
- **CASE**: Must be lowercase
- **FORMAT**: Comma-separated in CSV, e.g., `acne,blackheads,oiliness` or `sensitivity,irritation,redness`
- **STORAGE**: Only core concerns are stored in the database after mapping

### Key Ingredients Array
- **MUST** be an array (even if empty)
- **NORMALIZATION RULES**:
  - All lowercase
  - Spaces replaced with hyphens
  - Examples: `vitamin-c`, `niacinamide`, `hyaluronic-acid`, `salicylic-acid`
- **FORMAT**: Comma-separated in CSV, e.g., `vitamin-c,niacinamide,hyaluronic-acid`
- **CRITICAL**: Must match ingredient names in `concernMapping.js`

### Full Ingredient List Array ⭐ CRITICAL
- **OPTIONAL** but **HIGHLY RECOMMENDED** for allergy checking
- **NORMALIZATION RULES**: Same as keyIngredients (lowercase, hyphens)
- **FORMAT**: Comma-separated in CSV
- **USE CASE**: Used to check for hard constraints (allergies)
- **What to Include**:
  - **All ingredients** in the product (complete ingredient list)
  - **Common allergens**: nuts, soy, wheat, dairy, fragrance, parabens, sulfates, alcohol
  - **Active ingredients**: retinol, vitamin-c, niacinamide, salicylic-acid, etc.
  - **Preservatives**: parabens, phenoxyethanol, etc.
  - **Fragrances**: fragrance, parfum, essential oils
- **Priority**: **HIGH** - Critical for allergy checking
- **Ingredient Matching Logic**:
  1. **Primary Check**: `fullIngredientList` (if available and not empty)
  2. **Fallback**: `keyIngredients` (if `fullIngredientList` is empty)
  3. **Matching Method**: Exact match (case-insensitive) or partial match (contains the allergy term)

### SENSITIVITYSAFE Field
- **Format**: `true` or `false` (case-insensitive)
- **Required**: Yes (must be provided)
- **Valid Values**: `true`, `false`, `TRUE`, `FALSE`, `1`, `0`, `yes`, `no`
- **Default**: `false` if not provided
- **Purpose**: Indicates if product is safe for sensitive skin (free from common irritants)
- **How It Works in Scoring**:
  - Users with sensitive skin (`very` or `somewhat` sensitive) get +10 points if product is `sensitivitySafe = true`
  - Users with sensitive skin get -15 penalty if product is `sensitivitySafe = false`
- **Note**: This is independent from `SKINTYPES`. A product can be suitable for `sensitive` skin type but still have `sensitivitySafe = false` if it contains potential irritants
- **Recommendation**: Manually set this based on product formulation:
  - ✅ `true` for products free from common irritants (fragrance, alcohol, harsh acids, etc.)
  - ❌ `false` for products that may contain irritants even if suitable for sensitive skin types

### Gender Field ⚠️ IMPORTANT NOTE
- **VALID VALUES**: `male`, `female`, `neutral`
- **DEFAULT**: `neutral` (if not specified)
- **CASE**: Must be lowercase
- **RECOMMENDATION**: Most products should be `neutral`
- **⚠️ STATUS**: **REMOVED FROM SCORING** - Gender scoring was removed and replaced with scent preference matching
- **Purpose**: Kept in schema for backward compatibility only, NOT used in recommendation scoring
- **Note**: The recommendation engine now uses `scentPreference` instead of gender for scoring

### Texture Field
- **VALID VALUES**: `gel`, `lightweight`, `gel-cream`, `cream`, `rich-cream`, `balm`
- **CASE**: Must be lowercase
- **USE CASE**: Used for age-based texture preferences

### Climate Suitability Array
- **VALID VALUES**: `hot-humid`, `cold-dry`, `temperate`, `tropical`
- **SPECIAL VALUE**: `all` (automatically converted to empty array, meaning "suitable for all climates")
- **EMPTY ARRAY**: Treated as "suitable for all climates"
- **CASE**: Must be lowercase
- **FORMAT**: Comma-separated in CSV, e.g., `hot-humid,tropical` or `all` (will become empty)
- **Purpose**: Used for climate suitability scoring (+5 points for match)

### Preferences Array
- **VALID VALUES**: 
  - **Core**: `vegan`, `cruelty-free`, `fragrance-free`, `natural`, `organic`
  - **Product Characteristics**: `low-ph`, `mild-formula`, `paraben-free`, `high-strength-active`, `oil-free`, `non-comedogenic`, `no-white-cast`, `matte-finish`, `ph-balanced`, `hypoallergenic`, `clean-formula`, `long-lasting`, `non-sticky`
  - **Product Benefits**: `soothing`, `nourishing`, `moisturizing`, `refreshing`, `cooling`, `brightening`, `anti-aging`, `gentle-exfoliation`, `intensive-moisture`
  - **Usage Characteristics**: `beginner-friendly`, `daily-use`, `multi-use`, `multi-tasking`
  - **Special Categories**: `hanbang`, `cult-favourite`, `vegan-friendly`, `pore-care`, `oil-control`, `lightweight`, `essence-like`
  - **⭐ Scent Tags (for Fragrance Preference Matching)**: `fragrance-free`, `unscented`, `no-fragrance`, `citrus`, `lemon`, `orange`, `grapefruit`, `floral`, `rose`, `lavender`, `jasmine`, `woody`, `spicy`, `sandalwood`, `cedar`, `fresh`, `clean`, `mint`, `eucalyptus`
- **CASE**: Must be lowercase
- **FORMAT**: Comma-separated in CSV, e.g., `vegan,cruelty-free,low-ph` or `fragrance-free,citrus,fresh`
- **Purpose**: Used for soft constraints (penalty/bonus system: +5 per match, -10 per mismatch)
- **⭐ Fragrance Preference Matching**: 
  - Products with scent-related tags in `preferences` get matched to user's scent preference from questionnaire
  - **Scoring**: +3 points (capped) when product matches user's preferred scent profile
  - **Scent Tag Mapping**:
    - User selects "Unscented" → Matches products with: `fragrance-free`, `unscented`, `no-fragrance`
    - User selects "Citrus" → Matches products with: `citrus`, `lemon`, `orange`, `grapefruit`
    - User selects "Floral" → Matches products with: `floral`, `rose`, `lavender`, `jasmine`
    - User selects "Woody/Spicy" → Matches products with: `woody`, `spicy`, `sandalwood`, `cedar`
    - User selects "Fresh" → Matches products with: `fresh`, `clean`, `mint`, `eucalyptus`
  - **Multiple Preferences**: If user selects multiple scent preferences, scoring is adjusted (reduced weightage per match, capped at 3 points total)
  - **Contradiction Handling**: If user selects both "Unscented" and scented options, "Unscented" is prioritized (more restrictive)
  - **No Preference**: If user selects "No preference", no scent scoring is applied (any scent is fine)

### Usage Field
- **VALID VALUES**: `morning`, `evening`, `both`
- **CASE**: Must be lowercase
- **DEFAULT**: `both` (if not specified)
- **CRITICAL**: Used to filter products for morning/evening routines
- **Mapping**: AM → morning, PM → evening, AM-or-PM → both

### Frequency Field
- **VALID VALUES**: 
  - **Core**: `daily`, `weekly`, `alternate`
  - **Extended**: `as-needed`, `nightly`, `1-2-times-a-week`, `2-3-times-a-week`, `3-4-times-a-week`, `reapply-as-needed`
- **MAPPING**: 
  - `daily (or as tolerated)` → `daily`
  - `daily (PM)` → `daily`
  - `reapply-as-needed` → `as-needed`
- **CASE**: Must be lowercase
- **DEFAULT**: `daily` (if not specified)
- **⚠️ NOTE**: Schema enum may need update to include extended values

### Boolean Fields
- **VALID VALUES**: `true`, `false`, `TRUE`, `FALSE`, `1`, `0`, `yes`, `no`
- **NORMALIZATION**: All converted to boolean in upload script
- **FIELDS**: `inStock`, `sensitivitySafe`

### Number Fields
- **VALID VALUES**: Positive numbers (integers or decimals)
- **FIELDS**: `mrp`, `rating`
- **RATING**: Should be 0-5 (decimal allowed, e.g., 4.5)
- **MRP**: Supports INR format (₹ symbol, commas) - normalized during upload

---

## 📊 EXCEL/CSV COLUMN MAPPING

### Excel Column Names (Uppercase with underscores)

The Excel file should have these exact column names:

| Excel Column | Database Field | Type | Required | Notes |
|--------------|---------------|------|----------|-------|
| `PRODUCTID` | `productId` | String | ✅ Yes | Unique identifier |
| `NAME` | `name` | String | ✅ Yes | Product name |
| `BRAND` | `brand` | String | ❌ No | Brand name |
| `CATEGORY` | `category` | String | ✅ Yes | See CATEGORY_MAP below |
| `SUBCATEGORY` | `subCategory` | String | ❌ No | Subcategory |
| `MRP` | `mrp` | Number | ❌ No | MRP |
| `WEIGHT` | `weight` | String | ❌ No | Weight/volume |
| `SKINTYPES` | `skinTypes` | Array | ✅ Yes | Comma-separated |
| `CONCERNSADDRESSED` | `concernsAddressed` | Array | ✅ Yes | Comma-separated |
| `SENSITIVITYSAFE` | `sensitivitySafe` | Boolean | ✅ Yes | true/false |
| `KEYINGREDIENTS` | `keyIngredients` | Array | ✅ Yes | Comma-separated, normalized |
| `FULLINGREDIENTLIST` | `fullIngredientList` | Array | ❌ No | Comma-separated, normalized ⭐ **CRITICAL** |
| `GENDER` | `gender` | String | ❌ No | male/female/neutral (⚠️ not used in scoring) |
| `TEXTURE` | `texture` | String | ❌ No | gel/lightweight/gel-cream/cream/rich-cream/balm |
| `CLIMATESUITABILITY` | `climateSuitability` | Array | ❌ No | Comma-separated |
| `PREFERENCES` | `preferences` | Array | ❌ No | Comma-separated |
| `USAGE` | `usage` | String | ✅ Yes | morning/evening/both |
| `FREQUENCY` | `frequency` | String | ❌ No | daily/weekly/alternate (or extended values) |
| `DESCRIPTION` | `description` | String | ❌ No | Description |
| `BENEFITS` | `benefits` | String | ❌ No | Benefits |
| `INSTRUCTIONS` | `instructions` | String | ❌ No | Instructions |
| `RATING` | `rating` | Number | ❌ No | 0-5 |
| `IMAGEURL` | `imageUrl` | String | ❌ No | Image URL |
| `PRODUCTURL` | `productUrl` | String | ❌ No | Product URL |
| `CHEAPESTSTORELINK` | `cheapestStoreLink` | String | ❌ No | Store link |
| `INSTOCK` | `inStock` | Boolean | ✅ Yes | true/false |
| `SHOPIFYPRODUCTID` | `shopifyProductId` | String | ❌ No | Shopify product ID |
| `SHOPIFYVARIANTID` | `shopifyVariantId` | String | ❌ No | Shopify variant ID |

### Category Mapping (Excel → Database)

| Excel Category | Database Category |
|----------------|-------------------|
| `CLEANSERS` | `cleanser` |
| `TONERS` | `toner` |
| `SERUMS & AMPOULES` | `serum` |
| `MOISTURIZERS` | `moisturizer` |
| `SUNSCREENS` | `spf` |
| `MASKS & PEELS` | `mask` |
| `EYE CARE` | `eye_cream` ⚠️ **Important: Use "EYE CARE" not "EYE-CARE"** |
| `TREATMENTS` | `treatment` |
| `OTHER` | `other` |

---

## 🚨 CRITICAL REQUIREMENTS FOR ALLERGY CHECKING

### FULLINGREDIENTLIST - CRITICAL FOR ALLERGIES

- **Why It's Important**:
  - Hard constraints (allergies) check against `fullIngredientList` first
  - If `fullIngredientList` is empty, it falls back to `keyIngredients`
  - **Recommendation**: Always populate `fullIngredientList` for accurate allergy checking

### Allergy Ingredient Mapping

The following allergen names are used in the questionnaire. Make sure your `fullIngredientList` uses these normalized names or variations:

**Food Allergens**:
- `nuts` - Matches: almond, walnut, cashew, etc.
- `soy` - Matches: soy, soybean, soya
- `wheat` - Matches: wheat, gluten
- `dairy` - Matches: dairy, milk, lactose

**Skincare Ingredients**:
- `fragrance` - Matches: fragrance, parfum, essential-oils
- `parabens` - Matches: parabens, methylparaben, propylparaben
- `sulfates` - Matches: sulfates, sls, sles, sodium-lauryl-sulfate
- `alcohol` - Matches: alcohol, ethanol, denatured-alcohol
- `retinol` - Matches: retinol, retinaldehyde, retinoids
- `vitamin-c` - Matches: vitamin-c, ascorbic-acid, ascorbyl
- `niacinamide` - Matches: niacinamide, nicotinamide
- `salicylic-acid` - Matches: salicylic-acid, bha, beta-hydroxy-acid
- `glycolic-acid` - Matches: glycolic-acid, aha, alpha-hydroxy-acid
- `lactic-acid` - Matches: lactic-acid
- `benzoyl-peroxide` - Matches: benzoyl-peroxide
- `hydroquinone` - Matches: hydroquinone

---

## ✅ DATA QUALITY CHECKLIST

Before uploading to database, ensure:

- [ ] All `productId` values are unique
- [ ] All `category` values are valid (see Category Field validation)
- [ ] All `skinTypes` arrays contain valid values or are empty
- [ ] All `concernsAddressed` arrays contain valid concern names
- [ ] All `keyIngredients` are normalized (lowercase, hyphens)
- [ ] All `fullIngredientList` items are normalized (if provided)
- [ ] All `gender` values are valid (`male`, `female`, `neutral`)
- [ ] All `texture` values are valid (if provided)
- [ ] All `usage` values are valid (`morning`, `evening`, `both`)
- [ ] All `frequency` values are valid (core or extended values)
- [ ] All boolean fields (`inStock`, `sensitivitySafe`) are `true` or `false`
- [ ] All number fields (`mrp`, `rating`) are positive numbers
- [ ] At least one product exists for each required category (especially `spf`)
- [ ] All products have `inStock: true` to be recommended
- [ ] All array fields are comma-separated in CSV (will be converted to arrays)
- [ ] No empty strings in array fields (use empty value or omit field)
- [ ] All URLs are valid format (if provided)
- [ ] Subcategory included for eye care products (recommended)

---

## 🔧 COMMON MISTAKES TO AVOID

1. **Category Mismatch**: Using `eye-cream` instead of `eye_cream` (with underscore) in database, or `EYE-CARE` instead of `EYE CARE` in Excel
2. **Case Sensitivity**: Using uppercase in `skinTypes`, `concernsAddressed`, `keyIngredients`
3. **Ingredient Format**: Using spaces instead of hyphens (e.g., `Vitamin C` instead of `vitamin-c`)
4. **Empty Arrays**: Using empty string `""` instead of leaving field empty for arrays
5. **Boolean Values**: Using `Yes/No` instead of `true/false`
6. **Missing Required Fields**: Not providing `productId`, `name`, `category`, `inStock`
7. **Invalid Enum Values**: Using values not in the allowed enum lists
8. **Duplicate Product IDs**: Having multiple products with same `productId`
9. **Leaving FULLINGREDIENTLIST empty**: Falls back to keyIngredients, less accurate for allergies
10. **Using invalid preference values**: Will not match in preference scoring

---

## 📝 EXAMPLE PRODUCT ENTRY

### Excel Row:
```
PRODUCTID: CLN001
NAME: Gentle Foaming Cleanser
BRAND: Some Brand
CATEGORY: CLEANSERS
SUBCATEGORY: foaming
PRICE: 25.99
MRP: 35.99
WEIGHT: 150ml
SKINTYPES: oily,combination,normal
CONCERNSADDRESSED: acne,oiliness
SENSITIVITYSAFE: true
KEYINGREDIENTS: salicylic-acid,niacinamide,tea-tree-oil
FULLINGREDIENTLIST: water,salicylic-acid,niacinamide,tea-tree-oil,glycerin,sodium-lauryl-sulfate
GENDER: neutral
TEXTURE: gel
CLIMATESUITABILITY: hot-humid,tropical
PREFERENCES: fragrance-free,cruelty-free
USAGE: both
FREQUENCY: daily
DESCRIPTION: A gentle foaming cleanser for oily and acne-prone skin
BENEFITS: Cleanses without stripping, controls oil, reduces breakouts
INSTRUCTIONS: Apply to wet face, massage gently, rinse thoroughly
RATING: 4.5
IMAGEURL: https://example.com/image.jpg
PRODUCTURL: https://example.com/product
CHEAPESTSTORELINK: https://store.com/product
INSTOCK: true
SHOPIFYPRODUCTID: 1234567890
SHOPIFYVARIANTID: 9876543210
```

### MongoDB Document (after upload):
```json
{
  "productId": "CLN001",
  "name": "Gentle Foaming Cleanser",
  "brand": "Some Brand",
  "category": "cleanser",
  "subCategory": "foaming",
  "mrp": 25.99,
  "mrp": 35.99,
  "weight": "150ml",
  "skinTypes": ["oily", "combination", "normal"],
  "concernsAddressed": ["acne", "oiliness"],
  "sensitivitySafe": true,
  "keyIngredients": ["salicylic-acid", "niacinamide", "tea-tree-oil"],
  "fullIngredientList": ["water", "salicylic-acid", "niacinamide", "tea-tree-oil", "glycerin", "sodium-lauryl-sulfate"],
  "gender": "neutral",
  "texture": "gel",
  "climateSuitability": ["hot-humid", "tropical"],
  "preferences": ["fragrance-free", "cruelty-free"],
  "usage": "both",
  "frequency": "daily",
  "description": "A gentle foaming cleanser for oily and acne-prone skin",
  "benefits": "Cleanses without stripping, controls oil, reduces breakouts",
  "instructions": "Apply to wet face, massage gently, rinse thoroughly",
  "rating": 4.5,
  "imageUrl": "https://example.com/image.jpg",
  "productUrl": "https://example.com/product",
  "cheapestStoreLink": "https://store.com/product",
  "inStock": true,
  "shopifyProductId": "1234567890",
  "shopifyVariantId": "9876543210"
}
```

---

## 🔄 WHAT NEEDS TO MATCH BETWEEN APP AND DATABASE

### 1. Category Names
- **Excel**: `EYE CARE` (uppercase, with space)
- **Database**: `eye_cream` (lowercase, with underscore)
- **Mapping**: Upload script automatically converts `EYE CARE` → `eye_cream`
- **Code**: Uses `eye_cream` (with underscore) in recommendation engine

### 2. Concern Names
- **Excel**: Can use extended values (e.g., `blackheads`, `sensitivity`, `fine-lines`)
- **Database**: Stores only core values (e.g., `acne`, `redness`, `aging`)
- **Mapping**: Upload script automatically maps extended → core concerns
- **Code**: Uses core concern names in `concernMapping.js`

### 3. Ingredient Names
- **Excel**: Must be normalized (lowercase, hyphens)
- **Database**: Stored as normalized (lowercase, hyphens)
- **Code**: Matches against normalized ingredient names in `concernMapping.js`
- **Example**: `Vitamin C` → `vitamin-c` (in Excel) → matches `vitamin-c` (in code)

### 4. Skin Types
- **Excel**: Lowercase (e.g., `oily`, `dry`, `combination`)
- **Database**: Lowercase (e.g., `oily`, `dry`, `combination`)
- **Code**: Case-insensitive matching (normalizes to lowercase)

### 5. Preferences
- **Excel**: Lowercase, comma-separated (e.g., `vegan,cruelty-free`)
- **Database**: Array of lowercase strings
- **Code**: Case-insensitive matching (normalizes to lowercase)

### 6. Climate Suitability
- **Excel**: Lowercase, comma-separated (e.g., `hot-humid,tropical`)
- **Database**: Array of lowercase strings
- **Code**: Case-insensitive matching (normalizes to lowercase)

### 7. Usage & Frequency
- **Excel**: Lowercase (e.g., `morning`, `evening`, `both`, `daily`, `weekly`)
- **Database**: Lowercase string
- **Code**: Case-insensitive matching (normalizes to lowercase)

---

## 📝 NORMALIZATION RULES SUMMARY

### All String Fields
- **Case**: Lowercase
- **Spaces**: Replace with hyphens
- **Examples**:
  - `Vitamin C` → `vitamin-c`
  - `Salicylic Acid` → `salicylic-acid`
  - `Hyaluronic Acid` → `hyaluronic-acid`

### Array Fields (Comma-Separated in Excel)
- **Format**: Comma-separated, no spaces needed (but allowed)
- **Example**: `vitamin-c,niacinamide,hyaluronic-acid`
- **Empty**: Leave cell empty (don't use "N/A" or "None")

### Boolean Fields
- **Format**: `true` or `false` (case-insensitive)
- **Alternatives**: `TRUE`, `FALSE`, `1`, `0`, `yes`, `no`
- **Fields**: `INSTOCK`, `SENSITIVITYSAFE`

### Number Fields
- **Format**: Positive numbers (integers or decimals)
- **Fields**: `PRICE`, `MRP`, `RATING`
- **Rating**: Should be 0-5 (decimal allowed, e.g., 4.5)
- **Price**: Supports INR format (₹ symbol, commas) - normalized during upload

---

## 🎯 PRIORITY ACTIONS

### High Priority (Critical)
1. ✅ **Add FULLINGREDIENTLIST column** - Critical for allergy checking
2. ✅ **Populate FULLINGREDIENTLIST** - Include all ingredients, normalized
3. ✅ **Add TEXTURE column** - For age-based texture preferences
4. ✅ **Add SUBCATEGORY for eye care products** - For accurate recommendations

### Medium Priority (Recommended)
1. ✅ **Populate PREFERENCES** - For preference scoring
2. ✅ **Populate CLIMATESUITABILITY** - For climate scoring
3. ✅ **Populate RATING** - For product rating scoring
4. ✅ **Verify all concern names** - Use valid core or extended values

### Low Priority (Optional)
1. ✅ **Populate FREQUENCY** - For frequency recommendations
2. ✅ **Populate all optional fields** - For complete product information

---

## 🚀 UPLOAD PROCESS

1. **Prepare Excel File**: Use the column names and formats specified above
2. **Validate Data**: Run through the data quality checklist before uploading
3. **Convert to CSV**: Save Excel file as CSV (UTF-8 encoding recommended)
4. **Run Upload Script**: Execute upload script
5. **Check Output**: Review validation messages and summary statistics
6. **Verify Database**: Query database to ensure all products are correctly formatted

---

## 📞 SUPPORT

If you encounter issues:
1. Check the validation errors in the upload script output
2. Refer to this document for detailed field requirements
3. Check the example row above for formatting reference
4. Ensure all enum values match the valid values listed above
5. Verify ingredient normalization (lowercase, hyphens)
6. Test allergy checking with sample products

---

## ✅ SUMMARY

**Summary of Required Changes**:
1. ✅ Add `FULLINGREDIENTLIST` column (CRITICAL for allergies)
2. ⚠️ `GENDER` column - NOT required for scoring (removed from scoring, replaced with scent preference)
3. ✅ Add `TEXTURE` column (for age-based texture preferences)
4. ✅ Add `SUBCATEGORY` for eye care products (for accurate recommendations)
5. ✅ Populate `PREFERENCES` with valid preference values
6. ✅ Populate `CLIMATESUITABILITY` for climate scoring
7. ✅ Populate `RATING` for product rating scoring
8. ✅ Normalize all ingredients (lowercase, hyphens)
9. ✅ Use valid concern names (core or extended values)
10. ✅ Use valid category names (uppercase in Excel)
11. ✅ Ensure all boolean fields are true/false

**All changes are backward compatible** - existing products will work with default values, but new fields should be populated for optimal recommendation accuracy.
