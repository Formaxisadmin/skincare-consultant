// lib/recommendationEngine.js
import { concernMapping, concernPriorityModifiers } from '@/data/concernMapping';

export class RecommendationEngine {
  constructor(responses) {
    this.responses = responses;
    this.profile = this.buildProfile();
    this.concerns = this.analyzeConcerns();
  }

  // Normalize string: lowercase, trim, handle null/undefined
  normalizeString(str) {
    if (!str || typeof str !== 'string') return '';
    return str.toLowerCase().trim();
  }

  // Normalize array of strings
  normalizeArray(arr) {
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(item => item != null)
      .map(item => this.normalizeString(String(item)))
      .filter(item => item !== '');
  }

  // Normalize category name (handle both eye-cream and eye_cream)
  normalizeCategory(category) {
    if (!category) return '';
    const normalized = this.normalizeString(category);
    // Convert eye-cream to eye_cream to match database schema
    return normalized === 'eye-cream' ? 'eye_cream' : normalized;
  }

  // Validate product has required fields
  validateProduct(product) {
    if (!product) return false;
    
    // Required fields
    if (!product.productId || !product.name || !product.category) {
      return false;
    }

    // Ensure arrays exist (default to empty array)
    if (!Array.isArray(product.skinTypes)) product.skinTypes = [];
    if (!Array.isArray(product.concernsAddressed)) product.concernsAddressed = [];
    if (!Array.isArray(product.keyIngredients)) product.keyIngredients = [];
    if (!Array.isArray(product.preferences)) product.preferences = [];
    if (!Array.isArray(product.climateSuitability)) product.climateSuitability = [];
    if (!Array.isArray(product.fullIngredientList)) product.fullIngredientList = [];

    // Normalize category
    product.category = this.normalizeCategory(product.category);

    // Normalize arrays
    product.skinTypes = this.normalizeArray(product.skinTypes);
    product.concernsAddressed = this.normalizeArray(product.concernsAddressed);
    product.keyIngredients = this.normalizeArray(product.keyIngredients);
    product.preferences = this.normalizeArray(product.preferences);
    product.climateSuitability = this.normalizeArray(product.climateSuitability);
    product.fullIngredientList = this.normalizeArray(product.fullIngredientList);

    // Normalize other string fields
    if (product.gender) product.gender = this.normalizeString(product.gender);
    if (product.texture) product.texture = this.normalizeString(product.texture);
    if (product.usage) product.usage = this.normalizeString(product.usage);
    if (product.frequency) product.frequency = this.normalizeString(product.frequency);

    // Ensure boolean fields are boolean
    if (typeof product.sensitivitySafe !== 'boolean') {
      product.sensitivitySafe = false;
    }
    if (typeof product.inStock !== 'boolean') {
      product.inStock = true; // Default to in stock if not specified
    }

    return true;
  }

  // Build customer profile
  buildProfile() {
    // Calculate preferred texture based on Age + Skin Type matrix (not age alone)
    const preferredTexture = this.getPreferredTexture();
    
    return {
      ageRange: this.responses.ageRange,
      skinType: this.responses.skinType,
      sensitivity: this.responses.sensitivity,
      currentRoutine: this.responses.currentRoutine,
      sunExposure: this.responses.sunExposure,
      climate: this.responses.climate,
      lifestyleFactors: this.responses.lifestyleFactors || [],
      // Conditional questions (only present if user selected relevant lifestyle factors)
      facialHairRemovalMethod: this.responses.facialHairRemovalMethod, // Conditional: only if facial-hair-removal selected
      facialHairRemovalFrequency: this.responses.facialHairRemovalFrequency, // Conditional: only if method selected
      makeupType: this.responses.makeupType, // Conditional: only if makeup selected
      // Normalize stressSkinIssues to an array
      stressSkinIssues: Array.isArray(this.responses.stressSkinIssues)
        ? this.responses.stressSkinIssues
        : (this.responses.stressSkinIssues
            ? [this.responses.stressSkinIssues]
            : []), // Conditional: only if stress selected
      scentPreference: Array.isArray(this.responses.scentPreference) 
        ? this.responses.scentPreference 
        : (this.responses.scentPreference ? [this.responses.scentPreference] : []), // Always shown, now supports multiple
      preferredTexture: preferredTexture, // Age + Skin Type matrix
      allergies: this.responses.allergies || [], // Hard constraints - ingredients to avoid
      preferences: this.responses.preferences || [], // Soft constraints - preferences
    };
  }

  // Get the top-ranked concern (by priority score)
  // This is used to determine texture preferences and scoring penalties
  getTopConcern() {
    // If concerns are already analyzed, use the first one (already sorted by priority)
    if (this.concerns && this.concerns.length > 0) {
      return this.concerns[0];
    }
    
    // Otherwise, calculate it on the fly (for use in getPreferredTexture before analyzeConcerns is called)
    const primaryConcerns = this.responses.primaryConcerns || [];
    const concernsWithPriority = [];
    
    primaryConcerns.forEach((concern) => {
      if (concernMapping[concern]) {
        let priorityScore = 1.0;
        
        // Apply age modifiers
        const ageModifiers = concernPriorityModifiers.ageFactors[this.responses.ageRange];
        if (ageModifiers && ageModifiers[concern]) {
          priorityScore *= ageModifiers[concern];
        }
        
        // Apply sun exposure modifiers
        const sunModifiers = concernPriorityModifiers.sunExposureFactors[this.responses.sunExposure];
        if (sunModifiers && sunModifiers[concern]) {
          priorityScore *= sunModifiers[concern];
        }
        
        // Apply acne severity modifier
        if (concern === 'acne' && this.responses.acneSeverity) {
          const severityModifier = concernPriorityModifiers.acneSeverityFactors[this.responses.acneSeverity];
          priorityScore *= severityModifier;
        }
        
        concernsWithPriority.push({
          concern,
          priorityScore,
        });
      }
    });
    
    // Sort by priority and return the top one
    concernsWithPriority.sort((a, b) => b.priorityScore - a.priorityScore);
    return concernsWithPriority.length > 0 ? concernsWithPriority[0] : null;
  }

  // Get preferred texture based on Age + Skin Type matrix (not age alone)
  getPreferredTexture() {
    const ageRange = this.responses.ageRange;
    const skinType = this.normalizeString(this.responses.skinType || '');
    
    // Get the #1 ranked concern (by priority score)
    const topConcern = this.getTopConcern();
    const topConcernKey = topConcern ? this.normalizeString(topConcern.concern) : null;
    
    // PRIORITY-BASED TEXTURE PREFERENCE: Use #1 concern to determine texture preference
    // #1 concern overrides secondary concerns (e.g., if #1 is dryness, prioritize heavy textures even if #2 is acne)
    const isTopConcernOily = topConcernKey && ['acne', 'oiliness', 'large-pores'].includes(topConcernKey);
    const isTopConcernDry = topConcernKey && ['dryness', 'redness', 'aging'].includes(topConcernKey);
    
    // Age + Skin Type Matrix (2-dimensional logic)
    // Skin Type is weighted 70%, Age is weighted 30%
    // BUT: Concerns can override (acne/oiliness → prioritize lightweight)
    
    // Base textures by skin type (70% weight)
    const skinTypeTextures = {
      'dry': ['cream', 'rich-cream', 'balm'],
      'oily': ['gel', 'lightweight', 'gel-cream'],
      'combination': ['gel-cream', 'cream', 'lightweight'],
      'normal': ['gel-cream', 'cream', 'lightweight'],
      'sensitive': ['gel-cream', 'lightweight', 'cream'],
      'not-sure': ['gel-cream', 'cream', 'lightweight'], // Neutral default
    };
    
    // Get base textures from skin type
    let baseTextures = skinTypeTextures[skinType] || ['gel-cream', 'cream', 'lightweight'];
    
    // PRIORITY-BASED OVERRIDE: Use #1 concern to determine texture preference
    // IF #1 concern is acne/oiliness/large-pores → Force lightweight textures
    // ELSE IF #1 concern is dryness/redness/aging → Force gel-cream, cream, or rich-cream (even if acne is secondary)
    if (isTopConcernOily && (skinType === 'not-sure' || skinType === 'sensitive')) {
      // #1 concern is oily-type → prioritize lightweight textures even if skin type is "not-sure"
      const lightTextures = ['lightweight', 'gel', 'gel-cream'];
      baseTextures = lightTextures.filter(t => baseTextures.includes(t) || t === 'lightweight' || t === 'gel');
      if (baseTextures.length === 0) {
        baseTextures = ['lightweight', 'gel-cream', 'gel'];
      }
    } else if (isTopConcernDry) {
      // #1 concern is dryness/redness/aging → prioritize heavier textures (barrier repair, hydration)
      // This overrides any secondary acne concerns
      const heavyTextures = ['gel-cream', 'cream', 'rich-cream'];
      baseTextures = heavyTextures.filter(t => baseTextures.includes(t) || t === 'gel-cream' || t === 'cream');
      if (baseTextures.length === 0) {
        baseTextures = ['gel-cream', 'cream', 'rich-cream'];
      }
    }
    
    // Age adjustments (30% weight)
    const ageAdjustments = {
      'under18': { prefer: ['gel', 'lightweight'], avoid: ['rich-cream', 'balm'] },
      '18-25': { prefer: ['gel', 'lightweight'], avoid: ['rich-cream', 'balm'] },
      '26-35': { prefer: ['gel-cream', 'lightweight'], avoid: ['balm'] },
      '36-45': { prefer: ['cream', 'gel-cream'], avoid: ['gel'] },
      '46-55': { prefer: ['cream', 'rich-cream'], avoid: ['gel'] },
      '56+': { prefer: ['rich-cream', 'balm'], avoid: ['gel'] },
    };
    
    // Get age adjustments
    const ageAdjust = ageAdjustments[ageRange] || { prefer: [], avoid: [] };
    
    // Combine: Start with skin type textures, then apply age adjustments
    let preferredTextures = [...baseTextures];
    
    // Remove textures that age avoids (if skin type allows)
    preferredTextures = preferredTextures.filter(t => !ageAdjust.avoid.includes(t));
    
    // Add age-preferred textures if not already present (but respect skin type)
    ageAdjust.prefer.forEach(texture => {
      if (!preferredTextures.includes(texture) && baseTextures.some(bt => 
        (texture === 'gel' && (bt === 'gel' || bt === 'lightweight')) ||
        (texture === 'lightweight' && (bt === 'gel' || bt === 'lightweight' || bt === 'gel-cream')) ||
        (texture === 'gel-cream' && (bt === 'gel-cream' || bt === 'cream' || bt === 'lightweight')) ||
        (texture === 'cream' && (bt === 'cream' || bt === 'gel-cream' || bt === 'rich-cream')) ||
        (texture === 'rich-cream' && (bt === 'rich-cream' || bt === 'cream' || bt === 'balm')) ||
        (texture === 'balm' && (bt === 'balm' || bt === 'rich-cream'))
      )) {
        preferredTextures.push(texture);
      }
    });
    
    // PRIORITY-BASED FINAL ADJUSTMENT: Use #1 concern to prioritize textures
    if (isTopConcernOily) {
      // #1 concern is oily-type → Move lightweight textures to the front
      const lightTextures = ['lightweight', 'gel', 'gel-cream'].filter(t => preferredTextures.includes(t));
      const heavyTextures = preferredTextures.filter(t => !lightTextures.includes(t));
      preferredTextures = [...lightTextures, ...heavyTextures];
    } else if (isTopConcernDry) {
      // #1 concern is dryness/redness/aging → Move heavier textures to the front (barrier repair, hydration)
      const heavyTextures = ['gel-cream', 'cream', 'rich-cream', 'balm'].filter(t => preferredTextures.includes(t));
      const lightTextures = preferredTextures.filter(t => !heavyTextures.includes(t));
      preferredTextures = [...heavyTextures, ...lightTextures];
    }
    
    // Ensure we have at least 2 textures
    if (preferredTextures.length === 0) {
      preferredTextures = ['gel-cream', 'cream'];
    }
    
    // Return top 2-3 preferred textures
    return preferredTextures.slice(0, 3);
  }

