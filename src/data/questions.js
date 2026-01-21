// data/questions.js

export const questions = [
  {
    id: 'ageRange',
    question: "What's your age range?",
    description: "This helps us understand your skin's needs at this life stage.",
    type: 'single',
    required: true,
    options: [
      { value: 'under18', label: 'Under 18', icon: '👶' },
      { value: '18-25', label: '18-25', icon: '🧑' },
      { value: '26-35', label: '26-35', icon: '👨' },
      { value: '36-45', label: '36-45', icon: '👨‍💼' },
      { value: '46-55', label: '46-55', icon: '👨‍🦳' },
      { value: '56+', label: '56+', icon: '👴' },
    ],
  },
  {
    id: 'skinType',
    question: "How would you describe your skin type overall?",
    description: "Think about how your skin feels most of the day.",
    type: 'single',
    required: true,
    options: [
      { 
        value: 'oily', 
        label: 'Oily', 
        description: 'Shiny, large pores, prone to breakouts',
        icon: '💧'
      },
      { 
        value: 'dry', 
        label: 'Dry', 
        description: 'Tight, flaky, rough texture',
        icon: '🏜️'
      },
      { 
        value: 'combination', 
        label: 'Combination', 
        description: 'Oily T-zone, dry cheeks',
        icon: '🔀'
      },
      { 
        value: 'normal', 
        label: 'Normal', 
        description: 'Balanced, not too oily or dry',
        icon: '✨'
      },
      { 
        value: 'not-sure', 
        label: 'Not sure', 
        description: "We'll help you figure it out",
        icon: '❓'
      },
    ],
  },
  {
    id: 'sensitivity',
    question: "Does your skin react easily to products or environmental factors?",
    description: "Helps us avoid ingredients that might irritate your skin.",
    type: 'single',
    required: true,
    options: [
      { 
        value: 'very', 
        label: 'Very sensitive', 
        description: 'Redness, burning, reactions frequent' 
      },
      { 
        value: 'somewhat', 
        label: 'Somewhat sensitive', 
        description: 'Occasional reactions' 
      },
      { 
        value: 'not', 
        label: 'Not sensitive', 
        description: 'Rarely reacts' 
      },
    ],
  },
  {
    id: 'primaryConcerns',
    question: "What are your main skin concerns?",
    description: "Select all that apply. We recommend choosing your top 3-5 most important concerns for the best recommendations.",
    type: 'multiple',
    required: true,
    useTwoColumns: true, // Use 2-column layout for better visual organization
    // Removed maxSelections to allow flexibility - users can select as many as they want
    // The description suggests 3-5 but doesn't restrict
    options: [
      { value: 'acne', label: 'Acne / breakouts', icon: '🔴' },
      { value: 'pigmentation', label: 'Dark spots / pigmentation', icon: '🌗' },
      { value: 'aging', label: 'Fine lines / wrinkles', icon: '📅' },
      { value: 'dryness', label: 'Dryness / dehydration', icon: '💦' },
      { value: 'oiliness', label: 'Excess oil / shine', icon: '✨' },
      { value: 'dullness', label: 'Dullness / lack of radiance', icon: '🌑' },
      { value: 'redness', label: 'Redness / inflammation', icon: '🔥' },
      { value: 'dark-circles', label: 'Dark circles', icon: '😴' },
      { value: 'large-pores', label: 'Large pores', icon: '⭕' },
      { value: 'texture', label: 'Texture / roughness', icon: '🪨' },
    ],
  },
  {
    id: 'acneSeverity',
    question: "How would you describe your acne?",
    description: "This helps us recommend the right strength of products.",
    type: 'single',
    required: true,
    conditional: {
      dependsOn: 'primaryConcerns',
      showIf: (value) => value && value.includes('acne'),
    },
    options: [
      { value: 'mild', label: 'Mild', description: 'Occasional pimples' },
      { value: 'moderate', label: 'Moderate', description: 'Regular breakouts, some scarring' },
      { value: 'severe', label: 'Severe', description: 'Painful cysts, significant scarring' },
    ],
  },
  {
    id: 'currentRoutine',
    question: "What's your current skincare routine like?",
    description: "We'll recommend a routine that matches your comfort level.",
    type: 'single',
    required: true,
    options: [
      { value: 'none', label: "I don't have one / very minimal" },
      { value: 'basic', label: 'Basic', description: 'Cleanser and moisturizer' },
      { value: 'moderate', label: 'Moderate', description: 'Cleanser, treatment, moisturizer, SPF' },
      { value: 'extensive', label: 'Extensive', description: '5+ steps' },
    ],
  },
  {
    id: 'sunExposure',
    question: "How much time do you spend outdoors daily?",
    description: "Affects SPF recommendations and pigmentation risk.",
    type: 'single',
    required: true,
    options: [
      { value: 'minimal', label: 'Minimal', description: 'Mostly indoors' },
      { value: 'moderate', label: 'Moderate', description: '1-3 hours' },
      { value: 'high', label: 'High', description: '3+ hours or outdoor job' },
    ],
  },
  {
    id: 'climate',
    question: "What's your local climate like?",
    description: "Helps us recommend the right product textures.",
    type: 'single',
    required: true,
    options: [
      { value: 'hot-humid', label: 'Hot & humid', icon: '🌴' },
      { value: 'hot-dry', label: 'Hot & dry', icon: '🏜️' },
      { value: 'cold-dry', label: 'Cold & dry', icon: '❄️' },
      { value: 'cold-humid', label: 'Cold & humid', icon: '🌧️' },
      { value: 'moderate', label: 'Moderate/Temperate', icon: '🌤️' },
    ],
  },
  {
    id: 'lifestyleFactors',
    question: "Which of these apply to you?",
    description: "Contextual factors that affect your skin. We'll ask follow-up questions if needed.",
    type: 'multiple',
    required: false,
    useTwoColumns: true, // Use 2-column layout for better visual organization
    options: [
      { value: 'stress', label: 'High stress levels' },
      { value: 'makeup', label: 'Heavy makeup use' },
      { value: 'sleep', label: 'Irregular sleep' },
      { value: 'facial-hair-removal', label: 'Facial hair removal' },
      { value: 'exercise', label: 'Regular exercise' },
      { value: 'travel', label: 'Frequent travel' },
      { value: 'smoker', label: 'Smoker' },
      { value: 'none', label: 'None of the above' },
    ],
  },
  {
    id: 'facialHairRemovalMethod',
    question: "How do you remove facial hair?",
    description: "This helps us recommend products that work best with your hair removal method.",
    type: 'single',
    required: true,
    conditional: {
      dependsOn: 'lifestyleFactors',
      showIf: (value) => value && Array.isArray(value) && value.includes('facial-hair-removal'),
    },
    options: [
      { value: 'shaving', label: 'Shaving' },
      { value: 'waxing', label: 'Waxing' },
      { value: 'threading', label: 'Threading' },
      { value: 'laser', label: 'Laser' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'facialHairRemovalFrequency',
    question: "How often do you remove facial hair?",
    description: "This helps us recommend the right products for your frequency.",
    type: 'single',
    required: true,
    conditional: {
      dependsOn: 'facialHairRemovalMethod',
      showIf: (value) => value && value !== 'none',
    },
    options: [
      { value: 'daily', label: 'Daily' },
      { value: '2-3x-week', label: '2-3 times per week' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'occasionally', label: 'Occasionally' },
    ],
  },
  {
    id: 'makeupType',
    question: "What type of makeup do you typically wear?",
    description: "This helps us recommend the right cleansing and skincare products.",
    type: 'single',
    required: true,
    conditional: {
      dependsOn: 'lifestyleFactors',
      showIf: (value) => value && Array.isArray(value) && value.includes('makeup'),
    },
    options: [
      { value: 'light', label: 'Light', description: 'BB cream, tinted moisturizer' },
      { value: 'medium', label: 'Medium', description: 'Foundation' },
      { value: 'heavy', label: 'Heavy', description: 'Full coverage' },
    ],
  },
  {
    id: 'stressSkinIssues',
    question: "Do you experience stress-related skin issues?",
    description: "This helps us recommend products to address stress-related concerns.",
    type: 'multiple',
    required: false,
    conditional: {
      dependsOn: 'lifestyleFactors',
      showIf: (value) => value && Array.isArray(value) && value.includes('stress'),
    },
    options: [
      { value: 'breakouts', label: 'Breakouts' },
      { value: 'inflammation', label: 'Inflammation/Redness' },
      { value: 'dryness', label: 'Dryness' },
      { value: 'none', label: 'None' },
    ],
  },
  {
    id: 'scentPreference',
    question: "What scent do you prefer in skincare products?",
    description: "Select all that apply. We'll prioritize products that match your scent preferences.",
    type: 'multiple',
    required: true,
    maxSelections: 4, // Cap at 4 selections
    options: [
      { value: 'unscented', label: 'Unscented / Fragrance-free', icon: '🌿' },
      { value: 'citrus', label: 'Citrus (lemon, orange, grapefruit)', icon: '🍋' },
      { value: 'floral', label: 'Floral (rose, lavender, jasmine)', icon: '🌹' },
      { value: 'woody-spicy', label: 'Woody / Spicy (sandalwood, cedar)', icon: '🌲' },
      { value: 'fresh', label: 'Fresh / Clean (mint, eucalyptus)', icon: '🌱' },
      { value: 'no-preference', label: 'No preference', icon: '✨' },
    ],
  },
  {
    id: 'allergies',
    question: "Do you have any known allergies to skincare ingredients?",
    description: "We'll completely avoid products containing these ingredients for your safety.",
    type: 'multiple',
    required: false,
    useTwoColumns: true, // Use 2-column layout for better visual organization
    options: [
      { value: 'fragrance', label: 'Fragrance/Parfum' },
      { value: 'alcohol', label: 'Alcohol' },
      { value: 'retinol', label: 'Retinol/Vitamin A' },
      { value: 'vitamin-c', label: 'Vitamin C' },
      { value: 'salicylic-acid', label: 'Salicylic Acid' },
      { value: 'glycolic-acid', label: 'Glycolic Acid' },
      { value: 'benzoyl-peroxide', label: 'Benzoyl Peroxide' },
      { value: 'parabens', label: 'Parabens' },
      { value: 'sulfates', label: 'Sulfates' },
      { value: 'nuts', label: 'Nuts' },
      { value: 'soy', label: 'Soy' },
      { value: 'wheat', label: 'Wheat/Gluten' },
      { value: 'dairy', label: 'Dairy' },
      { value: 'niacinamide', label: 'Niacinamide' },
      { value: 'lactic-acid', label: 'Lactic Acid' },
      { value: 'hydroquinone', label: 'Hydroquinone' },
      { value: 'none', label: 'No known allergies' },
    ],
  },
  {
    id: 'preferences',
    question: "Any product preferences?",
    description: "We'll prioritize products that match your preferences, but may recommend alternatives if needed.",
    type: 'multiple',
    required: false,
    useTwoColumns: true, // Use 2-column layout for better visual organization
    options: [
      { value: 'fragrance-free', label: 'Fragrance-free' },
      { value: 'vegan', label: 'Vegan' },
      { value: 'cruelty-free', label: 'Cruelty-free' },
      { value: 'paraben-free', label: 'Paraben-free' },
      { value: 'sulfate-free', label: 'Sulfate-free' },
      { value: 'alcohol-free', label: 'Alcohol-free' },
      { value: 'oil-free', label: 'Oil-free' },
      { value: 'non-comedogenic', label: 'Non-comedogenic' },
      { value: 'natural', label: 'Natural/Organic' },
      { value: 'hypoallergenic', label: 'Hypoallergenic' },
      { value: 'none', label: 'No specific preferences' },
    ],
  },
  {
    id: 'budget',
    question: "What's your budget preference for individual skincare products?",
    description: "This helps us recommend products that fit your budget range. We'll still show other options if they're great matches.",
    type: 'single',
    required: false,
    options: [
      { value: 'low', label: 'Low (Under ₹1,000)', description: 'Budget-friendly products', icon: '💰' },
      { value: 'medium', label: 'Medium (₹1,000 - ₹2,500)', description: 'Standard range products', icon: '💵' },
      { value: 'high', label: 'High (₹2,500+)', description: 'Premium products', icon: '💎' },
    ],
  },
];

export default questions;