#!/usr/bin/env python3
"""
CSV Schema Validation Script
Validates the CSV file against the database schema requirements
"""

import pandas as pd
import sys
import re
from collections import defaultdict

# Configuration
EXCEL_FILE = "4-12-25 DB.xlsx"  # Supports Excel format

# Schema validation rules (from DATABASE_SCHEMA.md)
REQUIRED_FIELDS = ['productId', 'name', 'category', 'inStock', 'skinTypes', 'concernsAddressed', 
                   'sensitivitySafe', 'keyIngredients', 'usage']

VALID_CATEGORIES = {'cleanser', 'toner', 'serum', 'moisturizer', 'spf', 'mask', 'eye_cream', 'treatment', 'other'}
VALID_SKIN_TYPES = {'oily', 'dry', 'combination', 'normal', 'sensitive'}
VALID_GENDERS = {'male', 'female', 'neutral'}
VALID_TEXTURES = {'gel', 'lightweight', 'gel-cream', 'cream', 'rich-cream', 'balm'}
VALID_USAGE = {'morning', 'evening', 'both'}

# Excel to DB category mapping
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

# Core concerns
CORE_CONCERNS = {'acne', 'pigmentation', 'aging', 'dryness', 'oiliness', 'dullness', 
                 'redness', 'dark-circles', 'large-pores', 'texture'}

# Extended concerns (valid but will be mapped to core)
EXTENDED_CONCERNS = {
    'blackheads', 'whiteheads', 'pimples', 'blemishes', 'mild-acne', 'acne-prone', 'breakouts',
    'hyperpigmentation', 'acne-scars', 'dark-spots', 'uneven-tone', 'uneven-skin-tone', 'scars',
    'fine-lines', 'wrinkles', 'anti-aging', 'loss-of-elasticity', 'loss-of-firmness', 'elasticity',
    'dehydration', 'compromised-barrier', 'barrier-repair', 'barrier-support', 'flakiness', 'chapped-lips',
    'sebum-control', 'excess-sebum', 'oil-control',
    'loss-of-glow',
    'sensitivity', 'irritation',
    'puffiness',
    'pores', 'pore-care', 'pore-cleansing', 'enlarged-pores',
    'uneven-texture', 'rough-texture', 'gentle-exfoliation', 'mild-exfoliation'
}

VALID_CONCERNS = CORE_CONCERNS | EXTENDED_CONCERNS

VALID_FREQUENCY = {'daily', 'weekly', 'alternate', 'as-needed', 'nightly',
                   '1-2-times-a-week', '2-3-times-a-week', '3-4-times-a-week', 'reapply-as-needed'}

VALID_CLIMATES = {'hot-humid', 'cold-dry', 'temperate', 'tropical'}

VALID_PREFERENCES = {
    'vegan', 'cruelty-free', 'fragrance-free', 'natural', 'organic',
    'low-ph', 'mild-formula', 'paraben-free', 'high-strength-active', 'oil-free',
    'non-comedogenic', 'no-white-cast', 'matte-finish', 'ph-balanced',
    'hypoallergenic', 'clean-formula', 'long-lasting', 'non-sticky',
    'soothing', 'nourishing', 'moisturizing', 'refreshing', 'cooling',
    'brightening', 'anti-aging', 'gentle-exfoliation', 'intensive-moisture',
    'beginner-friendly', 'daily-use', 'multi-use', 'multi-tasking',
    'hanbang', 'cult-favourite', 'vegan-friendly', 'pore-care', 'oil-control',
    'lightweight', 'essence-like',
    # Scent tags
    'unscented', 'no-fragrance', 'citrus', 'lemon', 'orange', 'grapefruit',
    'floral', 'rose', 'lavender', 'jasmine', 'woody', 'spicy', 'sandalwood',
    'cedar', 'fresh', 'clean', 'mint', 'eucalyptus'
}

# Excel column names mapping
EXCEL_COLUMNS = {
    'PRODUCTID': 'productId',
    'NAME': 'name',
    'BRAND': 'brand',
    'CATEGORY': 'category',
    'SUBCATEGORY': 'subCategory',
    'MRP': 'mrp',
    'WEIGHT': 'weight',
    'SKINTYPES': 'skinTypes',
    'CONCERNSADDRESSED': 'concernsAddressed',
    'SENSITIVITYSAFE': 'sensitivitySafe',
    'KEYINGREDIENTS': 'keyIngredients',
    'FULLINGREDIENTLIST': 'fullIngredientList',
    'FULLINGREDIENTSLIST': 'fullIngredientList',  # Handle typo
    'GENDER': 'gender',
    'TEXTURE': 'texture',
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
    'INSTOCK': 'inStock'
}