  // Analyze and prioritize concerns
  analyzeConcerns() {
    const primaryConcerns = this.responses.primaryConcerns || [];
    const concerns = [];

    primaryConcerns.forEach((concern) => {
      if (concernMapping[concern]) {
        let priorityScore = 1.0;

        // Apply age modifiers
        const ageModifiers = concernPriorityModifiers.ageFactors[this.responses.ageRange];
        if (ageModifiers && ageModifiers[concern]) {
          priorityScore *= ageModifiers[concern];
        }

        // Apply sun exposure modifiers
        const sunModifiers = concernPriorityModifiers.sunExposureFactors[this.responses.sunExposure];
        if (sunModifiers && sunModifiers[concern]) {
          priorityScore *= sunModifiers[concern];
        }

        // Apply acne severity modifier
        if (concern === 'acne' && this.responses.acneSeverity) {
          const severityModifier = concernPriorityModifiers.acneSeverityFactors[this.responses.acneSeverity];
          priorityScore *= severityModifier;
        }

        concerns.push({
          concern,
          name: concernMapping[concern].name,
          description: concernMapping[concern].description,
          priorityScore,
          requiredCategories: concernMapping[concern].requiredCategories,
          keyIngredients: concernMapping[concern].keyIngredients,
          avoidIngredients: concernMapping[concern].avoidIngredients,
        });
      }
    });

    // Sort by priority
    concerns.sort((a, b) => b.priorityScore - a.priorityScore);

    return concerns;
  }

  // Get all required product categories
  getRequiredCategories() {
    const categories = new Set();
    
    this.concerns.forEach((concern) => {
      concern.requiredCategories.forEach((cat) => categories.add(cat));
    });

    // SPF is always required
    categories.add('spf');

    return Array.from(categories);
  }

  // Get preferred ingredients
  getPreferredIngredients() {
    const ingredients = new Set();
    
    this.concerns.forEach((concern) => {
      concern.keyIngredients.forEach((ing) => ingredients.add(ing));
    });

    return Array.from(ingredients);
  }

  // Get ingredients to avoid
  getAvoidIngredients() {
    const ingredients = new Set();
    
    this.concerns.forEach((concern) => {
      concern.avoidIngredients.forEach((ing) => ingredients.add(ing));
    });

    // Add sensitivity-based avoidances
    if (this.profile.sensitivity === 'very' || this.profile.sensitivity === 'somewhat') {
      ingredients.add('fragrance');
      ingredients.add('alcohol');
      ingredients.add('harsh-acids');
    }

    return Array.from(ingredients);
  }

  // Get user allergies (hard constraints)
  getUserAllergies() {
    const allergies = (this.profile.allergies || []).filter(a => a !== 'none');
    return allergies.map(a => this.normalizeString(a));
  }

  // ============================================================================
  // BUSINESS LOGIC TIE-BREAKER
  // ============================================================================
  // When products are within 3-5 points of each other (a "tie"), use mrp as secondary sort.
  // This builds trust by recommending affordable options when quality is similar.
  // Strategy: Sort by mrp (ascending) when scores are within tie margin.
  // Result: User sees $35 product over $90 product when scores are 85.5 vs 84.0 (1.5 point difference).
  // Business Impact: Lose $5 margin on one product, gain $150 from entire cart purchase.
  // ============================================================================
  sortProductsWithTieBreaker(products, tieMargin = 5) {
    if (!products || products.length === 0) return products;
    
    // Sort by score only (descending) - price should not affect product recommendations
    const sorted = [...products].sort((a, b) => {
      const scoreA = typeof a.score === 'object' ? a.score.score : a.score;
      const scoreB = typeof b.score === 'object' ? b.score.score : b.score;
      
      // Sort by score only (highest first)
      return scoreB - scoreA;
    });
    
    return sorted;
  }

  // ============================================================================
  // DATA GOVERNANCE REQUIREMENTS
  // ============================================================================
  // CRITICAL: This engine's accuracy is 100% dependent on 100% accurate data tagging.
  // 
  // REQUIRED DATA FIELDS FOR EVERY PRODUCT:
  // - texture: MUST be tagged (missing = neutral +2, loses to products with tags)
  // - skinTypes: MUST be accurate (wrong tag = -15 penalty, kills good recommendations)
  // - sensitivitySafe: MUST be accurate (wrong tag = breaks user trust, harms skin)
  // - fullIngredientList: MUST exist if user has allergies (missing = disqualification)
  // - keyIngredients: Used for scoring, should be comprehensive
  // - concernsAddressed: Used for matching, should be accurate
  // - category: Used for phasing, must be correct
  // 
  // DATA ENTRY SOP (Standard Operating Procedure):
  // 1. Every new product MUST have ALL fields filled out with 100% accuracy
  // 2. Verify texture matches product description (gel/lightweight/cream/etc.)
  // 3. Verify skinTypes match product claims (dry/oily/combination/etc.)
  // 4. Verify sensitivitySafe matches ingredient analysis (true/false)
  // 5. Verify fullIngredientList is complete (required for allergy safety)
  // 6. Verify concernsAddressed matches product benefits
  // 
  // The engine's "smartness" is directly proportional to your data's "cleanness."
  // ============================================================================

  // Check if product contains any allergy ingredients (hard constraints)
  // CRITICAL SAFETY: If user has allergies and product lacks fullIngredientList, disqualify immediately
  // Do NOT fall back to keyIngredients - allergens are never in marketing ingredient lists
  hasAllergyIngredients(product, userAllergies) {
    if (!userAllergies || userAllergies.length === 0) {
      return false;
    }

    // CRITICAL SAFETY CHECK: If user has allergies, product MUST have fullIngredientList
    // Allergens (e.g., "Limonene", "Arachidyl Glucoside") are NEVER in keyIngredients (marketing list)
    // Missing fullIngredientList = unknown safety risk = disqualify
    const hasFullIngredientList = product.fullIngredientList && product.fullIngredientList.length > 0;
    if (!hasFullIngredientList) {
      // User has allergies but product lacks full ingredient list - cannot verify safety
      // Return true to disqualify (treat as "may contain allergens" for safety)
      return true; // Disqualify: cannot verify allergen-free without full ingredient list
    }

    // Check fullIngredientList (most comprehensive)
    const ingredientList = product.fullIngredientList.map(ing => this.normalizeString(ing));

    // Check if any allergy ingredient is in the product's ingredient list
    return userAllergies.some(allergy => {
      // Direct match
      if (ingredientList.includes(allergy)) {
        return true;
      }
      
      // Check for partial matches (e.g., "vitamin-c" matches "ascorbic-acid" in some cases)
      // This is a safety check - if allergy is "vitamin-c", check for "ascorbic-acid", "ascorbyl", etc.
      const allergyLower = allergy.toLowerCase();
      return ingredientList.some(ing => {
        const ingLower = ing.toLowerCase();
        // Exact match or contains the allergy term
        return ingLower.includes(allergyLower) || allergyLower.includes(ingLower);
      });
    });
  }

