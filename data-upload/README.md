# Data Upload Tool - Complete Documentation

## Overview

The Data Upload Tool is a Python-based application for uploading product data from CSV/Excel files to MongoDB. It includes comprehensive validation, normalization, and data transformation capabilities to ensure data quality and schema compliance.

---

## Table of Contents

1. [Features](#features)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Usage](#usage)
5. [Configuration](#configuration)
6. [Data Validation](#data-validation)
7. [Scripts Reference](#scripts-reference)
8. [Troubleshooting](#troubleshooting)
9. [Validation & Analysis](#validation--analysis)

---

## Features

### Core Functionality

- **CSV/Excel Upload**: Uploads product data from CSV or Excel files to MongoDB
- **Data Normalization**: Automatically normalizes data types, arrays, and enums
- **Schema Validation**: Validates all data against database schema before upload
- **Category Mapping**: Maps Excel category names to database format (e.g., `CLEANSERS` → `cleanser`)
- **Concern Mapping**: Maps extended concerns to core concerns (e.g., `blackheads` → `acne`)
- **Ingredient Normalization**: Normalizes ingredients to lowercase with hyphens
- **Automatic Product ID Generation**: Generates unique product IDs if missing
- **Zero Data Loss**: Uses mapping instead of filtering to preserve data

### Validation & Quality

- **Comprehensive Validation**: Validates all required fields and data types
- **Error Reporting**: Detailed error messages for validation failures
- **Duplicate Detection**: Scripts to detect duplicate ingredient lists
- **Row Count Analysis**: Analyze CSV structure and row counts
- **Invalid Value Detection**: Find and report invalid values

---

## Prerequisites

### Required Software

1. **Python 3.x** (Python 3.7 or later recommended)
2. **pip** (Python package installer)

### Required Python Packages

Install required packages using:
```bash
pip install -r requirements.txt
```

Or install individually:
```bash
pip install pandas pymongo openpyxl
```

### MongoDB Setup

- MongoDB Atlas account (recommended) or local MongoDB instance
- Connection string with read/write access
- Database and collection configured

---

## Installation

1. **Navigate to data-upload directory:**
   ```bash
   cd data-upload
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure MongoDB connection:**
   - Edit `scripts/upload_kbeauty_data.py`
   - Update `MONGO_URI` with your connection string
   - Update `DATABASE_NAME` and `COLLECTION_NAME` if needed

---

## Usage

### Basic Upload

1. **Prepare your CSV file:**
   - Ensure file is named `4-12-25 DB.csv` or specify path
   - Place CSV file in the `data/` directory

2. **Run the upload script:**
   ```bash
   python scripts/upload_kbeauty_data.py
   ```
   
   Or specify CSV file path:
   ```bash
   python scripts/upload_kbeauty_data.py path/to/your/file.csv
   ```

3. **Review output:**
   - Script displays progress and validation results
   - Shows summary statistics after upload
   - Lists any validation errors

### From Parent Directory

```bash
python data-upload/scripts/upload_kbeauty_data.py
```

---

## Configuration

### MongoDB Connection

Edit `scripts/upload_kbeauty_data.py`:

```python
MONGO_URI = "mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority"
DATABASE_NAME = "kbeauty_platform"
COLLECTION_NAME = "products"
```

### CSV File Path

Default: `data/4-12-25 DB.csv`

To specify a different file:
- Pass as command-line argument: `python upload_kbeauty_data.py path/to/file.csv`
- Or modify `CSV_FILE_PATH` in the script

### Validation Configuration

All validation rules, mappings, and valid value sets are defined in `scripts/validation_config.py`:

- `VALID_CATEGORIES` - Valid product categories
- `VALID_SKIN_TYPES` - Valid skin type values
- `VALID_TEXTURES` - Valid texture values
- `VALID_PREFERENCES` - Valid preference values (100+ values)
- `CATEGORY_MAP` - Excel category → database category mapping
- `CONCERN_MAPPING` - Extended concern → core concern mapping
- `TEXTURE_MAPPING` - Invalid texture → valid texture mapping
- `CLIMATE_MAPPING` - Invalid climate → valid climate mapping

---

## Data Validation

### Required CSV Columns

| Column | Required | Description |
|--------|----------|-------------|
| `CATEGORY` | Yes | Product category (e.g., `CLEANSERS`, `TONERS`) |
| `NAME` | Yes | Product name |
| `INSTOCK` | Yes | Stock status (`TRUE`/`FALSE`) |
| `SKINTYPES` | Yes | Comma-separated skin types (e.g., `oily,dry`) |
| `CONCERNSADDRESSED` | Yes | Comma-separated concerns |
| `SENSITIVITYSAFE` | Yes | Safe for sensitive skin (`TRUE`/`FALSE`) |
| `KEYINGREDIENTS` | Yes | Comma-separated key ingredients |
| `USAGE` | Yes | Usage time (`morning`, `evening`, `both`) |
| `PRODUCTID` | No* | Unique product ID (auto-generated if missing) |

\* Product ID is generated automatically if missing using `brand_name-hash` format

### Optional but Recommended Columns

| Column | Description |
|--------|-------------|
| `FULLINGREDIENTLIST` | Complete ingredient list (critical for allergy checking) |
| `BRAND` | Brand name |
| `MRP` | Maximum retail price |
| `TEXTURE` | Product texture |
| `CLIMATESUITABILITY` | Suitable climates (comma-separated) |
| `PREFERENCES` | Product preferences (comma-separated) |
| `RATING` | Product rating (0-5) |

### Data Format Requirements

#### Categories
- **Excel Format**: Uppercase (e.g., `CLEANSERS`, `SERUMS & AMPOULES`)
- **Database Format**: Lowercase (e.g., `cleanser`, `serum`)
- **Mapping**: Automatic via `CATEGORY_MAP`

#### Skin Types
- **Format**: Comma-separated, lowercase
- **Valid Values**: `oily`, `dry`, `combination`, `normal`, `sensitive`
- **Example**: `oily,dry,combination`

#### Concerns
- **Format**: Comma-separated, lowercase
- **Extended Concerns**: Automatically mapped to core concerns
- **Example**: `acne,blackheads,whiteheads` → maps to `acne`

#### Ingredients
- **Format**: Comma-separated, normalized (lowercase, hyphens)
- **Normalization**: Spaces → hyphens, all lowercase
- **Example**: `Vitamin C, Hyaluronic Acid` → `vitamin-c,hyaluronic-acid`

#### Boolean Fields
- **Valid Values**: `TRUE`, `FALSE`, `1`, `0`, `YES`, `NO`, `Y`, `N`
- **Example**: `INSTOCK: TRUE` → `inStock: true`

---

## Scripts Reference

### Main Scripts

#### `upload_kbeauty_data.py`
Main upload script that handles:
- CSV/Excel file reading
- Data normalization and transformation
- Schema validation
- MongoDB upload

**Location**: `scripts/upload_kbeauty_data.py`

#### `validation_config.py`
Configuration file containing:
- All validation sets (categories, skin types, textures, etc.)
- Mapping dictionaries (category, concern, texture, climate)
- Valid value lists (preferences, frequencies, etc.)

**Location**: `scripts/validation_config.py`  
**Purpose**: Centralized configuration for easy maintenance

### Validation Scripts

#### `check_duplicates_csv.py`
Checks for duplicate ingredient lists in CSV files.

**Usage:**
```bash
python scripts/check_duplicates_csv.py
```

**Output**: Console report of duplicate ingredient lists

#### `row_count_check.py`
Analyzes CSV file structure and row counts.

**Usage:**
```bash
python scripts/row_count_check.py
```

**Output**: Saves `row_count_analysis.txt` with detailed analysis

#### `find_invalid_values.py`
Finds invalid values in CSV files.

**Usage:**
```bash
python scripts/find_invalid_values.py
```

**Output**: Saves `invalid_values_report.txt` with all invalid values

#### `validate_csv_schema.py`
Comprehensive schema validation for Excel files.

**Usage:**
```bash
python scripts/validate_csv_schema.py
```

**Output**: Detailed validation report with errors and warnings

---

## Troubleshooting

### Common Issues

#### 1. Missing PRODUCTID Column

**Issue**: CSV file doesn't have PRODUCTID column  
**Solution**: Product IDs are auto-generated if missing. Ensure `NAME` and `BRAND` columns exist for proper ID generation.

#### 2. Encoding Errors

**Issue**: Special characters or emojis cause encoding errors  
**Solution**: Script handles Windows console encoding automatically. Ensure CSV file is saved as UTF-8.

#### 3. Validation Errors

**Issue**: Products fail validation  
**Solution**: 
- Review validation error messages
- Use `find_invalid_values.py` to identify all invalid values
- Check `validation_config.py` for valid value lists
- Use mapping dictionaries for value transformation

#### 4. Category Mapping Issues

**Issue**: Categories not mapping correctly  
**Solution**: Check `CATEGORY_MAP` in `validation_config.py`. Excel categories must match exactly (case-sensitive).

#### 5. Ingredient Normalization

**Issue**: Ingredients not matching in recommendation engine  
**Solution**: Ensure ingredients are normalized (lowercase, hyphens). Script normalizes automatically, but verify output.

---

## Validation & Analysis

### Before Upload Checklist

1. ✅ **Run validation scripts:**
   ```bash
   python scripts/validate_csv_schema.py
   python scripts/find_invalid_values.py
   ```

2. ✅ **Check for duplicates:**
   ```bash
   python scripts/check_duplicates_csv.py
   ```

3. ✅ **Review row counts:**
   ```bash
   python scripts/row_count_check.py
   ```

4. ✅ **Fix any validation errors**

5. ✅ **Backup existing database** (script deletes all existing products)

### Duplicate Ingredients Analysis

**Purpose**: Detect products with identical ingredient lists (potential data errors)

**Process:**
1. Run `check_duplicates_csv.py`
2. Review duplicate reports
3. Verify if duplicates are legitimate (same product, different sizes) or errors
4. Fix data entry errors before upload

**What to Look For:**
- Identical `FULLINGREDIENTSLIST` values across different products
- Identical `KEYINGREDIENTS` values (may be legitimate)
- Copy-paste errors in data entry

See [DUPLICATE_INGREDIENTS_ANALYSIS.md](./docs/DUPLICATE_INGREDIENTS_ANALYSIS.md) for detailed guide.

### CSV Validation Summary

**Purpose**: Validate CSV file structure and data quality

**Checks:**
- Required columns present
- Column name correctness
- Data format compliance
- Value validity
- Normalization readiness

**Status Indicators:**
- ✅ Correct/Valid
- ⚠️ Warning (non-blocking)
- ❌ Error (blocking)

See [VALIDATION_SUMMARY.md](./docs/VALIDATION_SUMMARY.md) for validation checklist.

---

## File Structure

```
data-upload/
├── README.md                    # This file
├── requirements.txt             # Python dependencies
├── data/                        # CSV/Excel data files
│   ├── 4-12-25 DB.csv
│   └── 4-12-25 DB.xlsx
├── scripts/                     # Python scripts
│   ├── upload_kbeauty_data.py  # Main upload script
│   ├── validation_config.py    # Configuration file
│   ├── check_duplicates_csv.py # Duplicate checker
│   ├── row_count_check.py      # Row count analyzer
│   ├── find_invalid_values.py  # Invalid value finder
│   └── validate_csv_schema.py  # Schema validator
├── reports/                     # Analysis reports
│   ├── duplicate_analysis.txt
│   ├── invalid_values_report.txt
│   └── row_count_analysis.txt
└── docs/                        # Documentation
    ├── DUPLICATE_INGREDIENTS_ANALYSIS.md
    └── VALIDATION_SUMMARY.md
```

---

## Important Notes

### Data Safety

- ⚠️ **Script deletes all existing products** before uploading new ones
- ⚠️ **Backup your database** before running upload
- ⚠️ **Test with sample data** first before full upload

### Product ID Generation

- If `PRODUCTID` column is missing, IDs are auto-generated
- Format: `{brand}_{name}-{hash}`
- Ensures uniqueness using MD5 hash
- Example: `cosrx-low-ph-good-morning-gel-cleanser-a1b2c3d4`

### Normalization

- All data is normalized during upload:
  - Categories: Excel format → database format
  - Concerns: Extended → core concerns
  - Ingredients: Normalized format (lowercase, hyphens)
  - Arrays: Comma-separated → array format
  - Booleans: Various formats → true/false

### Zero Data Loss Philosophy

- Invalid values are **mapped**, not filtered
- Products are **never nulled** due to invalid optional fields
- Default values used when mapping unavailable
- Schema compliance maintained through intelligent mapping

---

## Support

For issues or questions:
1. Check validation error messages
2. Review validation reports in `reports/` directory
3. Consult `validation_config.py` for valid value lists
4. Review documentation in `docs/` directory

---

**Last Updated**: December 2025  
**Version**: 1.0.0