def parse_array(value):
    """Parse comma-separated array field"""
    if pd.isna(value) or value == '':
        return []
    if isinstance(value, str):
        return [item.strip().lower() for item in value.split(',') if item.strip()]
    return []


def parse_boolean(value):
    """Parse boolean field"""
    if pd.isna(value):
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        v = value.strip().lower()
        return v in ['true', '1', 'yes']
    return bool(value)


def normalize_ingredient(ingredient):
    """Normalize ingredient: lowercase, replace spaces with hyphens"""
    if not ingredient or pd.isna(ingredient):
        return ''
    ingredient = str(ingredient).strip().lower()
    # Replace spaces and special characters with hyphens
    ingredient = re.sub(r'[\s/]+', '-', ingredient)
    # Remove special characters but keep hyphens
    ingredient = re.sub(r'[^a-z0-9\-]', '', ingredient)
    return ingredient


def check_ingredient_format(ingredient):
    """Check if ingredient is properly normalized"""
    if not ingredient:
        return True
    normalized = normalize_ingredient(ingredient)
    # Check if it contains uppercase or spaces (not normalized)
    if ingredient != normalized and ingredient.lower() != normalized:
        return False
    return True


def validate_csv():
    """Main validation function"""
    print("=" * 80)
    print("DATA SCHEMA VALIDATION REPORT")
    print("=" * 80)
    print(f"\nValidating file: {EXCEL_FILE}\n")
    
    errors = []
    warnings = []
    stats = defaultdict(int)
    
    try:
        # Read Excel file
        df = pd.read_excel(EXCEL_FILE)
        print(f"✓ Excel file loaded successfully")
        print(f"✓ Total rows: {len(df)}")
        print(f"✓ Total columns: {len(df.columns)}\n")
        
        # Check for required columns
        print("-" * 80)
        print("1. CHECKING REQUIRED COLUMNS")
        print("-" * 80)
        
        # Map Excel columns to DB fields
        excel_columns_lower = {col.upper(): col for col in df.columns}
        required_excel_cols = ['PRODUCTID', 'NAME', 'CATEGORY', 'INSTOCK', 'SKINTYPES', 
                              'CONCERNSADDRESSED', 'SENSITIVITYSAFE', 'KEYINGREDIENTS', 'USAGE']
        
        missing_cols = []
        for req_col in required_excel_cols:
            if req_col not in excel_columns_lower:
                missing_cols.append(req_col)
                errors.append(f"Missing required column: {req_col}")
            else:
                print(f"✓ Found required column: {req_col}")
        
        if missing_cols:
            print(f"\n✗ Missing required columns: {', '.join(missing_cols)}")
        else:
            print(f"\n✓ All required columns present")
        
        # Check for PRODUCTID column (critical)
        if 'PRODUCTID' not in excel_columns_lower:
            errors.append("CRITICAL: PRODUCTID column is missing. This is required for unique product identification.")
        else:
            print(f"\n✓ PRODUCTID column found")
        
        # Column mapping check
        print("\n" + "-" * 80)
        print("2. CHECKING COLUMN NAMES")
        print("-" * 80)
        
        # Check for typo in FULLINGREDIENTLIST
        if 'FULLINGREDIENTSLIST' in excel_columns_lower and 'FULLINGREDIENTLIST' not in excel_columns_lower:
            warnings.append("Column name typo detected: 'FULLINGREDIENTSLIST' should be 'FULLINGREDIENTLIST' (missing 'E'). This is handled by the upload script.")
            print("⚠ Column name typo: FULLINGREDIENTSLIST (should be FULLINGREDIENTLIST)")
        
        print(f"\nFound columns: {', '.join(df.columns)}\n")
        
        # Validate each row
        print("-" * 80)
        print("3. VALIDATING DATA ROWS")
        print("-" * 80)
        
        product_ids = set()
        
        for idx, row in df.iterrows():
            row_num = idx + 2  # +2 because CSV is 1-indexed and has header
            
            # Check PRODUCTID (if exists)
            if 'PRODUCTID' in df.columns:
                product_id = row.get('PRODUCTID', '')
                if pd.isna(product_id) or str(product_id).strip() == '':
                    errors.append(f"Row {row_num}: Missing PRODUCTID")
                else:
                    product_id = str(product_id).strip()
                    if product_id in product_ids:
                        errors.append(f"Row {row_num}: Duplicate PRODUCTID '{product_id}'")
                    else:
                        product_ids.add(product_id)
            
            # Check NAME
            name = row.get('NAME', '')
            if pd.isna(name) or str(name).strip() == '':
                errors.append(f"Row {row_num}: Missing NAME")
            
            # Check CATEGORY
            category = row.get('CATEGORY', '')
            if pd.isna(category) or str(category).strip() == '':
                errors.append(f"Row {row_num}: Missing CATEGORY")
            else:
                category = str(category).strip().upper()
                if category not in CATEGORY_MAP:
                    errors.append(f"Row {row_num}: Invalid CATEGORY '{category}'. Valid: {', '.join(CATEGORY_MAP.keys())}")
            
            # Check INSTOCK
            in_stock = row.get('INSTOCK', '')
            in_stock_bool = parse_boolean(in_stock)
            if in_stock_bool is None:
                errors.append(f"Row {row_num}: Invalid INSTOCK value '{in_stock}'. Must be true/false")
            
            # Check SKINTYPES
            skin_types = parse_array(row.get('SKINTYPES', ''))
            for st in skin_types:
                if st not in VALID_SKIN_TYPES:
                    errors.append(f"Row {row_num}: Invalid SKINTYPE '{st}'. Valid: {', '.join(VALID_SKIN_TYPES)}")
            
            # Check CONCERNSADDRESSED
            concerns = parse_array(row.get('CONCERNSADDRESSED', ''))
            for concern in concerns:
                if concern not in VALID_CONCERNS:
                    warnings.append(f"Row {row_num}: Unknown concern '{concern}'. May need to be added to VALID_CONCERNS or mapped to core concern.")
            
            # Check SENSITIVITYSAFE
            sens_safe = row.get('SENSITIVITYSAFE', '')
            sens_safe_bool = parse_boolean(sens_safe)
            if sens_safe_bool is None:
                errors.append(f"Row {row_num}: Invalid SENSITIVITYSAFE value '{sens_safe}'. Must be true/false")
            
            # Check KEYINGREDIENTS
            key_ingredients = parse_array(row.get('KEYINGREDIENTS', ''))
            for ing in key_ingredients:
                if not check_ingredient_format(ing):
                    warnings.append(f"Row {row_num}: KEYINGREDIENT '{ing}' may not be properly normalized (should be lowercase with hyphens)")
            
            # Check FULLINGREDIENTLIST (handle typo)
            full_ing_col = 'FULLINGREDIENTSLIST' if 'FULLINGREDIENTSLIST' in df.columns else 'FULLINGREDIENTLIST'
            if full_ing_col in df.columns:
                full_ingredients = row.get(full_ing_col, '')
                if pd.isna(full_ingredients) or str(full_ingredients).strip() == '':
                    warnings.append(f"Row {row_num}: FULLINGREDIENTLIST is empty. This is CRITICAL for allergy checking.")
                else:
                    # Check if ingredients are normalized
                    ing_list = str(full_ingredients)
                    # Check for common normalization issues
                    if any(c.isupper() for c in ing_list if c.isalpha()):
                        warnings.append(f"Row {row_num}: FULLINGREDIENTLIST contains uppercase letters. Should be normalized to lowercase.")
                    if '/' in ing_list or ',' in ing_list:
                        # Check if it's properly formatted
                        pass  # Can have commas and slashes, but should be normalized
            
            # Check GENDER
            if 'GENDER' in df.columns:
                gender = row.get('GENDER', '')
                if not pd.isna(gender) and str(gender).strip():
                    gender = str(gender).strip().lower()
                    if gender not in VALID_GENDERS:
                        warnings.append(f"Row {row_num}: Invalid GENDER '{gender}'. Valid: {', '.join(VALID_GENDERS)}")
            
            # Check TEXTURE
            if 'TEXTURE' in df.columns:
                texture = row.get('TEXTURE', '')
                if not pd.isna(texture) and str(texture).strip():
                    texture = str(texture).strip().lower()
                    if texture not in VALID_TEXTURES:
                        # Check for variations
                        texture_variations = {
                            'creamy-foam', 'lightweight-lotion', 'lightweight-oil', 
                            'viscous-liquid', 'milky-serum', 'emulsion-like', 
                            'creamy-clay', 'lotion', 'cream', 'gel', 'sheet',
                            'creamy-grain', 'viscous', 'watery', 'essence-like'
                        }
                        if texture not in texture_variations:
                            warnings.append(f"Row {row_num}: TEXTURE '{texture}' may not match schema. Valid: {', '.join(VALID_TEXTURES)}")
            
            # Check USAGE
            usage = row.get('USAGE', '')
            if pd.isna(usage) or str(usage).strip() == '':
                errors.append(f"Row {row_num}: Missing USAGE")
            else:
                usage = str(usage).strip().lower()
                if usage not in VALID_USAGE:
                    errors.append(f"Row {row_num}: Invalid USAGE '{usage}'. Valid: {', '.join(VALID_USAGE)}")
            
            # Check FREQUENCY
            if 'FREQUENCY' in df.columns:
                frequency = row.get('FREQUENCY', '')
                if not pd.isna(frequency) and str(frequency).strip():
                    frequency = str(frequency).strip().lower()
                    if frequency not in VALID_FREQUENCY:
                        warnings.append(f"Row {row_num}: FREQUENCY '{frequency}' may not match schema. Valid: {', '.join(VALID_FREQUENCY)}")
            
            # Check CLIMATESUITABILITY
            if 'CLIMATESUITABILITY' in df.columns:
                climates = parse_array(row.get('CLIMATESUITABILITY', ''))
                for climate in climates:
                    if climate not in VALID_CLIMATES and climate != 'all':
                        warnings.append(f"Row {row_num}: Invalid CLIMATE '{climate}'. Valid: {', '.join(VALID_CLIMATES)} or 'all'")
            
            # Check PREFERENCES
            if 'PREFERENCES' in df.columns:
                preferences = parse_array(row.get('PREFERENCES', ''))
                for pref in preferences:
                    if pref not in VALID_PREFERENCES:
                        warnings.append(f"Row {row_num}: Unknown preference '{pref}'. May not match user preferences in questionnaire.")
            
            # Count categories
            if 'CATEGORY' in df.columns:
                cat = row.get('CATEGORY', '').strip().upper()
                if cat in CATEGORY_MAP:
                    stats[f"category_{CATEGORY_MAP[cat]}"] += 1
        
        print(f"✓ Validated {len(df)} rows")
        print(f"✓ Found {len(product_ids)} unique product IDs")
        
        # Print statistics
        print("\n" + "-" * 80)
        print("4. DATA STATISTICS")
        print("-" * 80)
        for key, value in sorted(stats.items()):
            if key.startswith('category_'):
                print(f"  {key.replace('category_', '').capitalize()}: {value}")
        
        # Summary
        print("\n" + "=" * 80)
        print("VALIDATION SUMMARY")
        print("=" * 80)
        
        print(f"\n✓ Total rows validated: {len(df)}")
        print(f"✗ Errors found: {len(errors)}")
        print(f"⚠ Warnings found: {len(warnings)}")
        
        if errors:
            print("\n" + "=" * 80)
            print("ERRORS (MUST FIX):")
            print("=" * 80)
            for i, error in enumerate(errors, 1):
                print(f"{i}. {error}")
        
        if warnings:
            print("\n" + "=" * 80)
            print("WARNINGS (SHOULD REVIEW):")
            print("=" * 80)
            for i, warning in enumerate(warnings[:50], 1):  # Limit to first 50 warnings
                print(f"{i}. {warning}")
            if len(warnings) > 50:
                print(f"\n... and {len(warnings) - 50} more warnings")
        
        if not errors and not warnings:
            print("\n✓ All validations passed! CSV is ready for upload.")
        elif not errors:
            print("\n⚠ CSV has warnings but no critical errors. Review warnings before upload.")
        else:
            print("\n✗ CSV has errors that must be fixed before upload.")
        
        return len(errors) == 0
        
    except Exception as e:
        print(f"\n✗ Error reading Excel file: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = validate_csv()
    sys.exit(0 if success else 1)