  // Calculate product match score (with case-insensitive comparisons)
  // PHASE 3.1: Returns {score, reasoning} object instead of just score
  calculateProductScore(product, options = {}) {
    // Options can include:
    // - ignorePreferences: boolean (ignore preference scoring)
    // - ignoreSecondaryConcerns: boolean (ignore lower priority concerns)
    // - minimalScoring: boolean (only skin type + sensitivity)
    
    const reasoning = []; // PHASE 3.1: Build reasoning array as we calculate score
    
    // Validate and normalize product first
    if (!this.validateProduct(product)) {
      return { score: 0, reasoning: ['Invalid product data'] }; // Invalid product gets 0 score
    }

    // ===== HARD CONSTRAINTS (ALLERGIES) - CHECK FIRST =====
    // If product contains ANY allergy ingredient, disqualify immediately
    // Hard constraints are NEVER relaxed
    // CRITICAL SAFETY: If user has allergies and product lacks fullIngredientList, disqualify immediately
    const userAllergies = this.getUserAllergies();
    if (userAllergies && userAllergies.length > 0) {
      // CRITICAL SAFETY CHECK: If user has allergies, product MUST have fullIngredientList
      // Allergens are NEVER in keyIngredients (marketing list) - missing fullIngredientList = unknown risk
      const hasFullIngredientList = product.fullIngredientList && product.fullIngredientList.length > 0;
      if (!hasFullIngredientList) {
        // User has allergies but product lacks full ingredient list - cannot verify safety
        // Disqualify immediately (safety risk is not worth the risk of a lost sale)
        return {
          score: -999,
          reasoning: [`Product ingredient list is incomplete. Cannot verify allergen-free status. This product is not recommended for you due to your allergies.`]
        }; // Hard constraint violation - product is disqualified
      }
    }
    
    // Now check if product actually contains allergens (only if fullIngredientList exists)
    if (this.hasAllergyIngredients(product, userAllergies)) {
      // Find which allergens are in the product (fullIngredientList is guaranteed to exist here)
      const ingredientList = product.fullIngredientList.map(ing => this.normalizeString(ing));
      
      const foundAllergens = userAllergies.filter(allergy => {
        return ingredientList.some(ing => {
          const ingLower = ing.toLowerCase();
          const allergyLower = allergy.toLowerCase();
          return ingLower.includes(allergyLower) || allergyLower.includes(ingLower);
        });
      });
      
      return {
        score: -999,
        reasoning: [`Contains allergens: ${foundAllergens.join(', ')}. This product is not recommended for you.`]
      }; // Hard constraint violation - product is disqualified
    }

    // ===== MINIMAL SCORING (PASS 4: ESSENTIAL FALLBACK) =====
    // Only score based on Skin Type + Sensitivity
    if (options.minimalScoring) {
      let score = 0;
      const normalizedSkinType = this.normalizeString(this.profile.skinType);
      const normalizedSkinTypes = product.skinTypes.map(st => this.normalizeString(st));
      
      if (normalizedSkinTypes.includes(normalizedSkinType) || normalizedSkinTypes.includes('all')) {
        score += 25;
        reasoning.push(`Matches your '${this.profile.skinType}' skin type.`);
      }
      
      const normalizedSensitivity = this.normalizeString(this.profile.sensitivity);
      if (normalizedSensitivity === 'very' || normalizedSensitivity === 'somewhat') {
        if (product.sensitivitySafe) {
          score += 10;
          reasoning.push('Safe for sensitive skin.');
        }
      }
      
      return { score, reasoning };
    }

    let score = 0;
    const maxScore = 100;

    // Normalize skin type for comparison
    const normalizedSkinType = this.normalizeString(this.profile.skinType);
    const normalizedSkinTypes = product.skinTypes.map(st => this.normalizeString(st));
    
    // Get the #1 ranked concern (by priority score) for priority-based scoring
    // This is used throughout the function to determine texture preferences and penalties
    const topConcern = this.getTopConcern();
    const topConcernKey = topConcern ? this.normalizeString(topConcern.concern) : null;
    const isTopConcernOily = topConcernKey && ['acne', 'oiliness', 'large-pores'].includes(topConcernKey);
    const isTopConcernDry = topConcernKey && ['dryness', 'redness', 'aging'].includes(topConcernKey);
    
    // Also check all concerns for secondary checks and reasoning messages (but prioritize #1 concern)
    const primaryConcerns = this.responses.primaryConcerns || [];
    const normalizedConcerns = primaryConcerns.map(c => this.normalizeString(c));
    const hasAcneConcern = normalizedConcerns.includes('acne');
    const hasOilinessConcern = normalizedConcerns.includes('oiliness');
    const hasOilyConcerns = hasAcneConcern || hasOilinessConcern;
    const hasDrynessConcern = normalizedConcerns.includes('dryness');

    // Skin type match (25 points) - case-insensitive
    // BUT: Don't give full bonus if concerns contradict product's skin type target
    // CONCERN-BASED OVERRIDE: Concerns (acne/oiliness) override skin type matching
    if (normalizedSkinTypes.includes(normalizedSkinType) || normalizedSkinTypes.includes('all')) {
      // Check if product is specifically for a skin type that contradicts user's concerns
      const productSkinTypes = normalizedSkinTypes;
      const isProductForDrySkin = productSkinTypes.includes('dry') && !productSkinTypes.includes('oily') && 
                                  !productSkinTypes.includes('combination') && !productSkinTypes.includes('all');
      const isProductForOilySkin = productSkinTypes.includes('oily') && !productSkinTypes.includes('dry') && 
                                   !productSkinTypes.includes('combination') && !productSkinTypes.includes('all');
      
      // PRIORITY-BASED OVERRIDE: Use #1 concern to determine if product skin type contradicts user's needs
      // IF #1 concern is acne/oiliness → Penalize dry-skin products
      // IF #1 concern is dryness → Penalize oily-skin products (but don't penalize dry-skin products even if acne is secondary)
      if (isTopConcernOily && isProductForDrySkin) {
        // #1 concern is oily-type but product is for dry skin - reduce bonus significantly
        score += 8; // Much reduced bonus (was 25, now 8) when #1 concern contradicts product skin type
        reasoning.push(`Product matches your skin type, but is formulated for dry skin, which may not be ideal for your ${hasAcneConcern ? 'acne-prone' : 'oily'} skin.`);
      } else if (isTopConcernDry && isProductForOilySkin) {
        // #1 concern is dryness but product is for oily skin - reduce bonus
        score += 10; // Reduced bonus when #1 concern contradicts product skin type
        reasoning.push(`Product matches your skin type, but is formulated for oily skin, which may not provide enough hydration for your dry skin.`);
      } else {
        // Normal skin type match bonus (no contradiction between #1 concern and product skin type)
      score += 25;
        reasoning.push(`Perfect match for your '${this.profile.skinType}' skin type.`);
      }
    }

    // Concern relevance (35 points) - case-insensitive
    // PHASE 2.6: Use priority weighting for concerns
    // PHASE 2.1: Can be relaxed in Pass 3 (ignoreSecondaryConcerns option)
    const concernsToUse = options.ignoreSecondaryConcerns && this.concerns.length > 1
      ? this.concerns.filter((c, index) => {
          // Sort by priority and keep only higher priority concerns
          const sorted = [...this.concerns].sort((a, b) => b.priorityScore - a.priorityScore);
          // Remove lowest priority concern
          return c.concern !== sorted[sorted.length - 1].concern;
        })
      : this.concerns;
    
    const normalizedProductConcerns = product.concernsAddressed.map(c => this.normalizeString(c));
    
    // Calculate weighted concern score based on priority
    let totalPriorityScore = 0;
    let matchedPriorityScore = 0;
    
    concernsToUse.forEach((concern) => {
      const normalizedConcern = this.normalizeString(concern.concern);
      const priorityScore = concern.priorityScore || 1.0;
      totalPriorityScore += priorityScore;
      
      if (normalizedProductConcerns.includes(normalizedConcern)) {
        matchedPriorityScore += priorityScore;
      }
    });
    
    if (matchedPriorityScore > 0 && totalPriorityScore > 0) {
      // Weight concern score by priority: higher priority concerns get more weight
      const concernScore = (matchedPriorityScore / totalPriorityScore) * 35;
      score += concernScore;
      
      // Build reasoning for matched concerns
      const matchedConcerns = concernsToUse.filter((concern) => {
        const normalizedConcern = this.normalizeString(concern.concern);
        return normalizedProductConcerns.includes(normalizedConcern);
      });
      
      if (matchedConcerns.length > 0) {
        const concernNames = matchedConcerns.map(c => c.name || c.concern).join(', ');
        reasoning.push(`Targets your ${matchedConcerns.length > 1 ? 'concerns' : 'concern'}: ${concernNames}.`);
      }
    }

    // Ingredient match (20 points) - case-insensitive
    const preferredIngredients = this.getPreferredIngredients().map(ing => this.normalizeString(ing));
    const normalizedProductIngredients = product.keyIngredients.map(ing => this.normalizeString(ing));
    const ingredientMatches = normalizedProductIngredients.filter((ing) => 
      preferredIngredients.includes(ing)
    );
    if (ingredientMatches.length > 0 && preferredIngredients.length > 0) {
      score += Math.min((ingredientMatches.length / preferredIngredients.length) * 20, 20);
      // Format ingredient names for display (capitalize first letter, replace hyphens)
      const ingredientNames = ingredientMatches.map(ing => 
        ing.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      ).join(', ');
      reasoning.push(`Contains key ingredients: ${ingredientNames}.`);
    }

    // Sensitivity compatibility (10 points)
    const normalizedSensitivity = this.normalizeString(this.profile.sensitivity);
    if (normalizedSensitivity === 'very' || normalizedSensitivity === 'somewhat') {
      if (product.sensitivitySafe) {
        score += 10;
        reasoning.push('Formulated for sensitive skin - free from common irritants.');
      } else {
        score -= 15; // Penalty for non-safe products
        reasoning.push('May contain ingredients that could irritate sensitive skin.');
      }
    } else {
      score += 5; // Neutral bonus
    }

    // Define normalizedProductPrefs early for use in multiple sections
    const normalizedProductPrefs = product.preferences.map(p => this.normalizeString(p));

    // ===== CONDITIONAL LOGIC: FACIAL HAIR REMOVAL =====
    // If user removes facial hair, prioritize products based on method and frequency
    const facialHairMethod = this.normalizeString(this.profile.facialHairRemovalMethod || '');
    const facialHairFrequency = this.normalizeString(this.profile.facialHairRemovalFrequency || '');
    
    if (facialHairMethod) {
      // Shaving logic (most common, needs soothing ingredients and avoids irritants)
      if (facialHairMethod === 'shaving') {
        const isFrequent = facialHairFrequency === 'daily' || facialHairFrequency === '2-3x-week';
        
        // Check for soothing ingredients (good for shaved skin)
        const soothingIngredients = ['centella', 'allantoin', 'aloe-vera', 'chamomile', 'green-tea', 'niacinamide'];
        const hasSoothingIngredients = normalizedProductIngredients.some(ing => 
          soothingIngredients.some(soothing => ing.includes(soothing) || soothing.includes(ing))
        );
        if (hasSoothingIngredients) {
          score += isFrequent ? 7 : 5; // Higher bonus for frequent shaving
          reasoning.push(`Contains soothing ingredients perfect for ${isFrequent ? 'frequent' : 'regular'} shaving.`);
        }
        
        // Penalty for common irritants (bad for shaved skin)
        const irritants = ['alcohol', 'denatured-alcohol', 'ethanol', 'high-alcohol', 'astringent'];
        const hasIrritants = normalizedProductIngredients.some(ing => 
          irritants.some(irritant => ing.includes(irritant) || irritant.includes(ing))
        );
        if (hasIrritants) {
          score -= isFrequent ? 12 : 8; // Higher penalty for frequent shaving
        }
      }
      
      // Waxing/Threading logic (needs calming and barrier repair)
      if (facialHairMethod === 'waxing' || facialHairMethod === 'threading') {
        const calmingIngredients = ['centella', 'aloe-vera', 'chamomile', 'niacinamide', 'green-tea'];
        const barrierRepairIngredients = ['ceramides', 'hyaluronic-acid', 'squalane', 'allantoin'];
        
        const hasCalming = normalizedProductIngredients.some(ing => 
          calmingIngredients.some(calming => ing.includes(calming) || calming.includes(ing))
        );
        const hasBarrierRepair = normalizedProductIngredients.some(ing => 
          barrierRepairIngredients.some(repair => ing.includes(repair) || repair.includes(ing))
        );
        
        if (hasCalming) {
          score += 3;
          reasoning.push('Contains calming ingredients ideal for post-waxing/threading care.');
        }
        if (hasBarrierRepair) {
          score += 3;
          reasoning.push('Helps repair skin barrier after hair removal.');
        }
      }
      
      // Laser logic (needs sensitive skin products)
      if (facialHairMethod === 'laser') {
        const sensitiveSkinIngredients = ['centella', 'niacinamide', 'allantoin', 'aloe-vera'];
        const hasSensitiveSkin = normalizedProductIngredients.some(ing => 
          sensitiveSkinIngredients.some(sensitive => ing.includes(sensitive) || sensitive.includes(ing))
        );
        if (hasSensitiveSkin) {
          score += 3;
          reasoning.push('Gentle formula suitable for post-laser treatment.');
        }
        if (product.sensitivitySafe) {
          score += 2;
        }
      }
    }

    // ===== CONDITIONAL LOGIC: HEAVY MAKEUP USE =====
    // If user wears heavy makeup, prioritize double cleansing and non-comedogenic products
    const makeupType = this.normalizeString(this.profile.makeupType || '');
    
    if (makeupType === 'heavy') {
      // Get product category (normalized)
      const normalizedProductCategory = this.normalizeCategory(product.category);
      
      // Double cleansing products (oil cleansers, balm cleansers)
      const isCleanser = normalizedProductCategory === 'cleanser';
      const productNameLower = (product.name || '').toLowerCase();
      const isOilCleanser = isCleanser && (
        normalizedProductPrefs.includes('oil-based') || 
        productNameLower.includes('oil') ||
        productNameLower.includes('balm')
      );
      
      if (isOilCleanser) {
        score += 5; // Strong bonus for double cleansing products
        reasoning.push('Excellent for removing heavy makeup with double cleansing.');
      } else if (isCleanser) {
        score += 2; // Small bonus for any cleanser
      }
      
      // Non-comedogenic products
      if (normalizedProductPrefs.includes('non-comedogenic')) {
        score += 3;
        reasoning.push('Non-comedogenic formula won\'t clog pores from makeup buildup.');
      }
      
      // Pore-clearing ingredients (good for makeup removal)
      const poreClearingIngredients = ['salicylic-acid', 'niacinamide', 'clay', 'charcoal'];
      const hasPoreClearing = normalizedProductIngredients.some(ing => 
        poreClearingIngredients.some(pore => ing.includes(pore) || pore.includes(ing))
      );
      if (hasPoreClearing) {
        score += 3;
        reasoning.push('Contains pore-clearing ingredients to prevent makeup-related breakouts.');
      }
    } else if (makeupType === 'medium') {
      // Medium makeup users also benefit from good cleansing
      const normalizedProductCategory = this.normalizeCategory(product.category);
      const isCleanser = normalizedProductCategory === 'cleanser';
      if (isCleanser && normalizedProductPrefs.includes('non-comedogenic')) {
        score += 2;
        reasoning.push('Non-comedogenic cleanser ideal for makeup wearers.');
      }
    }

    // ===== CONDITIONAL LOGIC: STRESS-RELATED SKIN ISSUES =====
    // If user has stress-related skin issues, prioritize calming and barrier repair ingredients
    // Coerce to array to avoid runtime errors if single value or unexpected type
    const stressIssuesRaw = this.profile.stressSkinIssues;
    const stressSkinIssues = (Array.isArray(stressIssuesRaw) ? stressIssuesRaw : (stressIssuesRaw ? [stressIssuesRaw] : []))
      .filter(issue => issue !== 'none')
      .map(issue => this.normalizeString(issue));
    
    if (stressSkinIssues.length > 0) {
      // Breakouts from stress
      if (stressSkinIssues.includes('breakouts')) {
        const acneFightingIngredients = ['salicylic-acid', 'benzoyl-peroxide', 'niacinamide', 'retinol'];
        const hasAcneFighting = normalizedProductIngredients.some(ing => 
          acneFightingIngredients.some(acne => ing.includes(acne) || acne.includes(ing))
        );
        if (hasAcneFighting) {
          score += 3;
          reasoning.push('Contains acne-fighting ingredients to address stress-related breakouts.');
        }
      }
      
      // Inflammation/Redness from stress
      if (stressSkinIssues.includes('inflammation')) {
        const calmingIngredients = ['centella', 'niacinamide', 'green-tea', 'chamomile', 'aloe-vera'];
        const barrierRepairIngredients = ['ceramides', 'hyaluronic-acid', 'squalane', 'allantoin'];
        
        const hasCalming = normalizedProductIngredients.some(ing => 
          calmingIngredients.some(calming => ing.includes(calming) || calming.includes(ing))
        );
        const hasBarrierRepair = normalizedProductIngredients.some(ing => 
          barrierRepairIngredients.some(repair => ing.includes(repair) || repair.includes(ing))
        );
        
        if (hasCalming) {
          score += 5; // Strong bonus for calming ingredients
          reasoning.push('Contains calming ingredients to reduce stress-related inflammation and redness.');
        }
        if (hasBarrierRepair) {
          score += 3; // Bonus for barrier repair
          reasoning.push('Helps repair skin barrier damaged by stress.');
        }
      }
      
      // Dryness from stress
      if (stressSkinIssues.includes('dryness')) {
        const barrierRepairIngredients = ['ceramides', 'hyaluronic-acid', 'squalane', 'allantoin', 'glycerin'];
        const hydratingIngredients = ['hyaluronic-acid', 'glycerin', 'squalane', 'urea'];
        
        const hasBarrierRepair = normalizedProductIngredients.some(ing => 
          barrierRepairIngredients.some(repair => ing.includes(repair) || repair.includes(ing))
        );
        const hasHydrating = normalizedProductIngredients.some(ing => 
          hydratingIngredients.some(hydrating => ing.includes(hydrating) || hydrating.includes(ing))
        );
        
        if (hasBarrierRepair) {
          score += 3;
          reasoning.push('Helps restore moisture barrier affected by stress.');
        }
        if (hasHydrating) {
          score += 3;
          reasoning.push('Provides intense hydration for stress-related dryness.');
        }
      }
    }

    // ===== SCENT PREFERENCE MATCHING =====
    const scentPreferences = Array.isArray(this.profile.scentPreference) 
      ? this.profile.scentPreference 
      : (this.profile.scentPreference ? [this.profile.scentPreference] : []);
    
    if (scentPreferences.length === 0) {
      // No scent preference specified, skip scoring
    } else {
      // Check for contradictions: unscented + any scented option
      const hasUnscented = scentPreferences.includes('unscented');
      const hasScented = scentPreferences.some(p => p !== 'unscented' && p !== 'no-preference');
      const hasNoPreference = scentPreferences.includes('no-preference');
      
      // Handle contradictions: if unscented is selected with scented options, prioritize unscented
      const activePreferences = hasUnscented && hasScented 
        ? ['unscented'] // Contradiction: prioritize unscented (more restrictive)
        : scentPreferences.filter(p => p !== 'no-preference'); // Remove no-preference for scoring
      
      // If only "no-preference" is selected, don't apply scent scoring (any scent is fine)
      if (activePreferences.length === 0 && hasNoPreference) {
        // User has no preference - don't apply scent scoring, but also don't penalize
      } else if (activePreferences.length > 0) {
        // Check product preferences for scent-related tags
        const scentTags = {
          'unscented': ['fragrance-free', 'unscented', 'no-fragrance'],
          'citrus': ['citrus', 'lemon', 'orange', 'grapefruit'],
          'floral': ['floral', 'rose', 'lavender', 'jasmine'],
          'woody-spicy': ['woody', 'spicy', 'sandalwood', 'cedar'],
          'fresh': ['fresh', 'clean', 'mint', 'eucalyptus'],
        };
        
        const scentLabels = {
          'unscented': 'fragrance-free',
          'citrus': 'citrus',
          'floral': 'floral',
          'woody-spicy': 'woody/spicy',
          'fresh': 'fresh/clean'
        };
        
        // Calculate base weightage: reduce when multiple preferences selected
        // Single preference: 3 points, Multiple: 3 / number of preferences (minimum 1 point per match)
        const baseWeightage = activePreferences.length === 1 ? 3 : Math.max(1, 3 / activePreferences.length);
        
        // Check if product matches any of the user's preferences
        let matchedPreferences = [];
        for (const preference of activePreferences) {
          const normalizedPreference = this.normalizeString(preference);
          const userScentTags = scentTags[normalizedPreference] || [];
          const productHasScentTag = userScentTags.some(tag => 
            normalizedProductPrefs.some(pref => pref.includes(tag) || tag.includes(pref))
          );
          
          if (productHasScentTag) {
            matchedPreferences.push(preference);
          }
        }
        
        // Apply scoring: reduce weightage for multiple selections, cap at 3 points total
        if (matchedPreferences.length > 0) {
          // Calculate score: base weightage per match, but cap total at 3 points
          const matchScore = Math.min(3, matchedPreferences.length * baseWeightage);
          score += matchScore;
          
          // Build reasoning message
          if (matchedPreferences.length === 1) {
            reasoning.push(`Matches your preferred ${scentLabels[matchedPreferences[0]] || 'scent'} profile.`);
          } else {
            const matchedLabels = matchedPreferences.map(p => scentLabels[p] || p).join(', ');
            reasoning.push(`Matches your preferred scent profiles: ${matchedLabels}.`);
          }
        }
      }
    }

    // ===== TEXTURE MATCHING (AGE + SKIN TYPE MATRIX) =====
    // Match product texture to preferred texture based on Age + Skin Type
    // IMPORTANT: Texture matching is now weighted more heavily than rating (18-20 points vs 10 points)
    // Uses topConcern, isTopConcernOily, isTopConcernDry, hasAcneConcern, hasOilyConcerns (already declared above)
    const preferredTextures = this.profile.preferredTexture || [];
    const normalizedProductTexture = product.texture ? this.normalizeString(product.texture) : null;
    
    if (normalizedProductTexture && preferredTextures.length > 0) {
      // Check if product texture matches preferred textures
      const normalizedPreferredTextures = preferredTextures.map(t => this.normalizeString(t));
      const isTextureMatch = normalizedPreferredTextures.includes(normalizedProductTexture);
      
      if (isTextureMatch) {
        // SIGNIFICANTLY INCREASED BONUS: Texture match is now 18-20 points (more than rating)
        // This ensures texture preference outweighs minor rating differences
        score += 18;
        const textureLabels = {
          'gel': 'lightweight gel',
          'lightweight': 'lightweight',
          'gel-cream': 'gel-cream',
          'cream': 'cream',
          'rich-cream': 'rich cream',
          'balm': 'balm'
        };
        reasoning.push(`Ideal ${textureLabels[normalizedProductTexture] || normalizedProductTexture} texture for your skin.`);
      } else {
        // TEXTURE MISMATCH PENALTY: If texture doesn't match preferred textures
        // Penalty is stronger if concerns suggest the texture is wrong (e.g., cream for oily/acne)
        const isHeavyTexture = ['cream', 'rich-cream', 'balm'].includes(normalizedProductTexture);
        const prefersLightTexture = normalizedPreferredTextures.some(t => 
          ['lightweight', 'gel', 'gel-cream'].includes(t)
        );
        const isLightTexture = ['lightweight', 'gel', 'gel-cream'].includes(normalizedProductTexture);
        const prefersHeavyTexture = normalizedPreferredTextures.some(t => 
          ['cream', 'rich-cream', 'balm'].includes(t)
        );
        
        // PRIORITY-BASED TEXTURE PENALTY: Use #1 concern to determine penalty severity
        // IF #1 concern is acne/oiliness → Penalize heavy creams strongly
        // IF #1 concern is dryness → Do NOT penalize heavy creams (even if acne is secondary)
        if (isTopConcernOily && isHeavyTexture) {
          // #1 concern is oily-type and product is heavy texture - large penalty
          score -= 15; // Large penalty: recommending cream/rich-cream when #1 concern is acne/oily
          reasoning.push(`Texture may be too heavy for your ${hasAcneConcern ? 'acne-prone' : 'oily'} skin.`);
        } else if (isTopConcernDry && isLightTexture && prefersHeavyTexture) {
          // #1 concern is dryness but product is light texture when heavy is preferred - moderate penalty
          score -= 8; // Moderate penalty: light texture may not provide enough hydration for dry skin
          reasoning.push(`Lightweight texture may not provide enough hydration for your dry skin.`);
        } else if (isHeavyTexture && prefersLightTexture && !isTopConcernDry) {
          // Heavy texture when light preferred, but #1 concern is NOT dryness - penalty
          score -= 10; // Penalty for texture mismatch (heavy when light preferred, unless #1 concern is dryness)
        } else if (isLightTexture && prefersHeavyTexture && !isTopConcernOily) {
          // Light texture when heavy preferred, but #1 concern is NOT oily - smaller penalty
          score -= 5; // Smaller penalty (light texture is generally more versatile, unless #1 concern is oily)
        } else {
          score -= 5; // General texture mismatch penalty
        }
      }
    } else if (!normalizedProductTexture) {
      // Neutral fallback: Missing texture tag gets neutral score (not penalized)
      score += 2; // Small neutral bonus instead of 0
    }
    
    // PRIORITY-BASED SKIN TYPE MISMATCH PENALTY
    // Use #1 concern to determine if product skin type contradicts user's primary need
    // IF #1 concern is acne/oiliness → Penalize dry-skin products
    // IF #1 concern is dryness → Penalize oily-skin products (but don't penalize dry-skin products even if acne is secondary)
    if (isTopConcernOily) {
      const productSkinTypes = normalizedSkinTypes.map(st => this.normalizeString(st));
      const isForDrySkin = productSkinTypes.includes('dry') && !productSkinTypes.includes('oily') && 
                          !productSkinTypes.includes('combination') && !productSkinTypes.includes('all');
      
      if (isForDrySkin) {
        score -= 15; // Large penalty: recommending dry-skin products when #1 concern is acne/oily
        reasoning.push(`Product is formulated for dry skin, which may not be ideal for your ${hasAcneConcern ? 'acne-prone' : 'oily'} skin.`);
      }
    }
    
    // Reverse: If #1 concern is dryness, penalize oily-skin products (but NOT dry-skin products)
    if (isTopConcernDry) {
      const productSkinTypes = normalizedSkinTypes.map(st => this.normalizeString(st));
      const isForOilySkin = productSkinTypes.includes('oily') && !productSkinTypes.includes('dry') && 
                           !productSkinTypes.includes('combination') && !productSkinTypes.includes('all');
      
      if (isForOilySkin) {
        score -= 10; // Penalty: recommending oily-skin products when #1 concern is dryness
        reasoning.push(`Product is formulated for oily skin, which may not provide enough hydration for your dry skin.`);
      }
      // Note: We do NOT penalize dry-skin products here, even if user has secondary acne concerns
      // The #1 concern (dryness) takes priority, and barrier-repair creams are needed
    }

    // ===== SUBCATEGORY MATCHING (FOR EYE CARE AND OTHER CATEGORIES) =====
    // Match product subcategory to preferred subcategory based on texture and concern preferences
    const normalizedProductCategory = this.normalizeCategory(product.category);
    const normalizedProductSubCategory = product.subCategory ? this.normalizeString(product.subCategory) : null;
    
    // For eye_cream category, prefer lighter subcategories (eye-serum) for lighter textures
    if (normalizedProductCategory === 'eye_cream') {
      const preferredTextures = this.profile.preferredTexture || [];
      const hasLightTexture = preferredTextures.some(t => 
        ['gel', 'lightweight'].includes(this.normalizeString(t))
      );
      const hasHeavyTexture = preferredTextures.some(t => 
        ['cream', 'rich-cream', 'balm'].includes(this.normalizeString(t))
      );
      
      // If user prefers light textures, bonus for eye-serum subcategory
      if (hasLightTexture && normalizedProductSubCategory && 
          (normalizedProductSubCategory.includes('serum') || normalizedProductSubCategory.includes('essence'))) {
        score += 5; // Bonus for matching subcategory preference
        reasoning.push('Lightweight eye serum formula matches your skin texture preferences.');
      }
      // If user prefers heavy textures, bonus for eye-cream subcategory
      else if (hasHeavyTexture && normalizedProductSubCategory && 
               normalizedProductSubCategory.includes('cream')) {
        score += 5; // Bonus for matching subcategory preference
        reasoning.push('Rich eye cream formula matches your skin texture preferences.');
      }
      // If product texture matches but subcategory doesn't, small penalty
      else if (normalizedProductSubCategory && normalizedProductTexture) {
        const isSerum = normalizedProductSubCategory.includes('serum') || normalizedProductSubCategory.includes('essence');
        const isCream = normalizedProductSubCategory.includes('cream');
        const isLightTexture = ['gel', 'lightweight'].includes(normalizedProductTexture);
        const isHeavyTexture = ['cream', 'rich-cream', 'balm'].includes(normalizedProductTexture);
        
        // Mismatch: serum subcategory with heavy texture, or cream subcategory with light texture
        if ((isSerum && isHeavyTexture) || (isCream && isLightTexture)) {
          score -= 3; // Small penalty for texture/subcategory mismatch
        }
      }
    }

    // ===== CLIMATE SUITABILITY SCORING (PHASE 2.4) =====
    // Match product climate suitability to user's climate
    const userClimate = this.normalizeString(this.profile.climate || '');
    const productClimates = (product.climateSuitability || []).map(c => this.normalizeString(c));
    
    // Check if product is suitable for user's climate
    // Empty array or "all" means suitable for all climates
    if (productClimates.length === 0 || productClimates.includes('all') || productClimates.includes(userClimate)) {
      score += 5; // Bonus for climate match
      if (userClimate) {
        const climateLabels = {
          'hot-humid': 'hot & humid',
          'hot-dry': 'hot & dry',
          'cold-dry': 'cold & dry',
          'temperate': 'temperate',
          'varied': 'varied'
        };
        reasoning.push(`Suitable for your ${climateLabels[userClimate] || userClimate} climate.`);
      }
    }

    // ===== PRODUCT RATING SCORING (PHASE 2.5) =====
    // Add product rating to score (normalize to 0-10 points, assuming 5-star scale)
    // Handle rating as number, string, or null/undefined
    const ratingValue = product.rating != null ? parseFloat(product.rating) : null;
    if (ratingValue && !isNaN(ratingValue) && ratingValue > 0) {
      // Normalize rating to 0-10 points (assuming 5-star scale)
      // rating 5.0 → 10 points, rating 4.5 → 9 points, rating 3.0 → 6 points
      const ratingScore = (ratingValue / 5) * 10;
      score += Math.min(ratingScore, 10); // Cap at 10 points
      if (ratingValue >= 4.5) {
        reasoning.push(`Highly rated product (${ratingValue.toFixed(1)}/5 stars).`);
      } else if (ratingValue >= 4.0) {
        reasoning.push(`Well-reviewed product (${ratingValue.toFixed(1)}/5 stars).`);
      }
    }

    // ===== SOFT CONSTRAINTS (PREFERENCES) - PENALTY/BONUS SYSTEM =====
    // PHASE 2.1: Can be relaxed in Pass 2 (ignorePreferences option)
    if (!options.ignorePreferences) {
      const normalizedProfilePrefs = (this.profile.preferences || []).filter(p => p !== 'none').map(p => this.normalizeString(p));
      
      if (normalizedProfilePrefs.length > 0) {
        // Count matches and mismatches
        const prefMatches = normalizedProfilePrefs.filter((pref) => 
          normalizedProductPrefs.includes(pref)
        );
        const prefMismatches = normalizedProfilePrefs.filter((pref) => 
          !normalizedProductPrefs.includes(pref)
        );

        // Bonus for matching preferences: +5 points per match
    if (prefMatches.length > 0) {
          score += Math.min(prefMatches.length * 5, 15); // Cap at 15 points for preferences
          const prefLabels = {
            'vegan': 'vegan',
            'cruelty-free': 'cruelty-free',
            'organic': 'organic',
            'fragrance-free': 'fragrance-free',
            'non-comedogenic': 'non-comedogenic',
            'oil-free': 'oil-free',
            'sulfate-free': 'sulfate-free',
            'paraben-free': 'paraben-free'
          };
          const matchedPrefNames = prefMatches.map(p => prefLabels[p] || p).join(', ');
          reasoning.push(`Matches your preferences: ${matchedPrefNames}.`);
        }

        // Penalty for mismatched preferences: -10 points per mismatch (but not disqualified)
        if (prefMismatches.length > 0) {
          score -= Math.min(prefMismatches.length * 10, 30); // Cap penalty at 30 points
        }
      }
    }

    // Penalty for avoided ingredients (from concerns) - case-insensitive
    const avoidIngredients = Array.from(this.getAvoidIngredients()).map(ing => this.normalizeString(ing));
    const hasAvoidIngredients = normalizedProductIngredients.some((ing) => 
      avoidIngredients.includes(ing)
    );
    if (hasAvoidIngredients) {
      score -= 20;
      const foundAvoidIngredients = normalizedProductIngredients.filter(ing => avoidIngredients.includes(ing));
      reasoning.push(`Contains ingredients that may not be ideal for your concerns: ${foundAvoidIngredients.join(', ')}.`);
    }

    // ===== BUDGET-BASED SCORING =====
    // Soft scoring based on user's budget preference (not a hard constraint)
    const userBudget = this.responses.budget;
    if (userBudget) {
      // Get product price (handle both 'price' and 'mrp' fields)
      const productPrice = product.mrp || product.price || 0;
      
      const normalizedBudget = this.normalizeString(userBudget);
      
      if (normalizedBudget === 'low') {
        // Low budget: prefer products under ₹1,000, avoid products over ₹2,000
        if (productPrice > 2000) {
          score -= 10; // Moderate penalty, don't kill the match
          reasoning.push('Above your preferred price range.');
        } else if (productPrice < 1000) {
          score += 10; // Bonus for budget-friendly products
          reasoning.push('Fits your budget perfectly.');
        }
      } else if (normalizedBudget === 'medium') {
        // Medium budget: prefer products between ₹1,000-₹2,500
        if (productPrice > 3000) {
          score -= 5; // Slight penalty for very expensive products
          reasoning.push('Above your preferred price range.');
        } else if (productPrice >= 1000 && productPrice <= 2500) {
          score += 5; // Bonus for products in preferred range
          reasoning.push('Fits your budget range well.');
        }
      } else if (normalizedBudget === 'high') {
        // High budget: slight preference for premium products (₹2,500+), but don't penalize cheap products
        if (productPrice > 2500) {
          score += 5; // Slight preference for premium formulations
          reasoning.push('Premium product within your budget.');
        }
        // Note: Do not penalize cheap products for high-budget users
        // (High budget users often buy cheap cleansers)
      }
    }

    // Ensure score is within bounds
    const finalScore = Math.max(0, Math.min(score, maxScore));
    
    // If no reasoning was added, add a generic one
    if (reasoning.length === 0) {
      reasoning.push('This product is a good match for your skin profile.');
    }
    
    return { score: finalScore, reasoning };
  }

