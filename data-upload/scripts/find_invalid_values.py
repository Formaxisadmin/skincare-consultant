#!/usr/bin/env python3
import pandas as pd
from collections import defaultdict
import re

csv_file = "4-12-25 DB.csv"
output_file = "invalid_values_report.txt"

# Try different encodings
try:
    df = pd.read_csv(csv_file, encoding='utf-8')
except UnicodeDecodeError:
    try:
        df = pd.read_csv(csv_file, encoding='latin-1')
    except:
        df = pd.read_csv(csv_file, encoding='cp1252')

# Filter to only rows with actual product names
if 'NAME' in df.columns:
    df = df[df['NAME'].notna() & (df['NAME'].astype(str).str.strip() != '')]

# Validation sets
VALID_CATEGORIES = {'CLEANSERS', 'TONERS', 'SERUMS & AMPOULES', 'MOISTURIZERS', 
                   'SUNSCREENS', 'MASKS & PEELS', 'EYE CARE', 'TREATMENTS', 'OTHER'}

VALID_SKIN_TYPES = {'oily', 'dry', 'combination', 'normal', 'sensitive'}

VALID_GENDERS = {'male', 'female', 'neutral'}

VALID_TEXTURES = {'gel', 'lightweight', 'gel-cream', 'cream', 'rich-cream', 'balm'}

VALID_USAGE = {'morning', 'evening', 'both'}

VALID_FREQUENCY = {'daily', 'weekly', 'alternate', 'as-needed', 'nightly',
                   '1-2-times-a-week', '2-3-times-a-week', '3-4-times-a-week', 
                   'reapply-as-needed'}

VALID_CLIMATES = {'hot-humid', 'cold-dry', 'temperate', 'tropical', 'all'}

CORE_CONCERNS = {'acne', 'pigmentation', 'aging', 'dryness', 'oiliness', 'dullness', 
                 'redness', 'dark-circles', 'large-pores', 'texture'}

EXTENDED_CONCERNS = {
    'blackheads', 'whiteheads', 'pimples', 'blemishes', 'mild-acne', 'acne-prone', 'breakouts',
    'hyperpigmentation', 'acne-scars', 'dark-spots', 'uneven-tone', 'uneven-skin-tone', 'scars',
    'fine-lines', 'wrinkles', 'anti-aging', 'loss-of-elasticity', 'loss-of-firmness', 'elasticity',
    'dehydration', 'compromised-barrier', 'barrier-repair', 'barrier-support', 'flakiness', 'chapped-lips',
    'sebum-control', 'excess-sebum', 'oil-control', 'loss-of-glow',
    'sensitivity', 'irritation', 'puffiness',
    'pores', 'pore-care', 'pore-cleansing', 'enlarged-pores',
    'uneven-texture', 'rough-texture', 'gentle-exfoliation', 'mild-exfoliation'
}
VALID_CONCERNS = CORE_CONCERNS | EXTENDED_CONCERNS

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
    'unscented', 'no-fragrance', 'citrus', 'lemon', 'orange', 'grapefruit',
    'floral', 'rose', 'lavender', 'jasmine', 'woody', 'spicy', 'sandalwood',
    'cedar', 'fresh', 'clean', 'mint', 'eucalyptus',
    'brightening', 'deep-cleansing', 'hydrating', 'softening', 'barrier-repair',
    'cooling', 'multi-use', 'non-sticky', 'pore-care', 'double-cleansing', 
    'non-greasy', 'makeup-removal', 'vitamin-rich', 'radiance', 'spot-correction',
    'firming', 'plumping', 'nourishing', 'overnight-treatment', 'biodegradable',
    'exfoliating', 'hanbang', 'de-puffing', 'vitalizing', 'travel-size',
    'cult-favourite', 'vegan-friendly', 'no-white-cast', 'glow-finish',
    'repairing', 'hydration', 'repairing', 'revitalizing', 'antioxidant-rich',
    'mattifying', 'even-tone'
}

