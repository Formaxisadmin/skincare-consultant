import pandas as pd
from pymongo import MongoClient
import sys
import re
import io
import os
import hashlib

# Import validation configuration
from validation_config import (
    VALID_CATEGORIES, VALID_SKIN_TYPES, VALID_GENDERS, VALID_TEXTURES,
    VALID_USAGE, VALID_FREQUENCY, VALID_CLIMATES,
    CORE_CONCERNS, VALID_CONCERNS, CONCERN_MAPPING,
    VALID_PREFERENCES,
    CLIMATE_MAPPING, TEXTURE_MAPPING, FREQUENCY_MAPPING, CATEGORY_MAP
)

# Fix Windows console encoding issue with emojis
if sys.platform == 'win32':
    # Set console to UTF-8 mode
    os.system('chcp 65001 >nul 2>&1')
    # Wrap stdout/stderr to handle UTF-8 encoding
    if hasattr(sys.stdout, 'buffer'):
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
    if hasattr(sys.stderr, 'buffer'):
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace', line_buffering=True)

# --- CONFIGURATION ---
MONGO_URI = "mongodb+srv://admin:testddata@testdata.ciw1xne.mongodb.net/kbeauty_platform?retryWrites=true&w=majority&appName=Testdata"
DATABASE_NAME = "kbeauty_platform"
COLLECTION_NAME = "products"

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Accept CSV file path from command line argument, or use default
if len(sys.argv) > 1:
    CSV_FILE_PATH = os.path.join(SCRIPT_DIR, sys.argv[1])
else:
    CSV_FILE_PATH = os.path.join(SCRIPT_DIR, "4-12-25 DB.csv")

# --- DEFINITIVE MAPPING FOR CATEGORIES AND COLUMNS ---
# This ensures the data in MongoDB perfectly matches the frontend code's expectations.
# CATEGORY_MAP is now imported from validation_config.py

COLUMN_MAP = {
    'PRODUCTID': 'productId',
    'NAME': 'name',
    'BRAND': 'brand',
    'SUBCATEGORY': 'subCategory',
    'MRP': 'mrp',
    'WEIGHT': 'weight',
    'SKINTYPES': 'skinTypes',
    'CONCERNSADDRESSED': 'concernsAddressed',
    'SENSITIVITYSAFE': 'sensitivitySafe',
    'KEYINGREDIENTS': 'keyIngredients',
    'FULLINGREDIENTLIST': 'fullIngredientList',  # For allergy checking
    'FULLINGRIEDIENTSLIST': 'fullIngredientList',  # Handle typo in CSV
    'GENDER': 'gender',  # For gender-specific recommendations
    'TEXTURE': 'texture',  # For age-based texture preferences
    'Texture': 'texture',  # Handle case variation
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
    'INSTOCK': 'inStock',
    'SHOPIFYPRODUCTID': 'shopifyProductId',
    'SHOPIFYPRODCUTID': 'shopifyProductId',  # Handle typo in CSV
    'SHOPIFYVARIANTID': 'shopifyVariantId',
    ' SHOPIFYVARIANTID': 'shopifyVariantId'  # Handle leading space in CSV
}

# --- VALIDATION SETS ---
# All validation sets and mappings are now imported from validation_config.py
# This keeps the main script clean and allows easy maintenance of validation rules

def normalize_ingredient(ingredient):
    """Normalize ingredient name: lowercase, replace spaces with hyphens."""
    if not ingredient or pd.isna(ingredient):
        return None
    # Convert to lowercase and replace spaces with hyphens
    normalized = str(ingredient).strip().lower()
    normalized = re.sub(r'\s+', '-', normalized)
    # Remove any special characters except hyphens
    normalized = re.sub(r'[^a-z0-9-]', '', normalized)
    return normalized if normalized else None