  // Check if all required categories have products with minimum score
  validateRecommendations(recommendations, requiredCategories, minScore = 20) {
    const missingCategories = [];
    const lowScoreCategories = [];
    
    requiredCategories.forEach((category) => {
      const normalizedCategory = this.normalizeCategory(category);
      const categoryKey = Object.keys(recommendations).find(
        key => this.normalizeCategory(key) === normalizedCategory
      );
      
      if (!categoryKey || !recommendations[categoryKey] || recommendations[categoryKey].length === 0) {
        missingCategories.push(category);
      } else {
        // Check if top product has minimum score
        const topProduct = recommendations[categoryKey][0];
        // Handle both old format (just score) and new format (score object)
        const productScore = typeof topProduct.score === 'object' ? topProduct.score.score : topProduct.score;
        if (productScore < minScore) {
          lowScoreCategories.push(category);
        }
      }
    });
    
    return {
      isValid: missingCategories.length === 0 && lowScoreCategories.length === 0,
      missingCategories,
      lowScoreCategories,
    };
  }

  // Helper function: 3-Slot Tiered Selection Logic
  // Attempt 1: Score ≥ highThreshold (default 50) - High Quality
  // Attempt 2: If < maxProducts, add products with Score ≥ fallbackThreshold (default 30) - Fallback
  // Attempt 3: If still < maxProducts, add any remaining products - Best Available
  selectTopProductsWithTieredLogic(categoryProducts, maxProducts = 3, thresholds = {}) {
    if (!categoryProducts || categoryProducts.length === 0) {
      return [];
    }

    // Default thresholds: 50 for high, 30 for fallback
    const highThreshold = thresholds.highThreshold || 50;
    const fallbackThreshold = thresholds.fallbackThreshold || 30;

    // Sort by score (descending) - already sorted, but ensure it
    const sortedProducts = [...categoryProducts].sort((a, b) => {
      const scoreA = typeof a.score === 'object' ? a.score.score : a.score;
      const scoreB = typeof b.score === 'object' ? b.score.score : b.score;
      return scoreB - scoreA;
    });

    let selectedProducts = [];

    // Attempt 1: High Quality (Score ≥ highThreshold)
    const highQualityProducts = sortedProducts.filter(p => {
      const productScore = typeof p.score === 'object' ? p.score.score : p.score;
      return productScore >= highThreshold;
    });
    
    if (highQualityProducts.length >= maxProducts) {
      // We have enough high-quality products
      return highQualityProducts.slice(0, maxProducts);
    }
    
    selectedProducts = [...highQualityProducts];

    // Attempt 2: Fallback (Score ≥ fallbackThreshold and < highThreshold)
    if (selectedProducts.length < maxProducts) {
      const fallbackProducts = sortedProducts.filter(p => {
        const productScore = typeof p.score === 'object' ? p.score.score : p.score;
        return productScore >= fallbackThreshold && productScore < highThreshold;
      });
      
      // Add fallback products until we reach maxProducts or run out
      const remainingSlots = maxProducts - selectedProducts.length;
      selectedProducts = [...selectedProducts, ...fallbackProducts.slice(0, remainingSlots)];
    }

    // Attempt 3: Best Available (any remaining products with score < fallbackThreshold)
    if (selectedProducts.length < maxProducts) {
      const remainingProducts = sortedProducts.filter(p => {
        const productScore = typeof p.score === 'object' ? p.score.score : p.score;
        return productScore < fallbackThreshold && productScore > 0; // Still filter out negative/disqualified products
      });
      
      const remainingSlots = maxProducts - selectedProducts.length;
      const bestAvailableProducts = remainingProducts.slice(0, remainingSlots).map(p => ({
        ...p,
        bestAvailableMatches: true // Flag for UI badge
      }));
      
      selectedProducts = [...selectedProducts, ...bestAvailableProducts];
    }

    // Ensure all Attempt 3 products have the flag
    selectedProducts = selectedProducts.map(p => {
      const productScore = typeof p.score === 'object' ? p.score.score : p.score;
      if (productScore < fallbackThreshold && productScore > 0) {
        return { ...p, bestAvailableMatches: true };
      }
      return p;
    });

    return selectedProducts;
  }

