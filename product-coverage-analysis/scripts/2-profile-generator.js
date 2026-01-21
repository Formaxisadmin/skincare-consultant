/**
 * Profile Generator
 * Generates all possible user profiles based on the questions structure
 */

// All possible values for each question field
const PROFILE_OPTIONS = {
  ageRange: ['under18', '18-25', '26-35', '36-45', '46-55', '56+'],
  skinType: ['oily', 'dry', 'combination', 'normal', 'not-sure'],
  sensitivity: ['very', 'somewhat', 'not'],
  primaryConcerns: [
    'acne', 'pigmentation', 'aging', 'dryness', 'oiliness',
    'dullness', 'redness', 'dark-circles', 'large-pores', 'texture'
  ],
  acneSeverity: ['mild', 'moderate', 'severe'],
  currentRoutine: ['none', 'basic', 'moderate', 'extensive'],
  sunExposure: ['minimal', 'moderate', 'high'],
  climate: ['hot-humid', 'hot-dry', 'cold-dry', 'cold-humid', 'moderate'],
  lifestyleFactors: ['stress', 'makeup', 'sleep', 'facial-hair-removal', 'exercise', 'travel', 'smoker', 'none'],
  facialHairRemovalMethod: ['shaving', 'waxing', 'threading', 'laser', 'other'],
  facialHairRemovalFrequency: ['daily', '2-3x-week', 'weekly', 'occasionally'],
  makeupType: ['light', 'medium', 'heavy'],
  stressSkinIssues: ['breakouts', 'inflammation', 'dryness', 'none'],
  scentPreference: ['unscented', 'citrus', 'floral', 'woody-spicy', 'fresh', 'no-preference'],
  allergies: [
    'fragrance', 'alcohol', 'retinol', 'vitamin-c', 'salicylic-acid',
    'glycolic-acid', 'benzoyl-peroxide', 'parabens', 'sulfates', 'nuts',
    'soy', 'wheat', 'dairy', 'niacinamide', 'lactic-acid', 'hydroquinone', 'none'
  ],
  preferences: [
    'fragrance-free', 'vegan', 'cruelty-free', 'paraben-free', 'sulfate-free',
    'alcohol-free', 'oil-free', 'non-comedogenic', 'natural', 'hypoallergenic', 'none'
  ],
};

/**
 * Generate all possible combinations of primary concerns
 * We'll generate combinations of 1-5 concerns (most common use case)
 */
function generateConcernCombinations() {
  const concerns = PROFILE_OPTIONS.primaryConcerns;
  const combinations = [];
  
  // Single concern
  for (const concern of concerns) {
    combinations.push([concern]);
  }
  
  // 2 concerns
  for (let i = 0; i < concerns.length; i++) {
    for (let j = i + 1; j < concerns.length; j++) {
      combinations.push([concerns[i], concerns[j]]);
    }
  }
  
  // 3 concerns (most common)
  for (let i = 0; i < concerns.length; i++) {
    for (let j = i + 1; j < concerns.length; j++) {
      for (let k = j + 1; k < concerns.length; k++) {
        combinations.push([concerns[i], concerns[j], concerns[k]]);
      }
    }
  }
  
  // 4 concerns
  for (let i = 0; i < concerns.length; i++) {
    for (let j = i + 1; j < concerns.length; j++) {
      for (let k = j + 1; k < concerns.length; k++) {
        for (let l = k + 1; l < concerns.length; l++) {
          combinations.push([concerns[i], concerns[j], concerns[k], concerns[l]]);
        }
      }
    }
  }
  
  // 5 concerns
  for (let i = 0; i < concerns.length; i++) {
    for (let j = i + 1; j < concerns.length; j++) {
      for (let k = j + 1; k < concerns.length; k++) {
        for (let l = k + 1; l < concerns.length; l++) {
          for (let m = l + 1; m < concerns.length; m++) {
            combinations.push([concerns[i], concerns[j], concerns[k], concerns[l], concerns[m]]);
          }
        }
      }
    }
  }
  
  return combinations;
}

