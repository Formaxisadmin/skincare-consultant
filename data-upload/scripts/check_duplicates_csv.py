#!/usr/bin/env python3
"""
Check for duplicate ingredient lists - CSV version
Run this after exporting your Excel file to CSV format
"""

import pandas as pd
from collections import defaultdict
import sys

def check_duplicates_csv():
    csv_file = "4-12-25 DB.csv"
    
    print("=" * 80)
    print("DUPLICATE INGREDIENT LISTS CHECKER")
    print("=" * 80)
    print()
    
    try:
        # Read CSV
        print(f"Reading: {csv_file}")
        df = pd.read_csv(csv_file, encoding='utf-8', errors='ignore')
        print(f"✓ Loaded {len(df)} products\n")
        
        # Find ingredient columns
        full_ing_col = None
        key_ing_col = None
        
        for col in df.columns:
            col_upper = col.upper()
            if 'FULLINGREDIENT' in col_upper:
                full_ing_col = col
            if 'KEYINGREDIENT' in col_upper and 'FULL' not in col_upper:
                key_ing_col = col
        
        if not full_ing_col and not key_ing_col:
            print("ERROR: Could not find ingredient columns!")
            print(f"Available columns: {', '.join(df.columns[:10])}...")
            return False
        
        print(f"Found columns:")
        if full_ing_col:
            print(f"  - {full_ing_col}")
        if key_ing_col:
            print(f"  - {key_ing_col}")
        print()
        
        duplicates_found = False
        
        # Check FULLINGREDIENTSLIST
        if full_ing_col:
            print("=" * 80)
            print("CHECKING FULLINGREDIENTSLIST FOR DUPLICATES")
            print("=" * 80)
            print()
            
            groups = defaultdict(list)
            for idx, row in df.iterrows():
                ing = str(row.get(full_ing_col, '')).strip() if pd.notna(row.get(full_ing_col)) else ""
                if ing:  # Only check non-empty
                    groups[ing].append({
                        'row': idx + 2,
                        'name': str(row.get('NAME', 'N/A')),
                        'brand': str(row.get('BRAND', 'N/A')),
                        'category': str(row.get('CATEGORY', 'N/A'))
                    })
            
            duplicates = {k: v for k, v in groups.items() if len(v) > 1}
            
            if duplicates:
                duplicates_found = True
                print(f"⚠️  FOUND {len(duplicates)} SETS OF DUPLICATE INGREDIENT LISTS:\n")
                
                for idx, (ing_list, products) in enumerate(duplicates.items(), 1):
                    print(f"{'='*80}")
                    print(f"DUPLICATE SET #{idx} - {len(products)} products share identical ingredients:")
                    print(f"{'='*80}")
                    print(f"\nIngredient List (first 200 chars):")
                    print(f"  {ing_list[:200]}...")
                    print(f"\nProducts with this ingredient list:")
                    
                    for product in products:
                        print(f"\n  Row {product['row']}:")
                        print(f"    Brand: {product['brand']}")
                        print(f"    Name: {product['name']}")
                        print(f"    Category: {product['category']}")
                    
                    print()
            else:
                print("✓ No duplicates found in FULLINGREDIENTSLIST\n")
        
        # Check KEYINGREDIENTS
        if key_ing_col:
            print("=" * 80)
            print("CHECKING KEYINGREDIENTS FOR DUPLICATES")
            print("=" * 80)
            print()
            
            groups = defaultdict(list)
            for idx, row in df.iterrows():
                ing = str(row.get(key_ing_col, '')).strip() if pd.notna(row.get(key_ing_col)) else ""
                if ing:  # Only check non-empty
                    groups[ing].append({
                        'row': idx + 2,
                        'name': str(row.get('NAME', 'N/A')),
                        'brand': str(row.get('BRAND', 'N/A')),
                        'category': str(row.get('CATEGORY', 'N/A'))
                    })
            
            duplicates = {k: v for k, v in groups.items() if len(v) > 1}
            
            if duplicates:
                duplicates_found = True
                print(f"⚠️  FOUND {len(duplicates)} SETS OF DUPLICATE KEY INGREDIENTS:\n")
                
                for idx, (ing_list, products) in enumerate(duplicates.items(), 1):
                    print(f"{'='*80}")
                    print(f"DUPLICATE SET #{idx} - {len(products)} products share identical key ingredients:")
                    print(f"{'='*80}")
                    print(f"\nKey Ingredients: {ing_list}")
                    print(f"\nProducts with these key ingredients:")
                    
                    for product in products:
                        print(f"\n  Row {product['row']}:")
                        print(f"    Brand: {product['brand']}")
                        print(f"    Name: {product['name']}")
                        print(f"    Category: {product['category']}")
                    
                    print()
            else:
                print("✓ No duplicates found in KEYINGREDIENTS\n")
        
        # Summary
        print("=" * 80)
        print("SUMMARY")
        print("=" * 80)
        print()
        
        if duplicates_found:
            print("⚠️  DUPLICATES FOUND - Review the products listed above")
            print("\nAction required:")
            print("  1. Check if these are legitimate duplicates (same product, different sizes)")
            print("  2. Or if they are errors that need to be fixed")
            print("  3. Each product should have unique ingredient lists unless they're variants")
        else:
            print("✓ No duplicates found - All ingredient lists are unique")
        
        print()
        
        return True
        
    except FileNotFoundError:
        print(f"ERROR: File '{csv_file}' not found!")
        print(f"\nTo use this script:")
        print(f"  1. Export your Excel file ('4-12-25 DB.xlsx') to CSV format")
        print(f"  2. Save it as '4-12-25 DB.csv' in the same folder")
        print(f"  3. Run this script again")
        return False
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = check_duplicates_csv()
    sys.exit(0 if success else 1)

