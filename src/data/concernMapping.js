// data/concernMapping.js

// --- 1. DEFINE YOUR DATA STRUCTURES ---
// Define the main mapping object as a standard JavaScript constant.
const concernMapping = {
  acne: {
    name: 'Acne & Breakouts',
    description: 'Active breakouts, blackheads, or acne-prone skin',
    requiredCategories: ['cleanser', 'toner', 'serum', 'moisturizer', 'spf'],
    optionalCategories: ['mask', 'treatment'],
    keyIngredients: [
      'salicylic-acid',
      'benzoyl-peroxide',
      'niacinamide',
      'tea-tree-oil',
      'azelaic-acid',
    ],
    avoidIngredients: ['heavy-oils', 'coconut-oil', 'thick-butters'],
    productPreferences: {
      cleanser: { texture: 'foaming', strength: 'medium' },
      toner: { type: 'bha', alcohol: false },
      serum: { focus: 'oil-control', layering: true },
      moisturizer: { texture: 'gel', weight: 'lightweight' },
      spf: { type: 'oil-free', finish: 'matte' },
    },
    routine: {
      morning: ['cleanser', 'toner', 'serum', 'moisturizer', 'spf'],
      evening: ['cleanser', 'toner', 'treatment', 'moisturizer'],
      weekly: ['mask'],
    },
  },
  pigmentation: {
    name: 'Pigmentation & Dark Spots',
    description: 'Uneven skin tone, dark spots, melasma, or post-acne marks',
    requiredCategories: ['cleanser', 'serum', 'moisturizer', 'spf'],
    optionalCategories: ['toner', 'mask'],
    keyIngredients: [
      'vitamin-c',
      'niacinamide',
      'alpha-arbutin',
      'kojic-acid',
      'tranexamic-acid',
      'licorice-extract',
    ],
    avoidIngredients: ['harsh-scrubs', 'high-alcohol'],
    productPreferences: {
      cleanser: { texture: 'gentle', exfoliation: 'mild' },
      serum: { focus: 'brightening', layering: true },
      moisturizer: { texture: 'any', brightening: true },
      spf: { type: 'high-protection', pa: 'PA++++' },
    },
    routine: {
      morning: ['cleanser', 'serum', 'moisturizer', 'spf'],
      evening: ['cleanser', 'serum', 'moisturizer'],
      weekly: ['mask'],
    },
  },
  aging: {
    name: 'Anti-Aging & Fine Lines',
    description: 'Fine lines, wrinkles, loss of firmness, or aging prevention',
    requiredCategories: ['cleanser', 'serum', 'moisturizer', 'spf'],
    optionalCategories: ['eye_cream', 'mask'],
    keyIngredients: [
      'retinol',
      'retinaldehyde',
      'peptides',
      'hyaluronic-acid',
      'vitamin-c',
      'ceramides',
    ],
    avoidIngredients: ['harsh-exfoliants', 'drying-alcohols'],
    productPreferences: {
      cleanser: { texture: 'cream', stripping: false },
      serum: { focus: 'anti-aging', layering: true },
      moisturizer: { texture: 'rich', hydration: 'high' },
      spf: { type: 'high-protection', 'anti-aging': true },
    },
    routine: {
      morning: ['cleanser', 'serum', 'eye_cream', 'moisturizer', 'spf'],
      evening: ['cleanser', 'serum', 'eye_cream', 'moisturizer'],
      weekly: ['mask'],
    },
  },
  dryness: {
    name: 'Dryness & Dehydration',
    description: 'Tight, flaky, or dehydrated skin',
    requiredCategories: ['cleanser', 'toner', 'serum', 'moisturizer', 'spf'],
    optionalCategories: ['mask', 'treatment'],
    keyIngredients: [
      'hyaluronic-acid',
      'ceramides',
      'glycerin',
      'squalane',
      'niacinamide',
      'shea-butter',
    ],
    avoidIngredients: ['alcohol', 'harsh-surfactants', 'fragrance'],
    productPreferences: {
      cleanser: { texture: 'cream', stripping: false },
      toner: { type: 'hydrating', alcohol: false },
      serum: { focus: 'hydration', layering: true },
      moisturizer: { texture: 'rich', weight: 'heavy' },
      spf: { type: 'hydrating', finish: 'dewy' },
    },
    routine: {
      morning: ['cleanser', 'toner', 'serum', 'moisturizer', 'spf'],
      evening: ['cleanser', 'toner', 'serum', 'moisturizer', 'treatment'],
      weekly: ['mask'],
    },
  },
  oiliness: {
    name: 'Excess Oil & Shine',
    description: 'Oily skin, enlarged pores, or constant shine',
    requiredCategories: ['cleanser', 'toner', 'serum', 'moisturizer', 'spf'],
    optionalCategories: ['mask'],
    keyIngredients: [
      'niacinamide',
      'salicylic-acid',
      'zinc',
      'clay',
      'tea-tree-oil',
    ],
    avoidIngredients: ['heavy-oils', 'thick-creams', 'coconut-oil'],
    productPreferences: {
      cleanser: { texture: 'foaming', strength: 'medium' },
      toner: { type: 'astringent', alcohol: 'minimal' },
      serum: { focus: 'oil-control', layering: true },
      moisturizer: { texture: 'gel', weight: 'lightweight' },
      spf: { type: 'oil-free', finish: 'matte' },
    },
    routine: {
      morning: ['cleanser', 'toner', 'serum', 'moisturizer', 'spf'],
      evening: ['cleanser', 'toner', 'serum', 'moisturizer'],
      weekly: ['mask'],
    },
  },
  dullness: {
    name: 'Dullness & Lack of Radiance',
    description: 'Tired-looking skin, lack of glow, uneven texture',
    requiredCategories: ['cleanser', 'toner', 'serum', 'moisturizer', 'spf'],
    optionalCategories: ['mask'],
    keyIngredients: [
      'vitamin-c',
      'niacinamide',
      'aha',
      'glycolic-acid',
      'lactic-acid',
    ],
    avoidIngredients: ['harsh-scrubs', 'high-alcohol'],
    productPreferences: {
      cleanser: { texture: 'gentle', exfoliation: 'mild' },
      toner: { type: 'exfoliating', alcohol: false },
      serum: { focus: 'brightening', layering: true },
      moisturizer: { texture: 'any', illuminating: true },
      spf: { type: 'any', finish: 'natural' },
    },
    routine: {
      morning: ['cleanser', 'serum', 'moisturizer', 'spf'],
      evening: ['cleanser', 'toner', 'serum', 'moisturizer'],
      weekly: ['mask'],
    },
  },
  redness: {
    name: 'Redness & Sensitivity',
    description: 'Irritated, inflamed, or reactive skin',
    requiredCategories: ['cleanser', 'toner', 'serum', 'moisturizer', 'spf'],
    optionalCategories: ['mask'],
    keyIngredients: [
      'centella',
      'niacinamide',
      'azelaic-acid',
      'ceramides',
      'green-tea',
      'aloe-vera',
    ],
    avoidIngredients: ['fragrance', 'alcohol', 'harsh-acids', 'retinol'],
    productPreferences: {
      cleanser: { texture: 'gentle', stripping: false },
      toner: { type: 'soothing', alcohol: false },
      serum: { focus: 'calming', layering: true },
      moisturizer: { texture: 'any', 'barrier-repair': true },
      spf: { type: 'mineral', 'sensitive-skin': true },
    },
    routine: {
      morning: ['cleanser', 'toner', 'serum', 'moisturizer', 'spf'],
      evening: ['cleanser', 'toner', 'serum', 'moisturizer'],
      weekly: ['mask'],
    },
  },
  'dark-circles': {
    name: 'Dark Circles & Under-Eye',
    description: 'Dark circles, puffiness, or fine lines around eyes',
    requiredCategories: ['eye_cream'],
    optionalCategories: ['serum'],
    keyIngredients: [
      'caffeine',
      'vitamin-k',
      'retinol',
      'peptides',
      'hyaluronic-acid',
    ],
    avoidIngredients: ['harsh-acids', 'strong-retinoids'],
    productPreferences: {
      'eye_cream': { focus: 'brightening', texture: 'light' },
    },
    routine: {
      morning: ['eye_cream'],
      evening: ['eye_cream'],
    },
  },
  'large-pores': {
    name: 'Large Pores',
    description: 'Visible or enlarged pores',
    requiredCategories: ['cleanser', 'toner', 'serum', 'moisturizer', 'spf'],
    optionalCategories: ['mask'],
    keyIngredients: [
      'niacinamide',
      'salicylic-acid',
      'retinol',
      'clay',
    ],
    avoidIngredients: ['heavy-oils', 'thick-butters'],
    productPreferences: {
      cleanser: { texture: 'foaming', 'pore-cleansing': true },
      toner: { type: 'bha', alcohol: false },
      serum: { focus: 'pore-refining', layering: true },
      moisturizer: { texture: 'gel', weight: 'lightweight' },
      spf: { type: 'oil-free', finish: 'matte' },
    },
    routine: {
      morning: ['cleanser', 'toner', 'serum', 'moisturizer', 'spf'],
      evening: ['cleanser', 'toner', 'serum', 'moisturizer'],
      weekly: ['mask'],
    },
  },
  texture: {
    name: 'Rough Texture',
    description: 'Bumpy, rough, or uneven skin texture',
    requiredCategories: ['cleanser', 'toner', 'serum', 'moisturizer', 'spf'],
    optionalCategories: ['mask'],
    keyIngredients: [
      'aha',
      'bha',
      'retinol',
      'niacinamide',
      'glycolic-acid',
    ],
    avoidIngredients: ['harsh-scrubs'],
    productPreferences: {
      cleanser: { texture: 'gentle', exfoliation: 'mild' },
      toner: { type: 'exfoliating', alcohol: false },
      serum: { focus: 'smoothing', layering: true },
      moisturizer: { texture: 'any', smoothing: true },
      spf: { type: 'any', finish: 'natural' },
    },
    routine: {
      morning: ['cleanser', 'serum', 'moisturizer', 'spf'],
      evening: ['cleanser', 'toner', 'serum', 'moisturizer'],
      weekly: ['mask'],
    },
  },
};

// Define the priority scoring object as a standard JavaScript constant.
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


// --- 2. EXPORT YOUR MODULES AT THE END ---
// This makes it clear what this file provides to other parts of your app.

export {
  concernMapping,
  concernPriorityModifiers,
};