def normalize_string_list(value, valid_set=None, concern_mapping=None, value_mapping=None):
    """
    Convert comma-separated string to normalized array with smart mapping.
    
    Args:
        value: The input value to normalize
        valid_set: Set of valid values to validate against
        concern_mapping: Mapping for concerns (extended -> core)
        value_mapping: General value mapping (e.g., for climate, texture)
    """
    if pd.isna(value) or value == '':
        return []
    
    items = [item.strip().lower() for item in str(value).split(',') if item.strip()]
    
    # Special handling for "all" in climate suitability (means suitable for all climates = empty array)
    if valid_set == VALID_CLIMATES:
        if len(items) == 1 and items[0] == 'all':
            return []  # Empty array means suitable for all climates
        # Remove "all" from mixed entries (e.g., "hot-humid, all" -> "hot-humid")
        items = [item for item in items if item != 'all']
        if not items:  # If only "all" was present, return empty
            return []
    
    # Apply value mapping if provided (e.g., for climate, texture) - BEFORE concern mapping
    if value_mapping:
        mapped_items = []
        for item in items:
            if item in value_mapping:
                mapped_items.append(value_mapping[item])
            elif item in valid_set:
                mapped_items.append(item)
        items = mapped_items
        # After value mapping, validate against valid set
        if valid_set:
            items = [item for item in items if item in valid_set]
    
    # Map concerns to core concerns if mapping provided
    if concern_mapping:
        mapped_items = []
        for item in items:
            # Special handling for UV-protection: maps to both aging and pigmentation
            if item == 'uv-protection':
                mapped_items.extend(['aging', 'pigmentation'])
            # If item is in mapping, use mapped value
            elif item in concern_mapping:
                mapped_item = concern_mapping[item]
                if mapped_item not in mapped_items:  # Avoid duplicates
                    mapped_items.append(mapped_item)
            # If already a core concern, keep it
            elif item in CORE_CONCERNS:
                if item not in mapped_items:
                    mapped_items.append(item)
            # Otherwise, filter out non-concern values (e.g., "no-white-cast", product features)
        items = mapped_items
        # After mapping, validate against core concerns (filter out any non-core concerns)
        if valid_set:
            items = [item for item in items if item in CORE_CONCERNS]
    else:
        # Validate against valid set if provided (no mapping)
        if valid_set and not value_mapping:  # Skip if value_mapping already validated
            items = [item for item in items if item in valid_set]
    
    return items

def normalize_boolean(value):
    """Convert various boolean representations to actual boolean."""
    if pd.isna(value):
        return True  # Default to true for inStock
    
    value_str = str(value).strip().upper()
    if value_str in ['TRUE', '1', 'YES', 'Y']:
        return True
    elif value_str in ['FALSE', '0', 'NO', 'N']:
        return False
    else:
        return True  # Default to true if unclear

def normalize_enum(value, valid_set, default=None, mapping=None):
    """
    Normalize enum value to lowercase and validate with smart mapping.
    
    Args:
        value: The input value to normalize
        valid_set: Set of valid values
        default: Default value if invalid or empty
        mapping: Mapping dictionary for invalid values
    
    Returns:
        Normalized valid value, or default if invalid/missing
    """
    if pd.isna(value) or value == '':
        return default
    
    normalized = str(value).strip().lower()
    
    # Apply mapping if provided (checks mapping FIRST, then valid_set)
    if mapping:
        mapped_value = mapping.get(normalized, normalized)
        normalized = mapped_value
    
    if normalized in valid_set:
        return normalized
    else:
        # Use default instead of failing - ensures product is not nulled
        if default is not None:
            return default
        return None

def validate_product(product, index):
    """Validate a product record and return list of errors."""
    errors = []
    
    # Required fields
    if not product.get('productId'):
        errors.append(f"Row {index}: Missing required field 'productId'")
    if not product.get('name'):
        errors.append(f"Row {index}: Missing required field 'name'")
    if not product.get('category'):
        errors.append(f"Row {index}: Missing required field 'category'")
    if product.get('inStock') is None:
        errors.append(f"Row {index}: Missing required field 'inStock'")
    
    # Validate category
    if product.get('category') and product['category'] not in VALID_CATEGORIES:
        errors.append(f"Row {index}: Invalid category '{product['category']}'")
    
    # Validate skinTypes
    skin_types = product.get('skinTypes', [])
    if skin_types and not all(st in VALID_SKIN_TYPES for st in skin_types):
        invalid = [st for st in skin_types if st not in VALID_SKIN_TYPES]
        errors.append(f"Row {index}: Invalid skinTypes: {invalid}")
    
    # Validate concernsAddressed (after mapping, should only contain core concerns)
    concerns = product.get('concernsAddressed', [])
    if concerns and not all(c in CORE_CONCERNS for c in concerns):
        invalid = [c for c in concerns if c not in CORE_CONCERNS]
        errors.append(f"Row {index}: Invalid concernsAddressed (after mapping): {invalid}")
    
    # Validate gender
    if product.get('gender') and product['gender'] not in VALID_GENDERS:
        errors.append(f"Row {index}: Invalid gender '{product['gender']}'")
    
    # Validate texture
    if product.get('texture') and product['texture'] not in VALID_TEXTURES:
        errors.append(f"Row {index}: Invalid texture '{product['texture']}'")
    
    # Validate usage
    if product.get('usage') and product['usage'] not in VALID_USAGE:
        errors.append(f"Row {index}: Invalid usage '{product['usage']}'")
    
    # Validate frequency
    if product.get('frequency') and product['frequency'] not in VALID_FREQUENCY:
        errors.append(f"Row {index}: Invalid frequency '{product['frequency']}'")
    
    return errors

