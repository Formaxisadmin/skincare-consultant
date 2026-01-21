"""
Validation Configuration for K-Beauty Product Data Upload

This module contains all validation sets and mapping dictionaries used for
data normalization and validation. Separated from the main upload script for
easier maintenance and updates by non-developers.

IMPORTANT: When updating these lists, ensure consistency with the database schema
defined in docs/DATABASE_SCHEMA.md
"""

# ============================================================================
# VALIDATION SETS
# ============================================================================

VALID_CATEGORIES = {
    'cleanser', 'toner', 'serum', 'moisturizer', 'spf', 'mask', 
    'eye_cream', 'treatment', 'other'
}

VALID_SKIN_TYPES = {
    'oily', 'dry', 'combination', 'normal', 'sensitive'
}

VALID_GENDERS = {
    'male', 'female', 'neutral'
}

# Core textures - used by recommendation engine for texture preference matching
VALID_TEXTURES = {
    'gel', 'lightweight', 'gel-cream', 'cream', 'rich-cream', 'balm'
}

VALID_USAGE = {
    'morning', 'evening', 'both'
}

VALID_FREQUENCY = {
    # Core frequencies
    'daily', 'weekly', 'alternate',
    # Extended frequencies
    'as-needed', 'nightly',
    '1-2-times-a-week', '2-3-times-a-week', '3-4-times-a-week',
    'reapply-as-needed',
}

VALID_CLIMATES = {
    'hot-humid', 'cold-dry', 'temperate', 'tropical'
}

# Core concerns used by recommendation engine (must match concernMapping.js)
CORE_CONCERNS = {
    'acne', 'pigmentation', 'aging', 'dryness', 'oiliness', 'dullness',
    'redness', 'dark-circles', 'large-pores', 'texture'
}

# Extended concerns (automatically mapped to core concerns during upload)
EXTENDED_CONCERNS = {
    'blackheads', 'whiteheads', 'pimples', 'blemishes', 'mild-acne', 
    'acne-prone', 'breakouts',
    'hyperpigmentation', 'acne-scars', 'dark-spots', 'uneven-tone', 
    'uneven-skin-tone', 'scars',
    'fine-lines', 'wrinkles', 'anti-aging', 'loss-of-elasticity', 
    'loss-of-firmness', 'elasticity',
    'dehydration', 'compromised-barrier', 'barrier-repair', 'barrier-support', 
    'flakiness', 'chapped-lips',
    'sebum-control', 'excess-sebum', 'oil-control',
    'loss-of-glow',
    'sensitivity', 'irritation',
    'puffiness',
    'pores', 'pore-care', 'pore-cleansing', 'enlarged-pores',
    'uneven-texture', 'rough-texture', 'gentle-exfoliation', 'mild-exfoliation',
    'hydration', 'uv-protection'  # Added hydration and uv-protection
}

VALID_CONCERNS = CORE_CONCERNS | EXTENDED_CONCERNS