  // Generate product recommendations with multi-pass system
  async recommendProducts(products) {
    const requiredCategories = this.getRequiredCategories();
    const recommendations = {};
    const notices = [];

    // Validate and filter products first
    const validProducts = products.filter(product => this.validateProduct(product));
    
    if (validProducts.length === 0) {
      console.warn('⚠️ No valid products found after validation');
      return { recommendations, notices };
    }

    // ===== PASS 1: PERFECT MATCH =====
    // Run scoring with ALL constraints (hard, soft, preferences)
    let scoredProducts = validProducts
      .map((product) => {
        const result = this.calculateProductScore(product);
        return {
      ...product,
          score: result.score,
          reasoning: result.reasoning, // PHASE 3.1: Store reasoning with product
        };
      })
      .filter(p => p.score > 0); // Only include products with positive scores (excludes -999 disqualified products)

    // Select best products for each category
    requiredCategories.forEach((category) => {
      const normalizedCategory = this.normalizeCategory(category);
      const categoryProducts = scoredProducts
        .filter((p) => {
          const normalizedProductCategory = this.normalizeCategory(p.category);
          return normalizedProductCategory === normalizedCategory && p.inStock === true;
        })
        .sort((a, b) => {
          // Sort by score only (highest first) - price should not affect recommendations
          return b.score - a.score;
        });

      if (categoryProducts.length > 0) {
        // Use 3-slot tiered logic: Attempt 1 (≥50), Attempt 2 (≥30), Attempt 3 (any)
        recommendations[category] = this.selectTopProductsWithTieredLogic(categoryProducts, 3);
      }
    });

    // Validate Pass 1 results
    const validation = this.validateRecommendations(recommendations, requiredCategories, 20);
    
    if (validation.isValid) {
      // Perfect match! Return recommendations
      return { recommendations, notices };
    }

    // ===== PASS 2: RELAX PREFERENCES =====
    // Temporarily ignore preferences scoring
    // Build detailed notice explaining which preferences were relaxed and why
    const userPreferences = (this.profile.preferences || []).filter(p => p !== 'none');
    if (userPreferences.length > 0) {
      const preferenceLabels = {
        'vegan': 'Vegan',
        'cruelty-free': 'Cruelty-Free',
        'organic': 'Organic',
        'fragrance-free': 'Fragrance-Free',
        'non-comedogenic': 'Non-Comedogenic',
        'oil-free': 'Oil-Free',
        'sulfate-free': 'Sulfate-Free',
        'paraben-free': 'Paraben-Free'
      };
      const preferenceNames = userPreferences.map(p => preferenceLabels[p] || p).join(', ');
      const sensitivity = this.profile.sensitivity === 'very' || this.profile.sensitivity === 'somewhat' 
        ? 'very sensitive' 
        : 'sensitive';
      notices.push(`We couldn't find products that match all your preferences (${preferenceNames}) while also meeting your ${sensitivity} skin needs. We prioritized your skin's safety first.`);
    } else {
      notices.push("We've relaxed some preference constraints to find you the best products.");
    }
    
    // Re-score products without preference penalties/bonuses
    scoredProducts = validProducts
      .map((product) => {
        const result = this.calculateProductScore(product, { ignorePreferences: true });
        return {
          ...product,
          score: result.score,
          reasoning: result.reasoning, // PHASE 3.1: Store reasoning with product
        };
      })
      .filter(p => p.score > 0);

    // Re-select products for missing categories
    validation.missingCategories.forEach((category) => {
      const normalizedCategory = this.normalizeCategory(category);
      const categoryProducts = scoredProducts
        .filter((p) => {
          const normalizedProductCategory = this.normalizeCategory(p.category);
          return normalizedProductCategory === normalizedCategory && p.inStock === true;
        })
        .sort((a, b) => {
          // Sort by score only (highest first) - price should not affect recommendations
          return b.score - a.score;
        });

      if (categoryProducts.length > 0) {
        // Use 3-slot tiered logic: Attempt 1 (≥50), Attempt 2 (≥30), Attempt 3 (any)
        recommendations[category] = this.selectTopProductsWithTieredLogic(categoryProducts, 3);
      }
    });

    // Validate Pass 2 results
    const validation2 = this.validateRecommendations(recommendations, requiredCategories, 20);
    
    if (validation2.isValid) {
      return { recommendations, notices };
    }

    // ===== PASS 3: RELAX SECONDARY CONCERNS =====
    // Remove lowest priority concern from calculation
    if (this.concerns.length > 1) {
      // Build detailed notice explaining which concerns were prioritized and which were saved for Phase 3
      const topConcern = this.concerns[0];
      const secondaryConcerns = this.concerns.slice(1);
      
      const concernLabels = {
        'acne': 'Acne & Breakouts',
        'oiliness': 'Excess Oil & Shine',
        'dryness': 'Dryness',
        'dullness': 'Dullness',
        'aging': 'Aging',
        'pigmentation': 'Pigmentation',
        'texture': 'Texture',
        'wrinkles': 'Wrinkles',
        'dark-circles': 'Dark Circles',
        'large-pores': 'Large Pores',
        'redness': 'Redness',
        'sensitivity': 'Sensitivity'
      };
      
      const topConcernName = concernLabels[topConcern.concern] || topConcern.name || topConcern.concern;
      const secondaryConcernNames = secondaryConcerns
        .map(c => concernLabels[c.concern] || c.name || c.concern)
        .join(', ');
      
      if (secondaryConcerns.length > 0) {
        notices.push(`To focus on your #1 concern (${topConcernName}), we've saved your secondary concerns (${secondaryConcernNames}) for Phase 3: Boosters. This ensures you get the most effective products for your primary need first.`);
      } else {
        notices.push("We're focusing on your primary concerns to ensure you get the best products.");
      }
      
      // Re-score products ignoring secondary concerns (lowest priority)
      scoredProducts = validProducts
        .map((product) => {
          const result = this.calculateProductScore(product, { 
            ignorePreferences: true,
            ignoreSecondaryConcerns: true 
          });
          return {
            ...product,
            score: result.score,
            reasoning: result.reasoning, // PHASE 3.1: Store reasoning with product
          };
        })
        .filter(p => p.score > 0);
      
      // Re-select products for missing categories
      validation2.missingCategories.forEach((category) => {
        const normalizedCategory = this.normalizeCategory(category);
        const categoryProducts = scoredProducts
          .filter((p) => {
            const normalizedProductCategory = this.normalizeCategory(p.category);
            return normalizedProductCategory === normalizedCategory && p.inStock === true;
          })
          .sort((a, b) => {
          // Sort by score only (highest first) - price should not affect recommendations
          return b.score - a.score;
        });

        if (categoryProducts.length > 0) {
        // Use 3-slot tiered logic (lower thresholds for Pass 3: Attempt 1 ≥40, Attempt 2 ≥20, Attempt 3 any)
        const selected = this.selectTopProductsWithTieredLogic(
          categoryProducts, 
          3, 
          { highThreshold: 40, fallbackThreshold: 20 }
        );
        if (selected.length > 0) {
          recommendations[category] = selected;
        }
      }
    });
    }

    // Validate Pass 3 results
    const validation3 = this.validateRecommendations(recommendations, requiredCategories, 15);
    
    if (validation3.isValid) {
      return { recommendations, notices };
    }

    // ===== PASS 4: ESSENTIAL FALLBACK =====
    // For missing critical categories (cleanser, SPF), run minimal scoring
    // Only score based on: Skin Type + Sensitivity
    const criticalCategories = ['cleanser', 'spf'];
    const missingCritical = validation3.missingCategories.filter(cat => 
      criticalCategories.includes(this.normalizeCategory(cat))
    );
    
    if (missingCritical.length > 0) {
      notices.push("We've selected essential products based on your skin type and sensitivity to ensure you have a complete routine.");
      
      missingCritical.forEach((category) => {
        const normalizedCategory = this.normalizeCategory(category);
        const categoryProducts = validProducts
          .filter((p) => {
            const normalizedProductCategory = this.normalizeCategory(p.category);
            return normalizedProductCategory === normalizedCategory && p.inStock === true;
          })
          .map((product) => {
            // Minimal scoring: only skin type + sensitivity
            const result = this.calculateProductScore(product, { minimalScoring: true });
            return {
              ...product,
              score: result.score,
              reasoning: result.reasoning, // PHASE 3.1: Store reasoning with product
            };
          })
          .filter(p => p.score > 0)
          .sort((a, b) => {
          // Sort by score only (highest first) - price should not affect recommendations
          return b.score - a.score;
        });

        if (categoryProducts.length > 0) {
          // Minimum score threshold to ensure quality recommendations
          // Use 3-slot tiered logic (lower thresholds for Pass 4: Attempt 1 ≥40, Attempt 2 ≥20, Attempt 3 any)
          const selected = this.selectTopProductsWithTieredLogic(
            categoryProducts, 
            3, 
            { highThreshold: 40, fallbackThreshold: 20 }
          );
          if (selected.length > 0) {
            recommendations[category] = selected;
          }
        }
      });
    }

    // ===== PASS 5: OPTIONAL CATEGORIES =====
    // Process optional categories (mask, eye-cream, treatment) when conditions are met
    // These should be suggested if they can benefit the user, regardless of being "required"
    // Re-score with full scoring for best results on optional categories
    
    const optionalCategories = ['mask', 'eye-cream', 'eye_cream', 'treatment'];
    const optionalProducts = validProducts
      .filter((p) => {
        const normalizedProductCategory = this.normalizeCategory(p.category);
        return optionalCategories.some(optCat => 
          this.normalizeCategory(optCat) === normalizedProductCategory
        ) && p.inStock === true;
      })
      .map((product) => {
        const result = this.calculateProductScore(product);
        return {
          ...product,
          score: result.score,
          reasoning: result.reasoning,
        };
      })
      .filter(p => p.score > 0); // Only include products with positive scores
    
    // Check if we should add masks
    if (this.shouldShowMask()) {
      const normalizedMaskCategory = 'mask';
      const maskProducts = optionalProducts
        .filter((p) => {
          const normalizedProductCategory = this.normalizeCategory(p.category);
          return normalizedProductCategory === normalizedMaskCategory;
        })
        .sort((a, b) => b.score - a.score); // Sort by score only
      
      if (maskProducts.length > 0) {
        // Filter out products with allergens if user has allergies
        const userAllergies = this.getUserAllergies();
        const safeMaskProducts = maskProducts.filter(product => {
          if (!this.validateProduct(product)) return false;
          if (userAllergies && userAllergies.length > 0 && !userAllergies.includes('none')) {
            if (this.hasAllergyIngredients(product, userAllergies)) {
              return false;
            }
          }
          return true;
        });
        
        if (safeMaskProducts.length > 0) {
          // Use 3-slot tiered logic for optional categories
          // Always use 'mask' as the category key to ensure categorizeProductsByPhase can find it
          const selectedMasks = this.selectTopProductsWithTieredLogic(safeMaskProducts, 3);
          // Only add if we have at least one product (tiered logic might return empty if all scores are 0 or negative)
          if (selectedMasks.length > 0) {
            recommendations['mask'] = selectedMasks;
          }
        }
      }
    }
    
    // Check if we should add eye cream
    if (this.shouldShowEyeCream()) {
      const normalizedEyeCreamCategory = 'eye-cream';
      const eyeCreamProducts = optionalProducts
        .filter((p) => {
          const normalizedProductCategory = this.normalizeCategory(p.category);
          return normalizedProductCategory === normalizedEyeCreamCategory || 
                 normalizedProductCategory === 'eye_cream';
        })
        .sort((a, b) => b.score - a.score); // Sort by score only
      
      if (eyeCreamProducts.length > 0) {
        // Filter out products with allergens if user has allergies
        const userAllergies = this.getUserAllergies();
        const safeEyeCreamProducts = eyeCreamProducts.filter(product => {
          if (!this.validateProduct(product)) return false;
          if (userAllergies && userAllergies.length > 0 && !userAllergies.includes('none')) {
            if (this.hasAllergyIngredients(product, userAllergies)) {
              return false;
            }
          }
          return true;
        });
        
        if (safeEyeCreamProducts.length > 0) {
          // Use 3-slot tiered logic for optional categories
          // Always use 'eye-cream' as the category key to ensure categorizeProductsByPhase can find it
          // Only add if not already present
          if (!recommendations['eye-cream'] && !recommendations['eye_cream']) {
            const selectedEyeCreams = this.selectTopProductsWithTieredLogic(safeEyeCreamProducts, 3);
            // Only add if we have at least one product
            if (selectedEyeCreams.length > 0) {
              recommendations['eye-cream'] = selectedEyeCreams;
            }
          }
        }
      }
    }
    
    // Check if we should add treatment products (retinol, AHA, BHA, etc.)
    // Treatment products are beneficial for: acne, aging, texture, dullness, pigmentation
    const treatmentConcerns = ['acne', 'aging', 'texture', 'dullness', 'pigmentation'];
    const primaryConcerns = this.responses.primaryConcerns || [];
    const hasTreatmentConcern = primaryConcerns.some(concern => 
      treatmentConcerns.some(treatmentConcern => 
        this.normalizeString(concern).includes(treatmentConcern) || 
        treatmentConcern.includes(this.normalizeString(concern))
      )
    );
    
    if (hasTreatmentConcern) {
      const normalizedTreatmentCategory = 'treatment';
      const treatmentProducts = optionalProducts
        .filter((p) => {
          const normalizedProductCategory = this.normalizeCategory(p.category);
          return normalizedProductCategory === normalizedTreatmentCategory;
        })
        .sort((a, b) => b.score - a.score); // Sort by score only
      
      if (treatmentProducts.length > 0) {
        // Filter out products with allergens if user has allergies
        const userAllergies = this.getUserAllergies();
        const safeTreatmentProducts = treatmentProducts.filter(product => {
          if (!this.validateProduct(product)) return false;
          if (userAllergies && userAllergies.length > 0 && !userAllergies.includes('none')) {
            if (this.hasAllergyIngredients(product, userAllergies)) {
              return false;
            }
          }
          return true;
        });
        
        if (safeTreatmentProducts.length > 0) {
          // Use 3-slot tiered logic for optional categories
          // Always use 'treatment' as the category key to ensure categorizeProductsByPhase can find it
          const selectedTreatments = this.selectTopProductsWithTieredLogic(safeTreatmentProducts, 3);
          // Only add if we have at least one product
          if (selectedTreatments.length > 0) {
            recommendations['treatment'] = selectedTreatments;
          }
        }
      }
    }

    return { recommendations, notices };
  }