invalid_values = defaultdict(list)

def parse_array(value):
    if pd.isna(value) or value == '':
        return []
    return [item.strip().lower() for item in str(value).split(',') if item.strip()]

def parse_boolean(value):
    if pd.isna(value):
        return None
    value_str = str(value).strip().upper()
    if value_str in ['TRUE', '1', 'YES', 'Y']:
        return True
    elif value_str in ['FALSE', '0', 'NO', 'N']:
        return False
    return None

with open(output_file, 'w', encoding='utf-8') as f:
    f.write("=" * 80 + "\n")
    f.write("INVALID VALUES REPORT\n")
    f.write("=" * 80 + "\n\n")
    f.write(f"Total products analyzed: {len(df)}\n\n")
    
    # Check each row
    for idx, row in df.iterrows():
        row_num = idx + 2
        
        # Check CATEGORY
        if 'CATEGORY' in df.columns:
            category = row.get('CATEGORY', '')
            if pd.notna(category):
                category = str(category).strip().upper()
                if category not in VALID_CATEGORIES:
                    invalid_values['CATEGORY'].append({
                        'row': row_num,
                        'value': category,
                        'name': str(row.get('NAME', 'N/A'))
                    })
            elif pd.isna(category) or str(category).strip() == '':
                invalid_values['CATEGORY (REQUIRED)'].append({
                    'row': row_num,
                    'value': 'EMPTY',
                    'name': str(row.get('NAME', 'N/A'))
                })
        
        # Check SKINTYPES
        if 'SKINTYPES' in df.columns:
            skin_types = parse_array(row.get('SKINTYPES', ''))
            for st in skin_types:
                if st not in VALID_SKIN_TYPES:
                    invalid_values['SKINTYPES'].append({
                        'row': row_num,
                        'value': st,
                        'name': str(row.get('NAME', 'N/A'))
                    })
        
        # Check CONCERNSADDRESSED
        if 'CONCERNSADDRESSED' in df.columns:
            concerns = parse_array(row.get('CONCERNSADDRESSED', ''))
            for concern in concerns:
                if concern not in VALID_CONCERNS:
                    invalid_values['CONCERNSADDRESSED'].append({
                        'row': row_num,
                        'value': concern,
                        'name': str(row.get('NAME', 'N/A'))
                    })
        
        # Check SENSITIVITYSAFE
        if 'SENSITIVITYSAFE' in df.columns:
            sens_safe = parse_boolean(row.get('SENSITIVITYSAFE', ''))
            if sens_safe is None and pd.notna(row.get('SENSITIVITYSAFE', '')):
                invalid_values['SENSITIVITYSAFE'].append({
                    'row': row_num,
                    'value': str(row.get('SENSITIVITYSAFE', '')),
                    'name': str(row.get('NAME', 'N/A'))
                })
        
        # Check INSTOCK
        if 'INSTOCK' in df.columns:
            in_stock = parse_boolean(row.get('INSTOCK', ''))
            if in_stock is None and pd.notna(row.get('INSTOCK', '')):
                invalid_values['INSTOCK'].append({
                    'row': row_num,
                    'value': str(row.get('INSTOCK', '')),
                    'name': str(row.get('NAME', 'N/A'))
                })
        
        # Check GENDER
        if 'GENDER' in df.columns:
            gender = row.get('GENDER', '')
            if pd.notna(gender) and str(gender).strip():
                gender = str(gender).strip().lower()
                if gender not in VALID_GENDERS:
                    invalid_values['GENDER'].append({
                        'row': row_num,
                        'value': gender,
                        'name': str(row.get('NAME', 'N/A'))
                    })
        
        # Check TEXTURE
        if 'TEXTURE' in df.columns:
            texture = row.get('TEXTURE', '')
            if pd.notna(texture) and str(texture).strip():
                texture = str(texture).strip().lower()
                if texture not in VALID_TEXTURES:
                    invalid_values['TEXTURE'].append({
                        'row': row_num,
                        'value': texture,
                        'name': str(row.get('NAME', 'N/A'))
                    })
        
        # Check USAGE
        if 'USAGE' in df.columns:
            usage = row.get('USAGE', '')
            if pd.notna(usage) and str(usage).strip():
                usage = str(usage).strip().lower()
                if usage not in VALID_USAGE:
                    invalid_values['USAGE'].append({
                        'row': row_num,
                        'value': usage,
                        'name': str(row.get('NAME', 'N/A'))
                    })
            elif pd.isna(usage) or str(usage).strip() == '':
                invalid_values['USAGE (REQUIRED)'].append({
                    'row': row_num,
                    'value': 'EMPTY',
                    'name': str(row.get('NAME', 'N/A'))
                })
        
        # Check FREQUENCY
        if 'FREQUENCY' in df.columns:
            frequency = row.get('FREQUENCY', '')
            if pd.notna(frequency) and str(frequency).strip():
                frequency = str(frequency).strip().lower()
                if frequency not in VALID_FREQUENCY:
                    invalid_values['FREQUENCY'].append({
                        'row': row_num,
                        'value': frequency,
                        'name': str(row.get('NAME', 'N/A'))
                    })
        
        # Check CLIMATESUITABILITY
        if 'CLIMATESUITABILITY' in df.columns:
            climates = parse_array(row.get('CLIMATESUITABILITY', ''))
            for climate in climates:
                if climate not in VALID_CLIMATES:
                    invalid_values['CLIMATESUITABILITY'].append({
                        'row': row_num,
                        'value': climate,
                        'name': str(row.get('NAME', 'N/A'))
                    })
        
        # Check PREFERENCES
        if 'PREFERENCES' in df.columns:
            preferences = parse_array(row.get('PREFERENCES', ''))
            for pref in preferences:
                if pref not in VALID_PREFERENCES:
                    invalid_values['PREFERENCES'].append({
                        'row': row_num,
                        'value': pref,
                        'name': str(row.get('NAME', 'N/A'))
                    })
        
        # Check RATING
        if 'RATING' in df.columns:
            rating = row.get('RATING', '')
            if pd.notna(rating) and str(rating).strip():
                try:
                    rating_val = float(str(rating).strip())
                    if rating_val < 0 or rating_val > 5:
                        invalid_values['RATING'].append({
                            'row': row_num,
                            'value': str(rating_val),
                            'name': str(row.get('NAME', 'N/A'))
                        })
                except:
                    invalid_values['RATING'].append({
                        'row': row_num,
                        'value': str(rating),
                        'name': str(row.get('NAME', 'N/A'))
                    })
    
    # Write results
    if not invalid_values:
        f.write("✓ No invalid values found! All data is valid according to the schema.\n")
    else:
        f.write("INVALID VALUES FOUND:\n\n")
        for field, errors in sorted(invalid_values.items()):
            f.write("=" * 80 + "\n")
            f.write(f"FIELD: {field}\n")
            f.write(f"Total invalid entries: {len(errors)}\n")
            f.write("=" * 80 + "\n\n")
            
            # Group by value
            value_groups = defaultdict(list)
            for error in errors:
                value_groups[error['value']].append(error)
            
            for value, occurrences in sorted(value_groups.items()):
                f.write(f"  Invalid Value: '{value}'\n")
                f.write(f"  Found in {len(occurrences)} product(s):\n")
                for occ in occurrences[:20]:  # Limit to first 20 per value
                    f.write(f"    - Row {occ['row']}: {occ['name']}\n")
                if len(occurrences) > 20:
                    f.write(f"    ... and {len(occurrences) - 20} more\n")
                f.write("\n")
    
    f.write("\n" + "=" * 80 + "\n")
    f.write("VALIDATION COMPLETE\n")
    f.write("=" * 80 + "\n")
    
    print(f"Report saved to: {output_file}")

