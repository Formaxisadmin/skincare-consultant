import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Core concerns used by recommendation engine
const CORE_CONCERNS = [
  'acne', 'pigmentation', 'aging', 'dryness', 'oiliness', 
  'dullness', 'redness', 'dark-circles', 'large-pores', 'texture'
];

// Concern mapping: maps extended concerns to core concerns
const CONCERN_MAPPING = {
  // Acne variations -> acne
  'blackheads': 'acne',
  'whiteheads': 'acne',
  'pimples': 'acne',
  'blemishes': 'acne',
  'mild-acne': 'acne',
  'acne-prone': 'acne',
  'breakouts': 'acne',
  // Pigmentation variations -> pigmentation
  'hyperpigmentation': 'pigmentation',
  'acne-scars': 'pigmentation',
  'dark-spots': 'pigmentation',
  'uneven-tone': 'pigmentation',
  'uneven-skin-tone': 'pigmentation',
  'scars': 'pigmentation',
  // Aging variations -> aging
  'fine-lines': 'aging',
  'wrinkles': 'aging',
  'anti-aging': 'aging',
  'loss-of-elasticity': 'aging',
  'loss-of-firmness': 'aging',
  'elasticity': 'aging',
  // Dryness variations -> dryness
  'dehydration': 'dryness',
  'compromised-barrier': 'dryness',
  'barrier-repair': 'dryness',
  'barrier-support': 'dryness',
  'flakiness': 'dryness',
  'chapped-lips': 'dryness',
  'hydration': 'dryness', // hydration -> dryness
  // Oiliness variations -> oiliness
  'sebum-control': 'oiliness',
  'excess-sebum': 'oiliness',
  'oil-control': 'oiliness',
  // Dullness variations -> dullness
  'loss-of-glow': 'dullness',
  // Redness variations -> redness
  'sensitivity': 'redness',
  'irritation': 'redness',
  // Dark circles variations -> dark-circles
  'puffiness': 'dark-circles',
  // Pore variations -> large-pores
  'pores': 'large-pores',
  'pore-care': 'large-pores',
  'pore-cleansing': 'large-pores',
  'enlarged-pores': 'large-pores',
  // Texture variations -> texture
  'uneven-texture': 'texture',
  'rough-texture': 'texture',
  'gentle-exfoliation': 'texture',
  'mild-exfoliation': 'texture',
};

// Valid skin types
const VALID_SKIN_TYPES = ['oily', 'dry', 'combination', 'normal', 'sensitive'];

// Category mapping - MUST match validation_config.py exactly
const CATEGORY_MAP = {
  'CLEANSERS': 'cleanser',
  'TONERS': 'toner',
  'SERUMS & AMPOULES': 'serum',  // Note: matches Python script, not just 'SERUMS'
  'MOISTURIZERS': 'moisturizer',
  'SUNSCREENS': 'spf',  // Note: matches Python script, not 'SPF'
  'MASKS & PEELS': 'mask',  // Note: matches Python script, not just 'MASKS'
  'EYE CARE': 'eye_cream',  // Note: matches Python script, not 'EYE CREAMS'
  'TREATMENTS': 'treatment',
  'OTHER': 'other',
};

// Column mapping
const COLUMN_MAP = {
  'PRODUCTID': 'productId',
  'NAME': 'name',
  'BRAND': 'brand',
  'SUBCATEGORY': 'subCategory',
  'MRP': 'mrp',
  'WEIGHT': 'weight',
  'SKINTYPES': 'skinTypes',
  'CONCERNSADDRESSED': 'concernsAddressed',
  'SENSITIVITYSAFE': 'sensitivitySafe',
  'KEYINGREDIENTS': 'keyIngredients',
  'FULLINGREDIENTLIST': 'fullIngredientList',
  'FULLINGRIEDIENTSLIST': 'fullIngredientList', // Handle typo
  'GENDER': 'gender',
  'TEXTURE': 'texture',
  'Texture': 'texture',
  'CLIMATESUITABILITY': 'climateSuitability',
  'PREFERENCES': 'preferences',
  'USAGE': 'usage',
  'FREQUENCY': 'frequency',
  'DESCRIPTION': 'description',
  'BENEFITS': 'benefits',
  'INSTRUCTIONS': 'instructions',
  'RATING': 'rating',
  'IMAGEURL': 'imageUrl',
  'PRODUCTURL': 'productUrl',
  'CHEAPESTSTORELINK': 'cheapestStoreLink',
  'INSTOCK': 'inStock',
  'SHOPIFYPRODUCTID': 'shopifyProductId',
  'SHOPIFYPRODCUTID': 'shopifyProductId', // Handle typo
  'SHOPIFYVARIANTID': 'shopifyVariantId',
  ' SHOPIFYVARIANTID': 'shopifyVariantId', // Handle leading space
};

/**
 * Normalize array field from CSV
 */
