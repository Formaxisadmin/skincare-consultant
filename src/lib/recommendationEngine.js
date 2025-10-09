// lib/recommendationEngine.js
import { concernMapping, concernPriorityModifiers } from '@/data/concernMapping';

export class RecommendationEngine {
  constructor(responses) {
    this.responses = responses;
    this.profile = this.buildProfile();
    this.concerns = this.analyzeConcerns();
  }

  // Build customer profile
  buildProfile() {
    return {
      ageRange: this.responses.ageRange,
      gender: this.responses.gender,
      skinType: this.responses.skinType,
      sensitivity: this.responses.sensitivity,
      currentRoutine: this.responses.currentRoutine,
      sunExposure: this.responses.sunExposure,
      climate: this.responses.climate,
      lifestyleFactors: this.responses.lifestyleFactors || [],
      budget: this.responses.budget,
      preferences: this.responses.preferences || [],
    };
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

  // Calculate product match score
  calculateProductScore(product) {
    let score = 0;
    const maxScore = 100;

    // Skin type match (25 points)
    if (product.skinTypes.includes(this.profile.skinType) || product.skinTypes.includes('all')) {
      score += 25;
    }

    // Concern relevance (35 points)
    const concernMatches = this.concerns.filter((c) => 
      product.concernsAddressed.some((pConcern) => pConcern === c.concern)
    );
    if (concernMatches.length > 0) {
      const concernScore = (concernMatches.length / this.concerns.length) * 35;
      score += concernScore;
    }

    // Ingredient match (20 points)
    const preferredIngredients = this.getPreferredIngredients();
    const ingredientMatches = product.keyIngredients.filter((ing) => 
      preferredIngredients.includes(ing)
    );
    if (ingredientMatches.length > 0) {
      score += Math.min((ingredientMatches.length / preferredIngredients.length) * 20, 20);
    }

    // Sensitivity compatibility (10 points)
    if (this.profile.sensitivity === 'very' || this.profile.sensitivity === 'somewhat') {
      if (product.sensitivitySafe) {
        score += 10;
      } else {
        score -= 15; // Penalty for non-safe products
      }
    } else {
      score += 5; // Neutral bonus
    }

    // Budget compatibility (5 points)
    if (this.profile.budget === 'no-preference' || product.budgetTier === this.profile.budget) {
      score += 5;
    }

    // Preference match (5 points)
    const prefMatches = this.profile.preferences.filter((pref) => 
      product.preferences.includes(pref)
    );
    if (prefMatches.length > 0) {
      score += 5;
    }

    // Penalty for avoided ingredients
    const avoidIngredients = this.getAvoidIngredients();
    const hasAvoidIngredients = product.keyIngredients.some((ing) => 
      avoidIngredients.includes(ing)
    );
    if (hasAvoidIngredients) {
      score -= 20;
    }

    // Penalty for avoid ingredients in product's avoid list
    const hasProductAvoidIngredients = product.avoidIngredients?.some((ing) => 
      avoidIngredients.includes(ing)
    );
    if (hasProductAvoidIngredients) {
      score -= 10;
    }

    return Math.max(0, Math.min(score, maxScore));
  }

  // Generate product recommendations
  async recommendProducts(products) {
    const requiredCategories = this.getRequiredCategories();
    const recommendations = {};

    // Score all products
    const scoredProducts = products.map((product) => ({
      ...product,
      score: this.calculateProductScore(product),
    }));

    // Select best products for each category
    requiredCategories.forEach((category) => {
      const categoryProducts = scoredProducts
        .filter((p) => p.category === category && p.inStock)
        .sort((a, b) => b.score - a.score);

      if (categoryProducts.length > 0) {
        // Get top 2 products for variety
        recommendations[category] = categoryProducts.slice(0, 2);
      }
    });

    return recommendations;
  }

  // Build morning routine
  buildMorningRoutine(recommendations) {
    const routine = [];
    const steps = ['cleanser', 'toner', 'serum', 'eye-cream', 'moisturizer', 'spf'];

    steps.forEach((step, index) => {
      if (recommendations[step] && recommendations[step].length > 0) {
        const product = recommendations[step][0]; // Use top product

        let instruction = '';
        switch (step) {
          case 'cleanser':
            instruction = this.profile.skinType === 'dry' || this.profile.skinType === 'normal'
              ? 'Optional in the morning if skin feels clean. Use lukewarm water.'
              : 'Gently massage onto damp skin, rinse with lukewarm water.';
            break;
          case 'toner':
            instruction = 'Apply to clean skin with cotton pad or pat with hands.';
            break;
          case 'serum':
            instruction = 'Apply 2-3 drops to face and neck. Pat gently until absorbed. Wait 30 seconds before next step.';
            break;
          case 'eye-cream':
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
          step: index + 1,
          category: step,
          product: {
            name: product.name,
            brand: product.brand,
            productId: product.productId,
          },
          instruction,
          important: step === 'spf',
        });
      }
    });

    return routine;
  }

