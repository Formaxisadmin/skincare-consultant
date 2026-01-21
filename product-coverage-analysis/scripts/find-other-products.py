import csv
import sys

products_other = []

with open('data-upload/4-12-25 DB.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        category = row.get('CATEGORY', '').strip()
        # Check if category is empty or is "OTHER"
        if not category or category.upper() == 'OTHER':
            products_other.append({
                'name': row.get('NAME', 'N/A'),
                'category': category or '(empty)',
                'brand': row.get('BRAND', 'N/A'),
                'productId': row.get('PRODUCTID', 'N/A')
            })

print(f'Found {len(products_other)} products in "other" category:\n')
for i, p in enumerate(products_other, 1):
    print(f'{i}. {p["brand"]} - {p["name"]}')
    print(f'   Category: "{p["category"]}"')
    print(f'   Product ID: {p["productId"]}')
    print()

