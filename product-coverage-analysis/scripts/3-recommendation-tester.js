import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Dynamically import RecommendationEngine by patching path aliases
 */
async function importRecommendationEngine() {
  const enginePath = path.join(process.cwd(), 'src', 'lib', 'recommendationEngine.js');
  const concernMappingPath = path.join(process.cwd(), 'src', 'data', 'concernMapping.js');
  
  if (!fs.existsSync(enginePath)) {
    throw new Error(`RecommendationEngine not found at: ${enginePath}`);
  }
  
  if (!fs.existsSync(concernMappingPath)) {
    throw new Error(`concernMapping not found at: ${concernMappingPath}`);
  }
  
  // Read the engine code
  let engineCode = fs.readFileSync(enginePath, 'utf-8');
  
  // Read the concernMapping code
  let concernMappingCode = fs.readFileSync(concernMappingPath, 'utf-8');
  
  // Convert concernMapping from CommonJS to ES module if needed
  if (concernMappingCode.includes('module.exports')) {
    concernMappingCode = concernMappingCode
      .replace(/module\.exports\s*=\s*\{/, 'export {')
      .replace(/const\s+concernMapping\s*=/g, 'export const concernMapping =')
      .replace(/const\s+concernPriorityModifiers\s*=/g, 'export const concernPriorityModifiers =');
  }
  
  // Create temporary files
  const tempEnginePath = path.join(process.cwd(), 'product-coverage-analysis', 'temp-engine.js');
  const tempConcernPath = path.join(process.cwd(), 'product-coverage-analysis', 'temp-concernMapping.js');
  
  fs.writeFileSync(tempConcernPath, concernMappingCode, 'utf-8');
  
  // Replace @/data/concernMapping with absolute path to temp file
  const tempConcernURL = pathToFileURL(tempConcernPath).href;
  engineCode = engineCode.replace(
    /from\s+['"]@\/data\/concernMapping['"]/g,
    `from '${tempConcernURL}'`
  );
  
  fs.writeFileSync(tempEnginePath, engineCode, 'utf-8');
  
  // Import the patched engine
  const engineURL = pathToFileURL(tempEnginePath).href;
  const { RecommendationEngine } = await import(engineURL);
  
  // Patch: Override validateProduct to convert empty skinTypes to ['all']
  // (Empty skinTypes means suitable for all skin types)
  const originalValidateProduct = RecommendationEngine.prototype.validateProduct;
  RecommendationEngine.prototype.validateProduct = function(product) {
    const result = originalValidateProduct.call(this, product);
    // If skinTypes is empty array, convert to ['all'] (empty means suitable for all skin types)
    if (product.skinTypes && Array.isArray(product.skinTypes) && product.skinTypes.length === 0) {
      product.skinTypes = ['all'];
    }
    return result;
  };
  
  // Clean up temp files
  fs.unlinkSync(tempEnginePath);
  fs.unlinkSync(tempConcernPath);
  
  return RecommendationEngine;
}

/**
 * Test recommendations for all profiles
 */
export async function testRecommendations(products, profiles) {
  console.log('🧪 Testing recommendations...');
  
  const RecommendationEngine = await importRecommendationEngine();
  
  const results = {
    totalProfiles: profiles.length,
    profilesWithRecommendations: 0,
    profilesWithoutRecommendations: 0,
    categoryCoverage: {},
    concernCoverage: {},
    skinTypeCoverage: {},
    missingCategories: {},
    missingConcerns: {},
    missingSkinTypes: {},
    profilesNeedingProducts: [],
    pricingData: {
      allRecommendedProducts: [], // Array of { product, category, price }
      byCategory: {}, // { category: { prices: [], products: [] } }
    },
    // New: Inventory vs Recommendation Analysis
    inventoryStats: {
      byPriceTier: {
        budget: { count: 0, products: [] },      // ₹0-500
        mid: { count: 0, products: [] },         // ₹500-1500
        premium: { count: 0, products: [] },     // ₹1500-3000
        luxury: { count: 0, products: [] },       // ₹3000+
      },
      total: 0,
    },
    recommendationStats: {
      byPriceTier: {
        budget: { count: 0, uniqueProducts: new Set() },
        mid: { count: 0, uniqueProducts: new Set() },
        premium: { count: 0, uniqueProducts: new Set() },
        luxury: { count: 0, uniqueProducts: new Set() },
      },
      uniqueProductIds: new Set(),
      productFrequency: {}, // { productId: { name, brand, price, count } }
      categoryUniqueIds: {}, // { category: Set of productIds }
    },
  };
  
  // Initialize coverage tracking
  const allCategories = new Set(products.map(p => p.category));
  const allConcerns = new Set();
  products.forEach(p => {
    if (Array.isArray(p.concernsAddressed)) {
      p.concernsAddressed.forEach(c => allConcerns.add(c));
    }
  });
  const allSkinTypes = ['oily', 'dry', 'combination', 'normal', 'sensitive'];
  
  allCategories.forEach(cat => {
    results.categoryCoverage[cat] = { total: 0, covered: 0 };
  });
  allConcerns.forEach(concern => {
    results.concernCoverage[concern] = { total: 0, covered: 0 };
  });
  allSkinTypes.forEach(st => {
    results.skinTypeCoverage[st] = { total: 0, covered: 0 };
  });
  
  // CRITICAL: Filter products by inStock: true to match actual app behavior
  // The actual app filters products before passing to the engine: Product.find({ inStock: true })
  const inStockProducts = products.filter(p => p.inStock === true);
  console.log(`   ℹ️  Filtered to ${inStockProducts.length} in-stock products (from ${products.length} total)`);
  
  // Helper function to categorize by price tier
  const categorizeByPrice = (price) => {
    if (!price || price <= 0) return null;
    if (price <= 500) return 'budget';
    if (price <= 1500) return 'mid';
    if (price <= 3000) return 'premium';
    return 'luxury';
  };
  
  // Calculate Inventory Baseline (Supply Analysis)
  
  inStockProducts.forEach(product => {
    const price = product.price || product.mrp || null;
    if (price && price > 0) {
      const tier = categorizeByPrice(price);
      if (tier) {
        results.inventoryStats.byPriceTier[tier].count++;
        results.inventoryStats.byPriceTier[tier].products.push({
          id: product.productId,
          name: product.name,
          brand: product.brand,
          price: price,
        });
      }
    }
  });
  results.inventoryStats.total = inStockProducts.length;
  
  // Initialize category unique IDs tracking (use inStockProducts for this)
  const inStockCategories = new Set(inStockProducts.map(p => p.category));
  inStockCategories.forEach(cat => {
    results.recommendationStats.categoryUniqueIds[cat] = new Set();
  });
  
  console.log(`   📊 Inventory baseline calculated:`);
  console.log(`      Budget (₹0-500): ${results.inventoryStats.byPriceTier.budget.count} products`);
  console.log(`      Mid (₹500-1500): ${results.inventoryStats.byPriceTier.mid.count} products`);
  console.log(`      Premium (₹1500-3000): ${results.inventoryStats.byPriceTier.premium.count} products`);
  console.log(`      Luxury (₹3000+): ${results.inventoryStats.byPriceTier.luxury.count} products`);
  
  // Test each profile
  let processed = 0;
  for (const profile of profiles) {
    processed++;
    if (processed % 100 === 0) {
      console.log(`   Processed ${processed}/${profiles.length} profiles...`);
    }
    
    try {
      // Create recommendation engine instance
      const engine = new RecommendationEngine(profile);
      
      // Get recommendations - use generateCompleteAnalysis to match actual app behavior
      // This ensures masks, treatments, and phased recommendations are included
      const analysis = await engine.generateCompleteAnalysis(inStockProducts);
      
      // 1. Get the Core Recommendations (Phase 1 & 2)
      const coreRecs = analysis.recommendations || {};
      
      // 2. Get the Optimizer Recommendations (Phase 3 - Masks/Eye Creams)
      // The engine stores these separately!
      const phase3Recs = analysis.phasedRecommendations?.phase3 || {};
      
      // 3. Merge them into one object for the report
      const recommendationsObj = { ...coreRecs };
      
      // Add Phase 3 items (Masks/Eye Creams) to the main list
      Object.keys(phase3Recs).forEach(category => {
        // If category doesn't exist in core, create it
        if (!recommendationsObj[category]) {
          recommendationsObj[category] = [];
        }
        // Add the products (merge arrays, don't overwrite)
        if (Array.isArray(phase3Recs[category])) {
          recommendationsObj[category].push(...phase3Recs[category]);
        }
      });
      
      // Convert recommendations object to flat array
      const recommendations = [];
      Object.values(recommendationsObj).forEach(categoryProducts => {
        if (Array.isArray(categoryProducts)) {
          recommendations.push(...categoryProducts);
        }
      });
      
      // Track coverage
      if (recommendations.length > 0) {
        results.profilesWithRecommendations++;
        
        // Track category coverage
        // Normalize category names for comparison (handle eye-cream vs eye_cream)
        const normalizeCategoryName = (cat) => {
          if (!cat) return '';
          const normalized = cat.toLowerCase().trim();
          return normalized === 'eye-cream' ? 'eye_cream' : normalized;
        };
        
        // Get all recommended category keys (including normalized versions)
        const recommendedCategoryKeys = Object.keys(recommendationsObj);
        const recommendedCategories = new Set(
          recommendedCategoryKeys.map(rc => normalizeCategoryName(rc))
        );
        
        // Also check category keys with alternative names (eye-cream vs eye_cream)
        const allRecommendedCategoryVariants = new Set();
        recommendedCategoryKeys.forEach(key => {
          allRecommendedCategoryVariants.add(key);
          allRecommendedCategoryVariants.add(normalizeCategoryName(key));
          // Add reverse mapping too
          if (key === 'eye-cream') allRecommendedCategoryVariants.add('eye_cream');
          if (key === 'eye_cream') allRecommendedCategoryVariants.add('eye-cream');
        });
        
        // Debug: Log categories in recommendations for first few profiles with mask/treatment concerns
        if (processed <= 5) {
          const hasMaskConcerns = profile.primaryConcerns?.some(c => ['acne', 'dryness', 'dullness', 'texture', 'aging', 'pigmentation'].includes(c));
          const hasTreatmentConcerns = profile.primaryConcerns?.some(c => ['acne', 'aging', 'texture', 'dullness', 'pigmentation'].includes(c));
          if (hasMaskConcerns || hasTreatmentConcerns) {
            console.log(`   🔍 Profile ${processed} - Concerns: ${profile.primaryConcerns?.join(', ') || 'none'}`);
            console.log(`      Recommended categories:`, recommendedCategoryKeys);
            console.log(`      Has mask products:`, recommendedCategoryKeys.includes('mask') || recommendedCategories.has('mask'));
            console.log(`      Has treatment products:`, recommendedCategoryKeys.includes('treatment') || recommendedCategories.has('treatment'));
          }
        }
        
        allCategories.forEach(cat => {
          const normalizedCat = normalizeCategoryName(cat);
          
          // Track for all profiles
          results.categoryCoverage[cat].total++;
          
          // Check if this category appears in recommendations (with normalization and variants)
          const isRecommended = recommendedCategories.has(normalizedCat) || 
                               recommendedCategoryKeys.includes(cat) ||
                               allRecommendedCategoryVariants.has(cat) ||
                               allRecommendedCategoryVariants.has(normalizedCat);
          
          if (isRecommended) {
            results.categoryCoverage[cat].covered++;
          }
        });
        
        // Track pricing data for recommended products
        recommendations.forEach(r => {
          const product = typeof r === 'object' && r.product ? r.product : r;
          const category = product.category || 'other';
          const price = product.price || product.mrp || null;
          const productId = product.productId;
          
          if (price !== null && !isNaN(price) && price > 0) {
            // Track all recommended products
            results.pricingData.allRecommendedProducts.push({
              product,
              category,
              price: parseFloat(price),
            });
            
            // Track by category
            if (!results.pricingData.byCategory[category]) {
              results.pricingData.byCategory[category] = {
                prices: [],
                products: [],
              };
            }
            results.pricingData.byCategory[category].prices.push(parseFloat(price));
            results.pricingData.byCategory[category].products.push({
              name: product.name,
              price: parseFloat(price),
            });
            
            // NEW: Track unique products and frequency
            results.recommendationStats.uniqueProductIds.add(productId);
            
            if (results.recommendationStats.categoryUniqueIds[category]) {
              results.recommendationStats.categoryUniqueIds[category].add(productId);
            }
            
            // Track product frequency
            if (!results.recommendationStats.productFrequency[productId]) {
              results.recommendationStats.productFrequency[productId] = {
                name: product.name,
                brand: product.brand || 'Unknown',
                price: parseFloat(price),
                count: 0,
                category: category,
              };
            }
            results.recommendationStats.productFrequency[productId].count++;
            
            // Track by price tier (Demand Analysis)
            const tier = categorizeByPrice(price);
            if (tier) {
              results.recommendationStats.byPriceTier[tier].count++;
              results.recommendationStats.byPriceTier[tier].uniqueProducts.add(productId);
            }
          }
        });
        
        // Track concern coverage
        profile.primaryConcerns.forEach(concern => {
          if (results.concernCoverage[concern]) {
            results.concernCoverage[concern].total++;
            // Check if any recommended product addresses this concern
            const addressesConcern = recommendations.some(r => {
              const product = typeof r === 'object' && r.product ? r.product : r;
              return Array.isArray(product.concernsAddressed) && product.concernsAddressed.includes(concern);
            });
            if (addressesConcern) {
              results.concernCoverage[concern].covered++;
            }
          }
        });
        
        // Track skin type coverage
        if (results.skinTypeCoverage[profile.skinType]) {
          results.skinTypeCoverage[profile.skinType].total++;
          results.skinTypeCoverage[profile.skinType].covered++;
        }
      } else {
        results.profilesWithoutRecommendations++;
        
        // Identify what's missing
        const requiredCategories = engine.getRequiredCategories();
        const profileConcerns = profile.primaryConcerns || [];
        const profileSkinType = profile.skinType;
        
        // Track missing categories
        requiredCategories.forEach(cat => {
          if (!results.missingCategories[cat]) {
            results.missingCategories[cat] = [];
          }
          results.missingCategories[cat].push({
            profile: {
              skinType: profileSkinType,
              concerns: profileConcerns,
              ageRange: profile.ageRange,
            },
          });
        });
        
        // Track missing concerns
        profileConcerns.forEach(concern => {
          if (!results.missingConcerns[concern]) {
            results.missingConcerns[concern] = [];
          }
          results.missingConcerns[concern].push({
            profile: {
              skinType: profileSkinType,
              concerns: profileConcerns,
              ageRange: profile.ageRange,
            },
          });
        });
        
        // Track missing skin types
        if (!results.missingSkinTypes[profileSkinType]) {
          results.missingSkinTypes[profileSkinType] = [];
        }
        results.missingSkinTypes[profileSkinType].push({
          profile: {
            skinType: profileSkinType,
            concerns: profileConcerns,
            ageRange: profile.ageRange,
          },
        });
        
        // Store profile that needs products
        results.profilesNeedingProducts.push({
          profile,
          missingCategories: requiredCategories,
          concerns: profileConcerns,
        });
      }
    } catch (error) {
      console.error(`   ❌ Error testing profile:`, error.message);
      results.profilesWithoutRecommendations++;
    }
  }
  
  console.log(`   ✅ Tested ${profiles.length} profiles`);
  console.log(`      - ${results.profilesWithRecommendations} profiles with recommendations`);
  console.log(`      - ${results.profilesWithoutRecommendations} profiles without recommendations`);
  
  return results;
}