  // Build morning routine (with usage time validation)
  buildMorningRoutine(recommendations) {
    const routine = [];
    const steps = ['cleanser', 'toner', 'serum', 'eye_cream', 'moisturizer', 'spf'];
    let stepNumber = 0; // Track sequential step number for displayed items

    steps.forEach((step) => {
      // Find products for this category (case-insensitive)
      const normalizedStep = this.normalizeCategory(step);
      const categoryKey = Object.keys(recommendations).find(
        key => this.normalizeCategory(key) === normalizedStep
      );

      if (categoryKey && recommendations[categoryKey] && recommendations[categoryKey].length > 0) {
        // Filter by usage time: only morning or both
        const availableProducts = recommendations[categoryKey].filter(product => {
          const usage = this.normalizeString(product.usage || 'both');
          return usage === 'morning' || usage === 'both';
        });

        // For very/somewhat sensitive skin, prioritize sensitivity-safe products
        const normalizedSensitivity = this.normalizeString(this.profile.sensitivity);
        const isVerySensitive = normalizedSensitivity === 'very' || normalizedSensitivity === 'somewhat';
        
        // For very sensitive skin and eye_cream category: skip if no safe morning option exists
        // (Retinol eye creams should not be used in morning due to photosensitivity)
        if (isVerySensitive && normalizedStep === 'eye_cream' && availableProducts.length > 0) {
          const hasSafeProduct = availableProducts.some(p => p.sensitivitySafe === true);
          if (!hasSafeProduct) {
            // Skip eye cream in morning routine if no safe option exists for very sensitive skin
            // The safe retinol eye cream should only be used in evening (photosensitivity concerns)
            // Continue to next step instead of adding this one
            return; // Skip this iteration of forEach
          }
        }

        if (availableProducts.length > 0) {
        stepNumber++; // Increment for each item that gets added to the routine
          
          let product;
          if (isVerySensitive && availableProducts.length > 1) {
            // Find sensitivity-safe product first
            const sensitivitySafeProduct = availableProducts.find(p => p.sensitivitySafe === true);
            product = sensitivitySafeProduct || availableProducts[0]; // Use safe product if available, otherwise first
          } else if (isVerySensitive && availableProducts.length === 1 && !availableProducts[0].sensitivitySafe) {
            // For very sensitive skin with only one non-safe product, skip it for eye_cream
            // (other categories may be acceptable, but eye area is more sensitive)
            if (normalizedStep === 'eye_cream') {
              return; // Skip non-safe eye cream for very sensitive skin
            }
            product = availableProducts[0];
          } else {
            product = availableProducts[0]; // Use top product
          }

        let instruction = '';
          const normalizedSkinType = this.normalizeString(this.profile.skinType);
          switch (normalizedStep) {
          case 'cleanser':
              instruction = normalizedSkinType === 'dry' || normalizedSkinType === 'normal'
              ? 'Optional in the morning if skin feels clean. Use lukewarm water.'
              : 'Gently massage onto damp skin, rinse with lukewarm water.';
            break;
          case 'toner':
            instruction = 'Apply to clean skin with cotton pad or pat with hands.';
            break;
          case 'serum':
            instruction = 'Apply 2-3 drops to face and neck. Pat gently until absorbed. Wait 30 seconds before next step.';
            break;
            case 'eye_cream':
            instruction = 'Gently pat a small amount around eye area using ring finger.';
            break;
          case 'moisturizer':
            instruction = 'Apply evenly to face and neck. Let it absorb for 1-2 minutes.';
            break;
          case 'spf':
            instruction = 'Apply generously (2 finger lengths). This is the most important step! Reapply every 2 hours if outdoors.';
            break;
        }

        routine.push({
          step: stepNumber, // Use sequential number based on items added
            category: normalizedStep,
          product: {
            name: product.name,
            brand: product.brand,
            productId: product.productId,
          },
          instruction,
            important: normalizedStep === 'spf',
        });
        }
      }
    });

    return routine;
  }