function normalizeArray(value, treatEmptyAsAll = false, mapConcerns = false) {
  if (!value || value === '' || value === 'N/A' || value === 'N\\A') {
    return treatEmptyAsAll ? ['all'] : [];
  }
  
  let items = String(value)
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(item => item && item !== 'n/a' && item !== 'n\\a');
  
  if (mapConcerns) {
    const mappedItems = [];
    items.forEach(item => {
      // Special handling for UV-protection: maps to both aging and pigmentation
      if (item === 'uv-protection') {
        mappedItems.push('aging', 'pigmentation');
      } else if (CONCERN_MAPPING[item]) {
        mappedItems.push(CONCERN_MAPPING[item]);
      } else if (CORE_CONCERNS.includes(item)) {
        mappedItems.push(item);
      }
      // Filter out non-concern values (e.g., "no-white-cast", product features)
    });
    items = [...new Set(mappedItems)].filter(item => CORE_CONCERNS.includes(item));
  }
  
  return items;
}

/**
 * Normalize ingredient list
 */
function normalizeIngredient(ingredient) {
  if (!ingredient || typeof ingredient !== 'string') return null;
  const normalized = ingredient.trim().toLowerCase().replace(/\s+/g, '-');
  return normalized.replace(/[^a-z0-9-]/g, '') || null;
}

/**
 * Normalize ingredient list from CSV
 */
function normalizeIngredientList(value) {
  if (!value || value === '' || value === 'N/A' || value === 'N\\A') {
    return [];
  }
  return String(value)
    .split(',')
    .map(ing => normalizeIngredient(ing))
    .filter(ing => ing);
}

/**
 * Normalize boolean value
 */
function normalizeBoolean(value) {
  if (!value || value === '' || value === 'N/A' || value === 'N\\A') {
    return true; // Default to true for inStock
  }
  const valueStr = String(value).trim().toUpperCase();
  return ['TRUE', '1', 'YES', 'Y'].includes(valueStr);
}

/**
 * Normalize number value (handles currency symbols and commas)
 */