def upload_data():
    """Loads, transforms, and uploads data with a precise schema match."""
    try:
        # --- 1. Load Data ---
        print(f"🔄 Loading data from '{CSV_FILE_PATH}'...")
        df = pd.read_csv(CSV_FILE_PATH, encoding='utf-8')
        print(f"   ✅ Loaded {len(df)} rows")
        
        # --- 2. Clean and Transform Data ---
        print("✨ Cleaning and transforming data...")
        df.columns = df.columns.str.replace('Content.', '', regex=False)
        df.columns = df.columns.str.strip()
        
        # *** THE CRITICAL FIX: Standardize the CATEGORY column first ***
        if 'CATEGORY' in df.columns:
            df['category'] = df['CATEGORY'].map(CATEGORY_MAP).fillna('other')
            # Validate categories
            invalid_categories = df[~df['category'].isin(VALID_CATEGORIES)]['CATEGORY'].unique()
            if len(invalid_categories) > 0:
                print(f"   ⚠️  Warning: Found invalid categories: {invalid_categories}")
            print(f"   ✅ Standardized product categories (e.g., 'CLEANSERS' -> 'cleanser').")
        else:
            print("   ❌ Error: 'CATEGORY' column not found in CSV")
            return
        
        # Rename all other columns to camelCase
        df.rename(columns=COLUMN_MAP, inplace=True)
        print("   ✅ Mapped all column names to camelCase schema.")
        
        # Generate productId if missing
        if 'productId' not in df.columns or (df['productId'].isna().all() if 'productId' in df.columns else True):
            print("   ⚠️  No productId column found. Generating IDs from name and brand...")
            def generate_product_id(row):
                """Generate a unique productId from name and brand."""
                name = str(row.get('name', '')).strip() if pd.notna(row.get('name')) else 'unknown'
                brand = str(row.get('brand', '')).strip() if pd.notna(row.get('brand')) else 'unknown'
                # Create a unique ID from name + brand
                unique_string = f"{brand}_{name}".lower()
                # Remove special characters and replace spaces with hyphens
                unique_string = re.sub(r'[^a-z0-9-]', '-', unique_string)
                unique_string = re.sub(r'-+', '-', unique_string).strip('-')
                # Generate a short hash for uniqueness
                hash_id = hashlib.md5(unique_string.encode()).hexdigest()[:8]
                return f"{unique_string[:50]}-{hash_id}" if unique_string else f"product-{hash_id}"
            
            df['productId'] = df.apply(generate_product_id, axis=1)
            print(f"   ✅ Generated productId for {len(df)} products")
        
        # Fill any remaining NaN productIds
        if 'productId' in df.columns:
            df['productId'] = df['productId'].fillna(df.apply(lambda row: f"product-{row.name}", axis=1))
        
        # --- 3. Normalize Data Types ---
        print("🔧 Normalizing data types...")
        
        # Convert booleans
        for col in ['inStock', 'sensitivitySafe']:
            if col in df.columns:
                df[col] = df[col].apply(normalize_boolean)
                print(f"   ✅ Converted '{col}' to boolean")
        
        # Convert string lists to arrays (with validation and mapping)
        array_columns = {
            'skinTypes': (VALID_SKIN_TYPES, None, None),
            'concernsAddressed': (VALID_CONCERNS, CONCERN_MAPPING, None),  # Map to core concerns
            'climateSuitability': (VALID_CLIMATES, None, CLIMATE_MAPPING),  # Add climate mapping
            'preferences': (VALID_PREFERENCES, None, None)  # Expanded valid set handles all values
        }
        
        for col, (valid_set, concern_mapping, value_mapping) in array_columns.items():
            if col in df.columns:
                df[col] = df[col].apply(
                    lambda x: normalize_string_list(x, valid_set, concern_mapping, value_mapping)
                )
                non_empty = df[col].apply(len).sum()
                print(f"   ✅ Normalized '{col}' ({non_empty} non-empty entries)")
                if concern_mapping and col == 'concernsAddressed':
                    print(f"      ℹ️  Extended concerns mapped to core concerns for recommendation engine compatibility")
                if value_mapping and col == 'climateSuitability':
                    print(f"      ℹ️  Climate values mapped to valid equivalents (e.g., 'dry' → 'cold-dry')")
        
        # Normalize ingredient lists (no validation set, but normalize format)
        ingredient_columns = ['keyIngredients', 'fullIngredientList']
        for col in ingredient_columns:
            if col in df.columns:
                df[col] = df[col].apply(
                    lambda x: [normalize_ingredient(ing) for ing in str(x).split(',') if normalize_ingredient(ing)]
                    if pd.notna(x) and str(x).strip() else []
                )
                non_empty = df[col].apply(len).sum()
                print(f"   ✅ Normalized '{col}' ({non_empty} non-empty entries)")
        
        # Normalize enum fields (with mapping support)
        enum_fields = {
            'gender': (VALID_GENDERS, 'neutral', None),
            'texture': (VALID_TEXTURES, None, TEXTURE_MAPPING),  # Add texture mapping
            'usage': (VALID_USAGE, 'both', None),
            'frequency': (VALID_FREQUENCY, 'daily', FREQUENCY_MAPPING)
        }
        
        for col, (valid_set, default, mapping) in enum_fields.items():
            if col in df.columns:
                df[col] = df[col].apply(lambda x: normalize_enum(x, valid_set, default, mapping))
                if default:
                    filled = df[col].notna().sum()
                    print(f"   ✅ Normalized '{col}' ({filled} entries, default: {default})")
                else:
                    filled = df[col].notna().sum()
                    print(f"   ✅ Normalized '{col}' ({filled} entries)")
                if mapping and col == 'texture':
                    print(f"      ℹ️  Texture values mapped to valid equivalents (e.g., 'sheet' → 'lightweight')")
        
        # Convert numbers (handle INR currency format: ₹ symbol and commas)
        number_columns = ['mrp', 'rating']
        for col in number_columns:
            if col in df.columns:
                # Remove currency symbols (₹, $, etc.) and commas before converting
                df[col] = df[col].astype(str).str.replace('₹', '', regex=False)
                df[col] = df[col].str.replace('$', '', regex=False)
                df[col] = df[col].str.replace(',', '', regex=False)
                df[col] = pd.to_numeric(df[col], errors='coerce')
                non_null = df[col].notna().sum()
                print(f"   ✅ Converted '{col}' to number ({non_null} non-null entries)")
        
        # --- 4. Set Defaults ---
        print("📝 Setting defaults...")
        if 'inStock' in df.columns:
            df['inStock'] = df['inStock'].fillna(True)
        if 'sensitivitySafe' in df.columns:
            df['sensitivitySafe'] = df['sensitivitySafe'].fillna(False)
        if 'usage' in df.columns:
            df['usage'] = df['usage'].fillna('both')
        if 'frequency' in df.columns:
            df['frequency'] = df['frequency'].fillna('daily')
        if 'gender' in df.columns:
            df['gender'] = df['gender'].fillna('neutral')
        print("   ✅ Set defaults for optional fields")
        
        # --- 5. Validate Products ---
        print("🔍 Validating products...")
        records = df.to_dict('records')
        all_errors = []
        for i, record in enumerate(records, start=2):  # Start at 2 because row 1 is header
            errors = validate_product(record, i)
            if errors:
                all_errors.extend(errors)
        
        if all_errors:
            print(f"\n❌ Validation errors found ({len(all_errors)} errors):")
            for error in all_errors[:10]:  # Show first 10 errors
                print(f"   - {error}")
            if len(all_errors) > 10:
                print(f"   ... and {len(all_errors) - 10} more errors")
            response = input("\n⚠️  Continue with upload despite errors? (yes/no): ")
            if response.lower() != 'yes':
                print("❌ Upload cancelled.")
                return
        else:
            print("   ✅ All products validated successfully")
        
        # --- 6. Connect and Upload ---
        print("\n🔌 Connecting to MongoDB Atlas...")
        client = MongoClient(MONGO_URI)
        db = client[DATABASE_NAME]
        collection = db[COLLECTION_NAME]
        
        # Delete existing products
        print("🗑️  Deleting existing products...")
        delete_result = collection.delete_many({})
        print(f"   ✅ Deleted {delete_result.deleted_count} existing products")
        
        # Insert new products
        print(f"📤 Uploading {len(records)} products...")
        collection.insert_many(records)
        
        print(f"\n--- ✅ UPLOAD COMPLETE ---")
        print(f"Successfully uploaded {len(records)} products with standardized data.")
        
        # --- 7. Summary Statistics ---
        print("\n📊 Summary Statistics:")
        category_counts = df['category'].value_counts()
        print("   Categories:")
        for cat, count in category_counts.items():
            print(f"     - {cat}: {count}")
        
        in_stock_count = df['inStock'].sum() if 'inStock' in df.columns else 0
        print(f"   In Stock: {in_stock_count} / {len(df)}")
        
        has_full_ingredients = df['fullIngredientList'].apply(len).gt(0).sum() if 'fullIngredientList' in df.columns else 0
        print(f"   With Full Ingredient List: {has_full_ingredients} / {len(df)}")
        
        client.close()
        
    except FileNotFoundError:
        print(f"❌ Error: File '{CSV_FILE_PATH}' not found.")
        print("   Please ensure the CSV file is in the same directory as this script.")
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    upload_data()