  // Build evening routine (with usage time validation)
  buildEveningRoutine(recommendations) {
    const routine = [];
    const steps = ['cleanser', 'toner', 'serum', 'treatment', 'eye_cream', 'moisturizer'];
    let stepNumber = 0; // Track sequential step number for displayed items

    steps.forEach((step) => {
      // Find products for this category (case-insensitive)
      const normalizedStep = this.normalizeCategory(step);
      const categoryKey = Object.keys(recommendations).find(
        key => this.normalizeCategory(key) === normalizedStep
      );

      if (categoryKey && recommendations[categoryKey] && recommendations[categoryKey].length > 0) {
        // Filter by usage time: only evening or both
        const availableProducts = recommendations[categoryKey].filter(product => {
          const usage = this.normalizeString(product.usage || 'both');
          return usage === 'evening' || usage === 'both';
        });

        if (availableProducts.length > 0) {
        stepNumber++; // Increment for each item that gets added to the routine
          
          // For very/somewhat sensitive skin, prioritize sensitivity-safe products in routines
          const normalizedSensitivity = this.normalizeString(this.profile.sensitivity);
          const isVerySensitive = normalizedSensitivity === 'very' || normalizedSensitivity === 'somewhat';
          
          let product;
          if (isVerySensitive && availableProducts.length > 1) {
            // Find sensitivity-safe product first
            const sensitivitySafeProduct = availableProducts.find(p => p.sensitivitySafe === true);
            product = sensitivitySafeProduct || availableProducts[0]; // Use safe product if available, otherwise first
          } else {
            product = availableProducts[0]; // Use top product
          }

        let instruction = '';
        let frequency = 'daily';

          // Use product frequency if available, otherwise use default
          if (product.frequency) {
            frequency = product.frequency;
          }

          switch (normalizedStep) {
          case 'cleanser':
            instruction = 'Double cleanse: First with oil-based cleanser (if wearing makeup/SPF), then with regular cleanser. Massage for 60 seconds.';
            break;
          case 'toner':
            instruction = 'Apply to clean skin. If using exfoliating toner, start 2x/week and gradually increase.';
              const normalizedConcernNames = this.concerns.map(c => this.normalizeString(c.concern));
              frequency = normalizedConcernNames.some(c => ['acne', 'texture', 'dullness'].includes(c)) 
              ? '2-3x per week' 
                : frequency;
            break;
          case 'serum':
            instruction = 'Layer serums from thinnest to thickest. Wait 30 seconds between each.';
            break;
          case 'treatment':
            instruction = 'Apply treatment product (retinol/acids). Start 2x/week, build up to daily. Always follow with moisturizer.';
            frequency = '2-3x per week initially';
            break;
            case 'eye_cream':
            instruction = 'Gently pat around eye area. Use ring finger for gentlest application.';
            break;
          case 'moisturizer':
            instruction = 'Apply generously. Can layer with face oil if very dry.';
            break;
        }

        routine.push({
          step: stepNumber, // Use sequential number based on items added
            category: normalizedStep,
          product: {
            name: product.name,
            brand: product.brand,
            productId: product.productId,
          },
          instruction,
          frequency,
            important: normalizedStep === 'treatment',
        });
        }
      }
    });

    return routine;
  }