/**
 * Generate all possible user profiles
 * This is a simplified version that generates representative profiles
 * rather than all possible combinations (which would be millions)
 */
export function generateAllProfiles() {
  const profiles = [];
  
  // Core combinations that matter most for recommendations
  const ageRanges = PROFILE_OPTIONS.ageRange;
  const skinTypes = PROFILE_OPTIONS.skinType.filter(st => st !== 'not-sure'); // Exclude 'not-sure' for testing
  const sensitivities = PROFILE_OPTIONS.sensitivity;
  const routines = PROFILE_OPTIONS.currentRoutine;
  const sunExposures = PROFILE_OPTIONS.sunExposure;
  const climates = PROFILE_OPTIONS.climate;
  const concernCombinations = generateConcernCombinations();
  
  // Generate base profiles (without conditional fields)
  for (const ageRange of ageRanges) {
    for (const skinType of skinTypes) {
      for (const sensitivity of sensitivities) {
        for (const routine of routines) {
          for (const sunExposure of sunExposures) {
            for (const climate of climates) {
              // For each concern combination
              for (const primaryConcerns of concernCombinations) {
                // Determine if acne severity is needed
                const hasAcne = primaryConcerns.includes('acne');
                
                // Generate profiles with and without acne severity
                const acneSeverities = hasAcne ? PROFILE_OPTIONS.acneSeverity : [null];
                
                for (const acneSeverity of acneSeverities) {
                  // Lifestyle factors - generate a few key combinations
                  const lifestyleOptions = [
                    [], // No lifestyle factors
                    ['stress'],
                    ['makeup'],
                    ['facial-hair-removal'],
                    ['stress', 'makeup'],
                  ];
                  
                  for (const lifestyleFactors of lifestyleOptions) {
                    // Conditional fields based on lifestyle factors
                    let facialHairRemovalMethod = null;
                    let facialHairRemovalFrequency = null;
                    let makeupType = null;
                    let stressSkinIssues = null;
                    
                    if (lifestyleFactors.includes('facial-hair-removal')) {
                      facialHairRemovalMethod = 'shaving'; // Use one representative value
                      facialHairRemovalFrequency = 'weekly';
                    }
                    
                    if (lifestyleFactors.includes('makeup')) {
                      makeupType = 'medium'; // Use one representative value
                    }
                    
                    if (lifestyleFactors.includes('stress')) {
                      stressSkinIssues = ['breakouts']; // Use one representative value
                    }
                    
                    // Scent preferences - use a few key options
                    const scentPreferences = ['unscented', 'no-preference'];
                    
                    for (const scentPreference of scentPreferences) {
                      // Allergies - use a few key combinations
                      const allergyOptions = [
                        [], // No allergies
                        ['fragrance'],
                        ['alcohol'],
                        ['retinol'],
                        ['fragrance', 'alcohol'],
                      ];
                      
                      for (const allergies of allergyOptions) {
                        // Preferences - use a few key combinations
                        const preferenceOptions = [
                          [], // No preferences
                          ['vegan'],
                          ['cruelty-free'],
                          ['fragrance-free'],
                          ['vegan', 'cruelty-free'],
                        ];
                        
                        for (const preferences of preferenceOptions) {
                          const profile = {
                            ageRange,
                            skinType,
                            sensitivity,
                            primaryConcerns,
                            acneSeverity: acneSeverity,
                            currentRoutine: routine,
                            sunExposure,
                            climate,
                            lifestyleFactors,
                            facialHairRemovalMethod,
                            facialHairRemovalFrequency,
                            makeupType,
                            stressSkinIssues,
                            scentPreference: Array.isArray(scentPreference) ? scentPreference : [scentPreference],
                            allergies,
                            preferences,
                          };
                          
                          profiles.push(profile);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  console.log(`📊 Generated ${profiles.length} user profiles`);
  return profiles;
}

/**
 * Generate a smaller, more manageable set of representative profiles
 * This focuses on the most important combinations
 */
export function generateRepresentativeProfiles() {
  const profiles = [];
  
  // Focus on key combinations - reduce the number significantly
  const keyAgeRanges = ['18-25', '26-35', '36-45'];
  const keySkinTypes = ['oily', 'dry', 'combination', 'normal', 'sensitive'];
  const keySensitivities = ['very', 'not'];
  const keyRoutines = ['none', 'moderate'];
  const keySunExposures = ['minimal', 'high'];
  const keyClimates = ['hot-humid', 'cold-dry', 'moderate'];
  
  // Key concern combinations (most common patterns) - reduced set
  const keyConcernCombinations = [
    ['acne'],
    ['aging'],
    ['dryness'],
    ['pigmentation'],
    ['oiliness'],
    ['dullness'],
    ['redness'],
    ['large-pores'],
    ['texture'],
    ['acne', 'oiliness'],
    ['aging', 'pigmentation'],
    ['dryness', 'aging'],
    ['acne', 'texture'],
    ['pigmentation', 'dullness'],
    ['acne', 'oiliness', 'large-pores'],
    ['aging', 'pigmentation', 'dryness'],
  ];
  
  // Generate profiles with strategic sampling
  // For each concern combination, test with different age/skin type combinations
  for (const primaryConcerns of keyConcernCombinations) {
    const hasAcne = primaryConcerns.includes('acne');
    const acneSeverity = hasAcne ? 'moderate' : null;
    
    // Test with different age ranges
    for (const ageRange of keyAgeRanges) {
      // Test with different skin types
      for (const skinType of keySkinTypes) {
        // Test with different sensitivities (but not all combinations)
        const sensitivity = (skinType === 'sensitive') ? 'very' : 'not';
        
        // Test with different routines
        for (const routine of keyRoutines) {
          // Test with different sun exposures
          for (const sunExposure of keySunExposures) {
            // Test with different climates
            for (const climate of keyClimates) {
              // Lifestyle factors - test a few key combinations
              // Use index-based selection for deterministic results
              const profileIndex = profiles.length;
              const lifestyleOptions = [
                [],
                ...(profileIndex % 10 === 0 ? [['stress']] : []),
                ...(profileIndex % 15 === 0 ? [['makeup']] : []),
                ...(profileIndex % 20 === 0 ? [['facial-hair-removal']] : []),
              ];
              
              // Select one lifestyle option based on index
              const lifestyleIndex = profileIndex % 25;
              const lifestyleFactors = lifestyleIndex < 20 ? [] : 
                                      lifestyleIndex < 22 ? ['stress'] :
                                      lifestyleIndex < 24 ? ['makeup'] : ['facial-hair-removal'];
              
              let facialHairRemovalMethod = null;
              let facialHairRemovalFrequency = null;
              let makeupType = null;
              let stressSkinIssues = null;
              
              if (lifestyleFactors.includes('facial-hair-removal')) {
                facialHairRemovalMethod = 'shaving';
                facialHairRemovalFrequency = 'weekly';
              }
              
              if (lifestyleFactors.includes('makeup')) {
                makeupType = 'medium';
              }
              
              if (lifestyleFactors.includes('stress')) {
                stressSkinIssues = ['breakouts'];
              }
              
              // Allergies and preferences - sample strategically based on index
              const allergyIndex = profileIndex % 10;
              const allergies = allergyIndex < 8 ? [] : 
                               allergyIndex === 8 ? ['fragrance'] : ['alcohol'];
              
              const preferenceIndex = profileIndex % 10;
              const preferences = preferenceIndex < 8 ? [] : 
                                 preferenceIndex === 8 ? ['vegan'] : ['fragrance-free'];
              
              const profile = {
                ageRange,
                skinType,
                sensitivity,
                primaryConcerns,
                acneSeverity,
                currentRoutine: routine,
                sunExposure,
                climate,
                lifestyleFactors,
                facialHairRemovalMethod,
                facialHairRemovalFrequency,
                makeupType,
                stressSkinIssues,
                scentPreference: ['unscented'],
                allergies,
                preferences,
              };
              
              profiles.push(profile);
            }
          }
        }
      }
    }
  }
  
  console.log(`📊 Generated ${profiles.length} representative user profiles`);
  return profiles;
}

