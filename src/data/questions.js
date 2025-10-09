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
    id: 'gender',
    question: "How do you identify?",
    description: "Helps us consider hormonal factors in skincare.",
    type: 'single',
    required: true,
    options: [
      { value: 'female', label: 'Female' },
      { value: 'male', label: 'Male' },
      { value: 'non-binary', label: 'Non-binary' },
      { value: 'prefer-not-say', label: 'Prefer not to say' },
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
    description: "Choose up to 3 that bother you the most.",
    type: 'multiple',
    required: true,
    maxSelections: 3,
    options: [
      { value: 'acne', label: 'Acne / breakouts', icon: '🔴' },
      { value: 'pigmentation', label: 'Dark spots / pigmentation / uneven tone', icon: '🌗' },
      { value: 'aging', label: 'Fine lines / wrinkles / aging signs', icon: '📅' },
      { value: 'dryness', label: 'Dryness / dehydration', icon: '💦' },
      { value: 'oiliness', label: 'Excess oil / shine', icon: '✨' },
      { value: 'dullness', label: 'Dullness / lack of radiance', icon: '🌑' },
      { value: 'redness', label: 'Redness / inflammation', icon: '🔥' },
      { value: 'dark-circles', label: 'Dark circles / under-eye concerns', icon: '😴' },
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
    description: "Contextual factors that affect your skin.",
    type: 'multiple',
    required: false,
    options: [
      { value: 'stress', label: 'High stress levels' },
      { value: 'sleep', label: 'Irregular sleep patterns' },
      { value: 'makeup', label: 'Heavy makeup use' },
      { value: 'smoker', label: 'Smoker' },
      { value: 'travel', label: 'Frequent travel' },
      { value: 'exercise', label: 'Regular exercise/sweating' },
      { value: 'none', label: 'None of the above' },
    ],
  },
  {
    id: 'budget',
    question: "What's your preferred budget range for skincare?",
    description: "We'll recommend products within your comfort zone.",
    type: 'single',
    required: true,
    options: [
      { value: 'budget', label: 'Budget-friendly', description: 'Under $50/month' },
      { value: 'mid', label: 'Mid-range', description: '$50-150/month' },
      { value: 'premium', label: 'Premium', description: '$150+/month' },
      { value: 'no-preference', label: 'No preference' },
    ],
  },
  {
    id: 'preferences',
    question: "Any preferences or restrictions?",
    description: "We'll filter products accordingly.",
    type: 'multiple',
    required: false,
    options: [
      { value: 'fragrance-free', label: 'Fragrance-free' },
      { value: 'vegan', label: 'Vegan' },
      { value: 'cruelty-free', label: 'Cruelty-free' },
      { value: 'natural', label: 'Natural/organic focused' },
      { value: 'none', label: 'No specific preferences' },
    ],
  },
];

export default questions;