# Expanded VALID_PREFERENCES - includes all reasonable K-Beauty preferences
# from actual product data to prevent data loss
VALID_PREFERENCES = {
    # === Core preferences (existing) ===
    'vegan', 'cruelty-free', 'fragrance-free', 'natural', 'organic',
    
    # === Product characteristics ===
    'low-ph', 'mild-formula', 'paraben-free', 'high-strength-active', 'oil-free',
    'non-comedogenic', 'no-white-cast', 'matte-finish', 'ph-balanced',
    'hypoallergenic', 'clean-formula', 'long-lasting', 'non-sticky',
    
    # === Product benefits ===
    'soothing', 'nourishing', 'moisturizing', 'refreshing', 'cooling',
    'brightening', 'anti-aging', 'gentle-exfoliation', 'intensive-moisture',
    
    # === Usage characteristics ===
    'beginner-friendly', 'daily-use', 'multi-use', 'multi-tasking',
    
    # === Special categories ===
    'hanbang', 'cult-favourite', 'vegan-friendly', 'pore-care', 'oil-control',
    'lightweight', 'essence-like',
    
    # === Scent tags (for fragrance preference matching) ===
    'unscented', 'no-fragrance', 'citrus', 'lemon', 'orange', 'grapefruit',
    'floral', 'rose', 'lavender', 'jasmine', 'woody', 'spicy', 'sandalwood',
    'cedar', 'fresh', 'clean', 'mint', 'eucalyptus',
    
    # === Expanded preferences from actual product data ===
    # Acne-related
    'acne-care', 'acne-fighting', 'acne-safe',
    
    # Alcohol
    'alcohol-free',
    
    # Allergen
    'allergen-free',
    
    # Barrier
    'barrier-strengthening', 'barrier-support',
    
    # Blackheads/Whiteheads
    'blackhead-removal', 'whitehead-removal',
    
    # Protection
    'blue-light-protection', 'reef-safe',
    
    # Scent-related
    'bold-scent', 'citrus-scent', 'floral-scent', 'fresh-scent',
    'fragrance-rich', 'seductive-scent', 'sweet-scent',
    
    # Texture/Finish
    'buildable-coverage', 'color-correcting', 'dewy-finish',
    'invisible-finish', 'luminous-finish',
    'natural-finish', 'radiant-finish',
    
    # Calming/Healing
    'calming', 'anti-inflammatory', 'healing', 'redness-relief',
    
    # Customizable
    'customizable', 'layerable',
    
    # Packaging
    'cute-packaging', 'travel-size', 'portable', 'value-pack',
    
    # Hydration/Moisture
    'deep-hydration', 'deep-moisture', 'intensive-hydration',
    
    # Exfoliation
    'chemical-exfoliation', 'daily-exfoliation', 'mild-exfoliation',
    
    # Pore-related
    'pore-blurring', 'pore-cleansing', 'pore-clearing', 'pore-control',
    'pore-refining', 'pore-tightening',
    
    # Glow/Brightening
    'glow', 'glow-boosting', 'instant-glow', 'vitality',
    
    # Special ingredients
    'hanbang-ingredients', 'herbal-extracts', 'probiotics',
    'protein-rich', 'retinal-liposome',
    
    # Concentration
    'high-concentration', 'high-potency',
    
    # Usage patterns
    'double-cleanse', 'morning-cleanse', 'no-rinse',
    
    # Finish types
    'peel-off', 'tone-up', 'whitening',
    
    # Product-specific
    'makeup-base', 'spot-care', 'spot-treatment', 'travel-kit',
    
    # Skin concerns
    'pigmentation-care', 'texture-improvement', 'texture-smoothing',
    'skin-renewal', 'fades-scars',
    
    # Colors/Tints
    'peach-tint', 'pink-tone', 'purple-tint', 'yellow-tone-correction',
    
    # Filters
    'mineral-filter', 'physical-filter',
    
    # Miscellaneous
    'antioxidant', 'aquatic', 'booster', 'detan', 'elasticity',
    'emulsifies-quickly', 'fast-absorbing', 'fermented', 'frizz-control',
    'gentle-active', 'gentle-cleansing', 'glass-skin', 'honey-texture',
    'large-size', 'lifting', 'low-irritation', 'luxurious', 'melting',
    'micellar-technology', 'minimalist', 'nightly', 'no-grey-cast',
    'non-stripping', 'occlusive', 'peptide-rich', 'ph-balancing',
    'purifying', 'shine-boosting', 'smoothing', 'spf-40', 'stamp-design',
    'water-free', 'double-sided', 'easy-reapplication',
}

# ============================================================================
# MAPPING DICTIONARIES
# ============================================================================

# Concern mapping: maps extended concerns to core concerns
CONCERN_MAPPING = {
    # Acne variations -> acne
    'blackheads': 'acne',
    'whiteheads': 'acne',
    'pimples': 'acne',
    'blemishes': 'acne',
    'mild-acne': 'acne',
    'acne-prone': 'acne',
    'breakouts': 'acne',
    # Pigmentation variations -> pigmentation
    'hyperpigmentation': 'pigmentation',
    'acne-scars': 'pigmentation',
    'dark-spots': 'pigmentation',
    'uneven-tone': 'pigmentation',
    'uneven-skin-tone': 'pigmentation',
    'scars': 'pigmentation',
    # Aging variations -> aging
    'fine-lines': 'aging',
    'wrinkles': 'aging',
    'anti-aging': 'aging',
    'loss-of-elasticity': 'aging',
    'loss-of-firmness': 'aging',
    'elasticity': 'aging',
    # Dryness variations -> dryness
    'dehydration': 'dryness',
    'compromised-barrier': 'dryness',
    'barrier-repair': 'dryness',
    'barrier-support': 'dryness',
    'flakiness': 'dryness',
    'chapped-lips': 'dryness',
    # Oiliness variations -> oiliness
    'sebum-control': 'oiliness',
    'excess-sebum': 'oiliness',
    'oil-control': 'oiliness',
    # Dullness variations -> dullness
    'loss-of-glow': 'dullness',
    # Redness variations -> redness
    'sensitivity': 'redness',
    'irritation': 'redness',
    # Dark circles variations -> dark-circles
    'puffiness': 'dark-circles',
    # Pore variations -> large-pores
    'pores': 'large-pores',
    'pore-care': 'large-pores',
    'pore-cleansing': 'large-pores',
    'enlarged-pores': 'large-pores',
    # Texture variations -> texture
    'uneven-texture': 'texture',
    'rough-texture': 'texture',
    'gentle-exfoliation': 'texture',
    'mild-exfoliation': 'texture',
}