function normalizeNumber(value) {
  if (!value || value === '' || value === 'N/A' || value === 'N\\A') {
    return null;
  }
  const cleaned = String(value)
    .replace(/[₹$,]/g, '')
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Read and parse products from CSV file
 */
export function readProductsFromCSV() {
  // Try multiple possible locations for the CSV file
  const possiblePaths = [
    path.join(process.cwd(), 'data-upload', '4-12-25 DB.csv'),
    path.join(__dirname, '..', 'data-upload', '4-12-25 DB.csv'),
    path.join(process.cwd(), '4-12-25 DB.csv'),
  ];
  
  let csvPath = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      csvPath = possiblePath;
      break;
    }
  }
  
  if (!csvPath) {
    throw new Error(`CSV file not found. Tried: ${possiblePaths.join(', ')}`);
  }
  
  console.log(`📖 Reading CSV from: ${csvPath}`);
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  
  console.log(`   ✅ Loaded ${records.length} rows from CSV`);
  
  // Track category mapping for debugging
  const categoryMappingStats = {};
  
  // Process each record
  const products = records.map((raw, index) => {
    // Clean column names (remove "Content." prefix if present)
    const cleanedRaw = {};
    for (const [key, value] of Object.entries(raw)) {
      const cleanedKey = key.replace(/^Content\./, '').trim();
      cleanedRaw[cleanedKey] = value;
    }
    
    // Map category - match Python script exactly
    const rawCategory = cleanedRaw.CATEGORY?.toUpperCase()?.trim();
    const category = CATEGORY_MAP[rawCategory] || 'other';
    
    // Track mapping for debugging
    if (!categoryMappingStats[rawCategory]) {
      categoryMappingStats[rawCategory] = { count: 0, mappedTo: category };
    }
    categoryMappingStats[rawCategory].count++;
    
    // Map all columns
    const product = {
      productId: cleanedRaw[COLUMN_MAP.PRODUCTID] || cleanedRaw.PRODUCTID || `product-${index}`,
      name: cleanedRaw[COLUMN_MAP.NAME] || cleanedRaw.NAME || '',
      brand: cleanedRaw[COLUMN_MAP.BRAND] || cleanedRaw.BRAND || '',
      category: category,
      subCategory: cleanedRaw[COLUMN_MAP.SUBCATEGORY] || cleanedRaw.SUBCATEGORY || null,
      mrp: normalizeNumber(cleanedRaw[COLUMN_MAP.MRP] || cleanedRaw.MRP),
      price: normalizeNumber(cleanedRaw[COLUMN_MAP.MRP] || cleanedRaw.MRP), // Set price = mrp for consistency
      weight: cleanedRaw[COLUMN_MAP.WEIGHT] || cleanedRaw.WEIGHT || null,
      skinTypes: normalizeArray(cleanedRaw[COLUMN_MAP.SKINTYPES] || cleanedRaw.SKINTYPES, true), // Empty means 'all'
      concernsAddressed: normalizeArray(cleanedRaw[COLUMN_MAP.CONCERNSADDRESSED] || cleanedRaw.CONCERNSADDRESSED, false, true), // Map to core concerns
      sensitivitySafe: normalizeBoolean(cleanedRaw[COLUMN_MAP.SENSITIVITYSAFE] || cleanedRaw.SENSITIVITYSAFE),
      keyIngredients: normalizeIngredientList(cleanedRaw[COLUMN_MAP.KEYINGREDIENTS] || cleanedRaw.KEYINGREDIENTS || cleanedRaw[COLUMN_MAP.FULLINGRIEDIENTSLIST] || cleanedRaw.FULLINGRIEDIENTSLIST),
      fullIngredientList: normalizeIngredientList(cleanedRaw[COLUMN_MAP.FULLINGREDIENTLIST] || cleanedRaw.FULLINGREDIENTLIST || cleanedRaw[COLUMN_MAP.FULLINGRIEDIENTSLIST] || cleanedRaw.FULLINGRIEDIENTSLIST),
      gender: (cleanedRaw[COLUMN_MAP.GENDER] || cleanedRaw.GENDER || 'neutral').toLowerCase(),
      texture: (cleanedRaw[COLUMN_MAP.TEXTURE] || cleanedRaw.Texture || cleanedRaw.TEXTURE || null)?.toLowerCase() || null,
      climateSuitability: normalizeArray(cleanedRaw[COLUMN_MAP.CLIMATESUITABILITY] || cleanedRaw.CLIMATESUITABILITY, false),
      preferences: normalizeArray(cleanedRaw[COLUMN_MAP.PREFERENCES] || cleanedRaw.PREFERENCES, false),
      usage: (cleanedRaw[COLUMN_MAP.USAGE] || cleanedRaw.USAGE || 'both').toLowerCase(),
      frequency: (cleanedRaw[COLUMN_MAP.FREQUENCY] || cleanedRaw.FREQUENCY || 'daily').toLowerCase(),
      description: cleanedRaw[COLUMN_MAP.DESCRIPTION] || cleanedRaw.DESCRIPTION || null,
      benefits: cleanedRaw[COLUMN_MAP.BENEFITS] || cleanedRaw.BENEFITS || null,
      instructions: cleanedRaw[COLUMN_MAP.INSTRUCTIONS] || cleanedRaw.INSTRUCTIONS || null,
      rating: normalizeNumber(cleanedRaw[COLUMN_MAP.RATING] || cleanedRaw.RATING),
      imageUrl: cleanedRaw[COLUMN_MAP.IMAGEURL] || cleanedRaw.IMAGEURL || null,
      productUrl: cleanedRaw[COLUMN_MAP.PRODUCTURL] || cleanedRaw.PRODUCTURL || null,
      cheapestStoreLink: cleanedRaw[COLUMN_MAP.CHEAPESTSTORELINK] || cleanedRaw.CHEAPESTSTORELINK || null,
      inStock: normalizeBoolean(cleanedRaw[COLUMN_MAP.INSTOCK] || cleanedRaw.INSTOCK),
      shopifyProductId: cleanedRaw[COLUMN_MAP.SHOPIFYPRODUCTID] || cleanedRaw[COLUMN_MAP.SHOPIFYPRODCUTID] || cleanedRaw.SHOPIFYPRODUCTID || cleanedRaw.SHOPIFYPRODCUTID || null,
      shopifyVariantId: cleanedRaw[COLUMN_MAP.SHOPIFYVARIANTID] || cleanedRaw[' SHOPIFYVARIANTID'] || cleanedRaw.SHOPIFYVARIANTID || null,
    };
    
    // Set defaults
    if (!product.inStock) product.inStock = true;
    if (!product.sensitivitySafe) product.sensitivitySafe = false;
    if (!product.usage) product.usage = 'both';
    if (!product.frequency) product.frequency = 'daily';
    if (!product.gender) product.gender = 'neutral';
    
    return product;
  });
  
  console.log(`   ✅ Processed ${products.length} products`);
  
  // Log category mapping statistics
  console.log(`   📊 Category mapping statistics:`);
  Object.entries(categoryMappingStats)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([rawCat, stats]) => {
      console.log(`      ${rawCat || '(empty)'} → ${stats.mappedTo}: ${stats.count} products`);
    });
  
  // Warn about unmapped categories
  const unmappedCategories = Object.entries(categoryMappingStats)
    .filter(([rawCat, stats]) => stats.mappedTo === 'other' && rawCat)
    .map(([rawCat]) => rawCat);
  if (unmappedCategories.length > 0) {
    console.log(`   ⚠️  Warning: ${unmappedCategories.length} categories mapped to 'other': ${unmappedCategories.join(', ')}`);
  }
  
  return products;
}

