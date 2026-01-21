import pandas as pd

csv_file = "4-12-25 DB.csv"
output_file = "row_count_analysis.txt"

with open(output_file, 'w', encoding='utf-8') as f:
    f.write("=" * 80 + "\n")
    f.write("ROW COUNT ANALYSIS\n")
    f.write("=" * 80 + "\n\n")
    
    try:
        # Try different encodings
        try:
            df = pd.read_csv(csv_file, encoding='utf-8')
        except UnicodeDecodeError:
            try:
                df = pd.read_csv(csv_file, encoding='latin-1')
            except:
                df = pd.read_csv(csv_file, encoding='cp1252')
        
        total_rows = len(df)
        f.write(f"Total rows in CSV (including header): {total_rows + 1}\n")
        f.write(f"Total data rows (excluding header): {total_rows}\n\n")
        
        # Check for empty rows
        empty_rows = df.isna().all(axis=1).sum()
        f.write(f"Completely empty rows: {empty_rows}\n\n")
        
        # Check rows with at least some data
        rows_with_data = df.dropna(how='all')
        f.write(f"Rows with at least some data: {len(rows_with_data)}\n\n")
        
        # Check if NAME column has values
        if 'NAME' in df.columns:
            name_count = df['NAME'].notna().sum()
            name_filled = df[df['NAME'].notna() & (df['NAME'].astype(str).str.strip() != '')]
            f.write(f"Rows with NAME filled: {name_count}\n")
            f.write(f"Rows with non-empty NAME: {len(name_filled)}\n\n")
            
            # Show rows without names
            empty_names = df[df['NAME'].isna() | (df['NAME'].astype(str).str.strip() == '')]
            if len(empty_names) > 0:
                f.write(f"Rows with empty NAME ({len(empty_names)} rows):\n")
                for idx in empty_names.index:
                    f.write(f"  Row {idx + 2} (CSV row {idx + 2})\n")
                f.write("\n")
        
        # Check for duplicate rows (all columns same)
        duplicate_rows = df.duplicated().sum()
        f.write(f"Completely duplicate rows: {duplicate_rows}\n\n")
        
        # Count actual products (rows with NAME)
        if 'NAME' in df.columns:
            actual_products = df[df['NAME'].notna() & (df['NAME'].astype(str).str.strip() != '')]
            f.write(f"Actual products (with NAME): {len(actual_products)}\n\n")
        
        # Show first few empty rows if any
        if 'NAME' in df.columns:
            empty_rows_list = df[df['NAME'].isna() | (df['NAME'].astype(str).str.strip() == '')]
            if len(empty_rows_list) > 0:
                f.write("Sample of empty rows (showing first 5 columns):\n")
                for idx in empty_rows_list.index[:10]:
                    f.write(f"\nRow {idx + 2}:")
                    for col in df.columns[:5]:
                        val = df.at[idx, col]
                        f.write(f"\n  {col}: {str(val)[:50] if pd.notna(val) else 'EMPTY'}")
                f.write("\n\n")
        
        f.write("=" * 80 + "\n")
        
        print(f"Analysis saved to: {output_file}")
        
    except Exception as e:
        f.write(f"ERROR: {e}\n")
        import traceback
        f.write(traceback.format_exc())
        print(f"Error: {e}")