# Climate mapping: maps invalid/alternative climate values to valid ones
CLIMATE_MAPPING = {
    'dry': 'cold-dry',           # 6 products - assume "dry" means "cold-dry" climate
    'hot-dry': 'hot-humid',      # 1 product - map to closest valid value
}

# Texture mapping: maps invalid/alternative texture values to valid ones
# NOTE: Sheet masks are mapped to 'lightweight' as a form-factor fallback.
# The actual category 'mask' should be used to distinguish sheet masks from
# other lightweight products in the frontend.
TEXTURE_MAPPING = {
    # Sheet masks -> lightweight (form factor fallback, use category='mask' for distinction)
    'sheet': 'lightweight',
    'cellulose-sheet': 'lightweight',
    'charcoal-sheet': 'lightweight',
    'soft-sheet': 'lightweight',
    'microfiber-sheet': 'lightweight',
    'hydrogel': 'gel',
    
    # Watery/Liquid -> lightweight
    'watery': 'lightweight',
    'liquid': 'lightweight',
    'water': 'lightweight',
    'watery-gel': 'gel',
    'watery-lotion': 'lightweight',
    'watery-essence': 'lightweight',
    'watery-liquid': 'lightweight',
    'watery-mist': 'lightweight',
    'watery-brown': 'lightweight',
    
    # Lotions -> lightweight
    'lotion': 'lightweight',
    'lotion-cream': 'gel-cream',
    'lotion-gel': 'gel',
    
    # Oils -> lightweight
    'light-oil': 'lightweight',
    'lightweight-oil': 'lightweight',
    
    # Gels -> gel
    'cooling-gel': 'gel',
    'thick-gel': 'gel',
    'viscous-gel': 'gel',
    'dual-phase-gel': 'gel',
    'lightweight-gel': 'gel',
    'essence-gel': 'gel',
    'pudding-gel': 'gel',
    'purple-gel': 'gel',
    
    # Creams -> cream or gel-cream
    'dewy-cream': 'cream',
    'velvet-cream': 'cream',
    'blue-cream': 'cream',
    'creamy': 'cream',
    'creamy-beige': 'cream',
    'creamy-purple': 'cream',
    'creamy-white': 'cream',
    'thick-white-cream': 'rich-cream',
    'yellow-cream': 'cream',
    
    # Serums -> lightweight
    'lightweight-serum': 'lightweight',
    'creamy-serum': 'gel-cream',
    'milky-serum': 'lightweight',
    'viscous': 'gel',
    'viscous-liquid': 'gel',
    'lightweight-liquid': 'lightweight',
    'liquid-ampoule': 'lightweight',
    'rich-fluid': 'gel-cream',
    'milky-fluid': 'lightweight',
    'silky-fluid': 'lightweight',
    
    # Special -> closest match
    'jelly': 'gel',
    'pudding-like': 'gel',
    'sherbet-balm': 'balm',
    'sherbet-scrub': 'balm',
    'balm-stick': 'balm',
    'solid-stick': 'balm',
    
    # Foam/Cleansers -> gel
    'creamy-foam': 'gel',
    'cream-to-foam': 'gel',
    'brown-gel': 'gel',
    
    # Masks -> gel or cream
    'creamy-clay': 'cream',
    'creamy-grain': 'cream',
    'gel-essence-mask': 'gel',
    'slimy-gel-cream': 'gel-cream',
    
    # Balms -> balm
    'balm-to-cream': 'balm',
    
    # Mist -> lightweight
    'bi-phase-mist': 'lightweight',
    
    # Essence-like -> lightweight
    'emulsion-like': 'lightweight',
    'essence-like': 'lightweight',
    'serum-like': 'lightweight',
    'honey-like': 'gel',
    'essence-water': 'lightweight',
    'velvet-mousse': 'gel-cream',
    
    # Complex -> map to closest
    'gel-cream-with-capsules': 'gel-cream',
    'lightweight-with-capsules': 'lightweight',
    'gel-to-film': 'gel',
    
    # Pads -> lightweight
    'pad': 'lightweight',
    
    # Varied -> default to gel-cream (for kits)
    'varied': 'gel-cream',
}

# Frequency mapping: maps extended frequencies to core frequencies
FREQUENCY_MAPPING = {
    'daily (or as tolerated)': 'daily',
    'daily (pm)': 'daily',
    'reapply-as-needed': 'as-needed',
}

# Category mapping (Excel to Database)
CATEGORY_MAP = {
    'CLEANSERS': 'cleanser',
    'TONERS': 'toner',
    'SERUMS & AMPOULES': 'serum',
    'MOISTURIZERS': 'moisturizer',
    'SUNSCREENS': 'spf',
    'MASKS & PEELS': 'mask',
    'EYE CARE': 'eye_cream',
    'TREATMENTS': 'treatment',
    'OTHER': 'other'
}

