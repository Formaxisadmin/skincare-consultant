import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Category mapping - same as in 1-csv-reader.js
const CATEGORY_MAP = {
  'CLEANSERS': 'cleanser',
  'TONERS': 'toner',
  'SERUMS & AMPOULES': 'serum',
  'MOISTURIZERS': 'moisturizer',
  'SUNSCREENS': 'spf',
  'MASKS & PEELS': 'mask',
  'EYE CARE': 'eye_cream',
  'TREATMENTS': 'treatment',
  'OTHER': 'other',
};

const csvPath = path.join(process.cwd(), 'data-upload', '4-12-25 DB.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

const otherProducts = [];

records.forEach((raw, index) => {
  // Clean column names (remove "Content." prefix if present)
  const cleanedRaw = {};
  for (const [key, value] of Object.entries(raw)) {
    const cleanedKey = key.replace(/^Content\./, '').trim();
    cleanedRaw[cleanedKey] = value;
  }
  
  // Map category - same logic as 1-csv-reader.js
  const rawCategory = cleanedRaw.CATEGORY?.toUpperCase()?.trim();
  const category = CATEGORY_MAP[rawCategory] || 'other';
  
  if (category === 'other') {
    otherProducts.push({
      index: index + 1,
      name: cleanedRaw.NAME || cleanedRaw.name || 'N/A',
      brand: cleanedRaw.BRAND || cleanedRaw.brand || 'N/A',
      rawCategory: rawCategory || '(empty)',
      productId: cleanedRaw.PRODUCTID || cleanedRaw.productId || 'N/A',
    });
  }
});

console.log(`Found ${otherProducts.length} products in "other" category:\n`);
otherProducts.forEach((p, i) => {
  console.log(`${i + 1}. ${p.brand} - ${p.name}`);
  console.log(`   Category in CSV: "${p.rawCategory}"`);
  console.log(`   Product ID: ${p.productId}`);
  console.log();
});