  // Build evening routine
  buildEveningRoutine(recommendations) {
    const routine = [];
    const steps = ['cleanser', 'toner', 'serum', 'treatment', 'eye-cream', 'moisturizer'];

    steps.forEach((step, index) => {
      if (recommendations[step] && recommendations[step].length > 0) {
        const product = recommendations[step][0];

        let instruction = '';
        let frequency = 'daily';

        switch (step) {
          case 'cleanser':
            instruction = 'Double cleanse: First with oil-based cleanser (if wearing makeup/SPF), then with regular cleanser. Massage for 60 seconds.';
            break;
          case 'toner':
            instruction = 'Apply to clean skin. If using exfoliating toner, start 2x/week and gradually increase.';
            frequency = this.concerns.some(c => ['acne', 'texture', 'dullness'].includes(c.concern)) 
              ? '2-3x per week' 
              : 'daily';
            break;
          case 'serum':
            instruction = 'Layer serums from thinnest to thickest. Wait 30 seconds between each.';
            break;
          case 'treatment':
            instruction = 'Apply treatment product (retinol/acids). Start 2x/week, build up to daily. Always follow with moisturizer.';
            frequency = '2-3x per week initially';
            break;
          case 'eye-cream':
            instruction = 'Gently pat around eye area. Use ring finger for gentlest application.';
            break;
          case 'moisturizer':
            instruction = 'Apply generously. Can layer with face oil if very dry.';
            break;
        }

        routine.push({
          step: index + 1,
          category: step,
          product: {
            name: product.name,
            brand: product.brand,
            productId: product.productId,
          },
          instruction,
          frequency,
          important: step === 'treatment',
        });
      }
    });

    return routine;
  }

  // Generate complete analysis
  async generateCompleteAnalysis(products) {
    const recommendations = await this.recommendProducts(products);
    
    return {
      profile: this.profile,
      concerns: this.concerns,
      recommendations: recommendations,
      morningRoutine: this.buildMorningRoutine(recommendations),
      eveningRoutine: this.buildEveningRoutine(recommendations),
      tips: this.generatePersonalizedTips(),
    };
  }

  // Generate personalized tips
  generatePersonalizedTips() {
    const tips = [];

    // Lifestyle-based tips
    if (this.profile.lifestyleFactors.includes('stress')) {
      tips.push('High stress can trigger breakouts and inflammation. Consider incorporating calming facial massage into your routine.');
    }
    if (this.profile.lifestyleFactors.includes('sleep')) {
      tips.push('Irregular sleep affects skin repair. Try to maintain a consistent evening skincare routine to signal bedtime.');
    }
    if (this.profile.lifestyleFactors.includes('exercise')) {
      tips.push('Always cleanse after workouts to prevent clogged pores from sweat and bacteria.');
    }

    // Climate-based tips
    if (this.profile.climate === 'hot-humid') {
      tips.push('In humid climates, use lightweight, gel-based products and consider blotting papers for oil control.');
    }
    if (this.profile.climate === 'cold-dry') {
      tips.push('Cold weather strips moisture. Layer hydrating products and use a humidifier indoors.');
    }

    // Sun exposure tips
    if (this.profile.sunExposure === 'high') {
      tips.push('With high sun exposure, reapply SPF every 2 hours and consider wearing a hat for extra protection.');
    }

    // Concern-specific tips
    if (this.concerns.some(c => c.concern === 'acne')) {
      tips.push('Change pillowcases frequently and avoid touching your face throughout the day.');
    }
    if (this.concerns.some(c => c.concern === 'aging')) {
      tips.push('Consistency is key for anti-aging. Results typically appear after 8-12 weeks of regular use.');
    }

    return tips;
  }
}

export default RecommendationEngine;