  // Categorize products by phase (3-Phase System)
  // Phase 1: The Core Foundation (Always Show) - Cleanser, Moisturizer, SPF
  // Phase 2: The Treatment Plan (Always Show) - Toner, Serum/Ampoule
  // Phase 3: The Optimizers (Show Conditionally) - Eye Cream, Mask (only if needed/found)
  categorizeProductsByPhase(recommendations, allProducts = null) {
    // Phase 1: The Core Foundation - Always Show
    const phase1Categories = ['cleanser', 'moisturizer', 'spf'];
    const phase1 = {};
    
    // Phase 2: The Treatment Plan - Always Show
    const phase2Categories = ['toner', 'serum', 'treatment']; // treatment is often categorized as serum/ampoule
    const phase2 = {};
    const phase2ProductIds = new Set(); // Track which products are in Phase 2
    
    // Phase 3: The Optimizers - Conditionally Show (eye-cream, mask)
    const phase3Categories = ['eye-cream', 'eye_cream', 'mask'];
    const phase3 = {};
    
    // Step 1: Categorize Phase 1 (Core Foundation) - All products from cleanser, moisturizer, spf
    Object.keys(recommendations).forEach((category) => {
      const normalizedCategory = this.normalizeCategory(category);
      const products = recommendations[category];
      
      if (phase1Categories.includes(normalizedCategory)) {
        phase1[category] = products.map(product => ({
          ...product,
          phase: 1,
          phaseLabel: 'Phase 1: The Core Foundation',
          showSensitivityWarning: product.sensitivitySafe === false,
        }));
      }
    });
    
    // Step 2: Categorize Phase 2 (Treatment Plan) - All products from toner, serum, treatment
    Object.keys(recommendations).forEach((category) => {
      const normalizedCategory = this.normalizeCategory(category);
      const products = recommendations[category];
      
      if (phase2Categories.includes(normalizedCategory)) {
        if (!phase2[category]) {
          phase2[category] = [];
        }
        products.forEach(product => {
          phase2[category].push({
            ...product,
            phase: 2,
            phaseLabel: 'Phase 2: The Treatment Plan',
            showSensitivityWarning: product.sensitivitySafe === false,
          });
          phase2ProductIds.add(product.productId);
        });
      }
    });
    
    // Step 3: Check if Phase 3 should be shown (eye-cream, mask)
    // Phase 3 is shown ONLY IF:
    // 1. User has concerns that trigger need for eye_cream or mask (e.g., dark-circles, aging)
    //    OR profile triggers need (e.g., ageRange: 46-55)
    // 2. AND at least one suitable eye_cream or mask product is found that passes safety checks
    
    // Check if user needs eye cream or mask based on concerns/profile
    const needsEyeCream = this.shouldShowEyeCream();
    const needsMask = this.shouldShowMask();
    
    // Collect eye-cream and mask products from recommendations
    const eyeCreamProducts = [];
    const maskProducts = [];
    
    Object.keys(recommendations).forEach((category) => {
      const normalizedCategory = this.normalizeCategory(category);
      const products = recommendations[category];
      
      if (normalizedCategory === 'eye-cream' || normalizedCategory === 'eye_cream') {
        // Filter products that pass safety checks
        const safeProducts = products.filter(product => {
          if (!this.validateProduct(product)) return false;
          
          // Check allergies
          const userAllergies = this.getUserAllergies();
          if (userAllergies && userAllergies.length > 0 && !userAllergies.includes('none')) {
            if (this.hasAllergyIngredients(product, userAllergies)) {
              return false; // Product has allergens
            }
          }
          
          return true;
        });
        
        // Preserve the original category name from recommendations
        safeProducts.forEach(product => {
          eyeCreamProducts.push({ ...product, originalCategory: category });
        });
      } else if (normalizedCategory === 'mask') {
        // Filter products that pass safety checks
        const safeProducts = products.filter(product => {
          if (!this.validateProduct(product)) return false;
          
          // Check allergies
          const userAllergies = this.getUserAllergies();
          if (userAllergies && userAllergies.length > 0 && !userAllergies.includes('none')) {
            if (this.hasAllergyIngredients(product, userAllergies)) {
              return false; // Product has allergens
            }
          }
          
          return true;
        });
        
        // Preserve the original category name from recommendations
        safeProducts.forEach(product => {
          maskProducts.push({ ...product, originalCategory: category });
        });
      }
    });
    
    // Only show Phase 3 if:
    // - User needs eye cream OR mask (based on concerns/profile)
    // - AND at least one suitable product was found
    const shouldShowPhase3 = (needsEyeCream && eyeCreamProducts.length > 0) || 
                             (needsMask && maskProducts.length > 0);
    
    // Step 3: Add products to Phase 3 if they should be shown (conditionally)
    if (shouldShowPhase3) {
      // Add eye cream products to Phase 3
      if (needsEyeCream && eyeCreamProducts.length > 0) {
        eyeCreamProducts.forEach(product => {
          // Use the original category from recommendations (could be 'eye-cream' or 'eye_cream')
          const category = product.originalCategory || product.category || 'eye-cream';
          if (!phase3[category]) {
            phase3[category] = [];
          }
          // Remove originalCategory before adding to phase3
          const { originalCategory, ...productWithoutCategory } = product;
          phase3[category].push({
            ...productWithoutCategory,
            phase: 3,
            phaseLabel: 'Phase 3: The Optimizers',
            showSensitivityWarning: product.sensitivitySafe === false,
          });
        });
      }
      
      // Add mask products to Phase 3
      if (needsMask && maskProducts.length > 0) {
        maskProducts.forEach(product => {
          // Use the original category from recommendations
          const category = product.originalCategory || product.category || 'mask';
          if (!phase3[category]) {
            phase3[category] = [];
          }
          // Remove originalCategory before adding to phase3
          const { originalCategory, ...productWithoutCategory } = product;
          phase3[category].push({
            ...productWithoutCategory,
            phase: 3,
            phaseLabel: 'Phase 3: The Optimizers',
            showSensitivityWarning: product.sensitivitySafe === false,
          });
        });
      }
    }
    
    return {
      phase1, // The Core Foundation (Always Show) - cleanser, moisturizer, spf
      phase2, // The Treatment Plan (Always Show) - toner, serum, treatment
      phase3, // The Optimizers (Show Conditionally) - eye-cream, mask (only if needed/found)
    };
  }

  // Check if Phase 3 should show eye cream based on concerns/profile
  shouldShowEyeCream() {
    const ageRange = this.responses.ageRange;
    const primaryConcerns = this.responses.primaryConcerns || [];
    
    // Check if user has eye-related concerns
    const eyeConcerns = ['dark-circles', 'aging', 'wrinkles', 'fine-lines'];
    const hasEyeConcern = primaryConcerns.some(concern => 
      eyeConcerns.some(eyeConcern => 
        this.normalizeString(concern).includes(eyeConcern) || 
        eyeConcern.includes(this.normalizeString(concern))
      )
    );
    
    // Check if age range triggers need for eye cream (46+)
    const ageRanges = ['46-55', '56-65', '65+'];
    const shouldShowByAge = ageRanges.includes(ageRange);
    
    return hasEyeConcern || shouldShowByAge;
  }

  // Check if Phase 3 should show mask based on concerns/profile
  shouldShowMask() {
    const primaryConcerns = this.responses.primaryConcerns || [];
    
    // Check if user has concerns that benefit from masks
    // Masks are typically useful for: acne, dryness, dullness, texture, aging
    const maskConcerns = ['acne', 'dryness', 'dullness', 'texture', 'aging', 'pigmentation'];
    const hasMaskConcern = primaryConcerns.some(concern => 
      maskConcerns.some(maskConcern => 
        this.normalizeString(concern).includes(maskConcern) || 
        maskConcern.includes(this.normalizeString(concern))
      )
    );
    
    // Masks can be beneficial for most users, so show if they have any of these concerns
    return hasMaskConcern;
  }

  // Generate complete analysis
  async generateCompleteAnalysis(products) {
    const { recommendations, notices } = await this.recommendProducts(products);
    
    // PHASE 3.3: Categorize products by phase
    // Pass all products as fallback in case serum/treatment products are missing from recommendations
    const phasedRecommendations = this.categorizeProductsByPhase(recommendations, products);
    
    // Merge Phase 2 products (serum/treatment) into recommendations if they're not already there
    // This ensures Phase 2 products are included in routines and saved to the database
    const mergedRecommendations = { ...recommendations };
    
    if (phasedRecommendations.phase2) {
      Object.keys(phasedRecommendations.phase2).forEach(category => {
        const phase2Products = phasedRecommendations.phase2[category];
        
        if (phase2Products && phase2Products.length > 0) {
          // Check if this category already exists in recommendations
          const normalizedCategory = this.normalizeCategory(category);
          const existingCategoryKey = Object.keys(mergedRecommendations).find(
            key => this.normalizeCategory(key) === normalizedCategory
          );
          
          if (existingCategoryKey) {
            // Category exists - merge products, avoiding duplicates
            const existingProducts = mergedRecommendations[existingCategoryKey];
            const existingProductIds = new Set(existingProducts.map(p => p.productId));
            
            // Add Phase 2 products that aren't already in recommendations
            phase2Products.forEach(phase2Product => {
              if (!existingProductIds.has(phase2Product.productId)) {
                // Remove phase and phaseLabel properties before adding to recommendations
                const { phase, phaseLabel, ...productWithoutPhase } = phase2Product;
                existingProducts.push(productWithoutPhase);
                existingProductIds.add(phase2Product.productId);
              }
            });
            
            // Sort by: sensitivity-safe first (especially important for very sensitive skin), then by score
            const normalizedSensitivity = this.normalizeString(this.profile.sensitivity);
            const isVerySensitive = normalizedSensitivity === 'very' || normalizedSensitivity === 'somewhat';
            
            existingProducts.sort((a, b) => {
              // For very/somewhat sensitive skin, prioritize sensitivity-safe products
              if (isVerySensitive) {
                const aSafe = a.sensitivitySafe === true;
                const bSafe = b.sensitivitySafe === true;
                if (aSafe !== bSafe) {
                  return bSafe ? 1 : -1; // sensitivity-safe first
                }
              }
              // Otherwise sort by score (highest first)
              const scoreA = typeof a.score === 'object' ? a.score.score : a.score;
              const scoreB = typeof b.score === 'object' ? b.score.score : b.score;
              return scoreB - scoreA;
            });
          } else {
            // Category doesn't exist - add it with Phase 2 products
            // Remove phase and phaseLabel properties, but maintain sensitivity-safe priority in sorting
            const normalizedSensitivity = this.normalizeString(this.profile.sensitivity);
            const isVerySensitive = normalizedSensitivity === 'very' || normalizedSensitivity === 'somewhat';
            
            const products = phase2Products.map(({ phase, phaseLabel, ...product }) => product);
            
            // Sort by sensitivity-safe first if very sensitive, then by score
            if (isVerySensitive) {
              products.sort((a, b) => {
                const aSafe = a.sensitivitySafe === true;
                const bSafe = b.sensitivitySafe === true;
                if (aSafe !== bSafe) {
                  return bSafe ? 1 : -1;
                }
                const scoreA = typeof a.score === 'object' ? a.score.score : a.score;
                const scoreB = typeof b.score === 'object' ? b.score.score : b.score;
                return scoreB - scoreA;
              });
            } else {
              products.sort((a, b) => {
                const scoreA = typeof a.score === 'object' ? a.score.score : a.score;
                const scoreB = typeof b.score === 'object' ? b.score.score : b.score;
                return scoreB - scoreA;
              });
            }
            
            mergedRecommendations[category] = products;
          }
        }
      });
    }
    
    return {
      profile: this.profile,
      concerns: this.concerns,
      recommendations: mergedRecommendations, // Include Phase 2 products for routines
      phasedRecommendations, // PHASE 3.3: Phased routine rollout
      notices: notices || [], // PHASE 2.1: Multi-pass system notices
      morningRoutine: this.buildMorningRoutine(mergedRecommendations),
      eveningRoutine: this.buildEveningRoutine(mergedRecommendations),
      tips: this.generatePersonalizedTips(),
    };
  }

  // Generate personalized tips (with case-insensitive comparisons)
  generatePersonalizedTips() {
    const tips = [];
    const lifestyleFactors = (this.profile.lifestyleFactors || []).map(f => this.normalizeString(f));
    const normalizedClimate = this.normalizeString(this.profile.climate || '');
    const normalizedSunExposure = this.normalizeString(this.profile.sunExposure || '');
    const normalizedConcernNames = this.concerns.map(c => this.normalizeString(c.concern));

    // Lifestyle-based tips
    if (lifestyleFactors.includes('stress')) {
      tips.push('High stress can trigger breakouts and inflammation. Consider incorporating calming facial massage into your routine.');
    }
    if (lifestyleFactors.includes('sleep')) {
      tips.push('Irregular sleep affects skin repair. Try to maintain a consistent evening skincare routine to signal bedtime.');
    }
    if (lifestyleFactors.includes('exercise')) {
      tips.push('Always cleanse after workouts to prevent clogged pores from sweat and bacteria.');
    }

    // Climate-based tips
    if (normalizedClimate === 'hot-humid') {
      tips.push('In humid climates, use lightweight, gel-based products and consider blotting papers for oil control.');
    }
    if (normalizedClimate === 'cold-dry') {
      tips.push('Cold weather strips moisture. Layer hydrating products and use a humidifier indoors.');
    }

    // Sun exposure tips
    if (normalizedSunExposure === 'high') {
      tips.push('With high sun exposure, reapply SPF every 2 hours and consider wearing a hat for extra protection.');
    }

    // Concern-specific tips
    if (normalizedConcernNames.includes('acne')) {
      tips.push('Change pillowcases frequently and avoid touching your face throughout the day.');
    }
    if (normalizedConcernNames.includes('aging')) {
      tips.push('Consistency is key for anti-aging. Results typically appear after 8-12 weeks of regular use.');
    }

    return tips;
  }
}

export default RecommendationEngine;