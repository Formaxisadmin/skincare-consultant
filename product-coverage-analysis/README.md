# Product Coverage Analysis Tool - Complete Documentation

## Overview

The Product Coverage Analysis Tool is a Node.js application that tests product coverage across different user profiles. It analyzes how well your product catalog covers various skin types, concerns, and user profiles to identify gaps in product recommendations.

---

## Table of Contents

1. [Features](#features)
2. [Purpose](#purpose)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Usage](#usage)
6. [How It Works](#how-it-works)
7. [Scripts Reference](#scripts-reference)
8. [Understanding Reports](#understanding-reports)
9. [Troubleshooting](#troubleshooting)

---

## Features

- **Comprehensive Profile Testing**: Tests 2,880+ user profile combinations
- **Coverage Analysis**: Identifies gaps in product recommendations
- **Category Coverage**: Shows coverage percentage for each product category
- **Profile Coverage**: Identifies profiles that don't receive recommendations
- **Product Distribution**: Analyzes product distribution across categories, concerns, and skin types
- **Markdown Reports**: Generates detailed markdown reports with statistics

---

## Purpose

This tool helps you:

1. **Identify Product Gaps**: Find which user profiles don't receive recommendations
2. **Category Coverage**: Understand which categories need more products
3. **Quality Assurance**: Ensure recommendation engine works for all profile types
4. **Product Planning**: Make informed decisions about which products to add
5. **Testing**: Verify recommendation engine changes don't break coverage

---

## Prerequisites

### Required Software

1. **Node.js** (v18 or later)
2. **npm** (comes with Node.js)

### Dependencies

The tool uses the same recommendation engine as the main application:
- RecommendationEngine from `src/lib/recommendationEngine.js`
- Product data structure matching database schema

---

## Installation

1. **Navigate to product-coverage-analysis directory:**
   ```bash
   cd product-coverage-analysis
   ```

2. **Ensure main app dependencies are installed:**
   ```bash
   cd ..
   npm install
   cd product-coverage-analysis
   ```

   The tool imports from the main app, so the main app must have dependencies installed.

---

## Usage

### Quick Start

1. **Place your CSV file in the scripts directory:**
   - File should be named `4-12-25 DB.csv` (or update path in script)
   - Must match the same format as used by data upload tool

2. **Run the analysis:**
   ```bash
   node scripts/5-main-orchestrator.js
   ```
   
   Or use npm script from project root:
   ```bash
   npm run analyze-coverage
   ```

3. **View the report:**
   - Report is saved in `reports/` directory
   - Filename format: `coverage-report-{timestamp}.md`

### From Project Root

```bash
npm run analyze-coverage
```

This runs: `node product-coverage-analysis/scripts/5-main-orchestrator.js`

---

## How It Works

### Analysis Pipeline

The tool follows a 4-step process:

#### Step 1: Read Products from CSV
- Reads product data from CSV file
- Normalizes data to match database schema
- Filters to in-stock products only (matches app behavior)
- Maps categories and concerns correctly

**Script**: `scripts/1-csv-reader.js`

#### Step 2: Generate User Profiles
- Generates all possible user profile combinations
- Tests 2,880+ profile combinations covering:
  - Age ranges (6 options)
  - Skin types (5 options)
  - Sensitivity levels (3 options)
  - Primary concerns (10 options, combinations of 1-5 concerns)
  - Lifestyle factors (conditional)
  - Allergies and preferences

**Script**: `scripts/2-profile-generator.js`

#### Step 3: Test Recommendations
- For each profile, runs the recommendation engine
- Uses `generateCompleteAnalysis()` (same as production app)
- Tracks:
  - Which profiles receive recommendations
  - Which categories are filled
  - Product distribution

**Script**: `scripts/3-recommendation-tester.js`

#### Step 4: Generate Report
- Compiles all analysis results
- Generates comprehensive markdown report
- Includes statistics, coverage percentages, and recommendations

**Script**: `scripts/4-report-generator.js`

---

## Scripts Reference

### Main Orchestrator

#### `5-main-orchestrator.js`
Main entry point that orchestrates the entire analysis process.

**What it does:**
- Calls each step in sequence
- Displays progress to console
- Handles errors gracefully
- Shows summary statistics

**Usage:**
```bash
node scripts/5-main-orchestrator.js
```

### Core Scripts

#### `1-csv-reader.js`
Reads and normalizes product data from CSV file.

**Key Features:**
- Reads CSV file
- Normalizes product data
- Maps categories (matches upload script mapping)
- Filters in-stock products
- Validates product structure

**Requirements:**
- CSV file in same format as upload tool
- Category mapping must match `data-upload/scripts/validation_config.py`

#### `2-profile-generator.js`
Generates comprehensive user profile combinations.

**Profile Dimensions:**
- Age ranges: 6 options
- Skin types: 5 options
- Sensitivity: 3 options
- Primary concerns: 10 core concerns, combinations of 1-5
- Lifestyle factors: Conditional based on selections
- Allergies: 17 allergen options
- Preferences: 10 preference options

**Total Profiles**: 2,880+ combinations

#### `3-recommendation-tester.js`
Tests recommendation engine with all profiles.

**Process:**
- Loads RecommendationEngine
- For each profile:
  - Creates engine instance
  - Runs `generateCompleteAnalysis()`
  - Tracks recommendations by category
  - Records coverage statistics

**Output:**
- Coverage statistics per category
- Profiles with/without recommendations
- Product distribution data

#### `4-report-generator.js`
Generates comprehensive markdown report.

**Report Contents:**
- Executive summary
- Product distribution (by category, concern, skin type)
- Coverage analysis (category coverage, profile coverage)
- Detailed statistics
- Recommendations for improvement

**Output Location**: `reports/coverage-report-{timestamp}.md`

### Utility Scripts

#### `find-other-products-exact.js`
Finds products that match exact profile criteria.

**Purpose**: Identify specific products for specific profiles

#### `find-other-products.py`
Python version of product finder (alternative implementation)

---

## Understanding Reports

### Executive Summary

Shows overall statistics:
- Total products analyzed
- Total profiles tested
- Profiles with recommendations (percentage)
- Profiles without recommendations (percentage)

### Product Distribution

Shows how products are distributed:
- **By Category**: Count of products in each category
- **By Concern**: Count of products addressing each concern
- **By Skin Type**: Count of products for each skin type

### Coverage Analysis

#### Category Coverage

Shows percentage of profiles that receive recommendations for each category:

| Category | Coverage % | Profiles Tested | Profiles Covered |
|----------|------------|----------------|------------------|
| cleanser | 95.2% | 2880 | 2742 |
| moisturizer | 92.1% | 2880 | 2652 |
| ... | ... | ... | ... |

**Interpretation:**
- **High Coverage (>90%)**: Category is well-covered
- **Medium Coverage (50-90%)**: Category may need more products
- **Low Coverage (<50%)**: Category likely needs more products or product variety

#### Profile Coverage

Identifies specific profiles that don't receive recommendations:
- Age range + Skin type + Concerns combinations
- Helps identify product gaps

### Recommendations

Report includes suggestions for:
- Categories that need more products
- Specific profile types that aren't covered
- Product distribution improvements

---

## Troubleshooting

### Common Issues

#### 1. Module Import Errors

**Issue**: Cannot find module errors  
**Solution**: 
- Ensure main app dependencies are installed (`npm install` in project root)
- Verify scripts use correct import paths
- Check that recommendation engine exists in `src/lib/`

#### 2. CSV File Not Found

**Issue**: Cannot read CSV file  
**Solution**:
- Ensure CSV file exists in scripts directory
- Check file path in `1-csv-reader.js`
- Verify CSV format matches upload tool format

#### 3. Category Mapping Mismatches

**Issue**: Categories not matching correctly  
**Solution**:
- Ensure `CATEGORY_MAP` in `1-csv-reader.js` matches `validation_config.py`
- Check CSV uses correct category names (Excel format)

#### 4. Low Coverage Results

**Issue**: Many profiles without recommendations  
**Possible Causes**:
- Product catalog gaps (need more products)
- Strict constraints (many allergies/preferences)
- Engine configuration too strict
- Missing product data (texture, climate, etc.)

**Investigation**:
- Review product distribution
- Check specific profiles without recommendations
- Verify product data completeness

#### 5. Memory Issues

**Issue**: Out of memory errors with large datasets  
**Solution**:
- Reduce number of profiles tested (modify `2-profile-generator.js`)
- Test in batches
- Increase Node.js memory: `node --max-old-space-size=4096 scripts/5-main-orchestrator.js`

---

## File Structure

```
product-coverage-analysis/
├── README.md                    # This file
├── scripts/
│   ├── 1-csv-reader.js         # CSV reader
│   ├── 2-profile-generator.js  # Profile generator
│   ├── 3-recommendation-tester.js  # Recommendation tester
│   ├── 4-report-generator.js   # Report generator
│   ├── 5-main-orchestrator.js  # Main orchestrator
│   ├── find-other-products-exact.js  # Utility script
│   └── find-other-products.py  # Utility script (Python)
├── reports/
│   └── coverage-report-*.md    # Generated reports
└── docs/
    └── (historical documentation)
```

---

## Best Practices

### Before Running Analysis

1. ✅ **Ensure CSV matches upload tool format**
2. ✅ **Verify category mapping is correct**
3. ✅ **Check product data completeness** (texture, climate, preferences, etc.)
4. ✅ **Test with small profile subset first**

### Interpreting Results

1. **Focus on Category Coverage**:
   - Identify categories with <90% coverage
   - Prioritize categories with <50% coverage

2. **Review Profile Coverage**:
   - Identify common patterns in uncovered profiles
   - Check if gaps are due to product availability or engine constraints

3. **Product Distribution**:
   - Ensure balanced distribution across categories
   - Check for over-concentration in certain categories

### After Analysis

1. **Address Product Gaps**:
   - Add products to low-coverage categories
   - Focus on missing concern/skin type combinations

2. **Review Engine Configuration**:
   - Adjust constraints if too strict
   - Verify multi-pass system is working correctly

3. **Re-run Analysis**:
   - Test after adding products
   - Verify improvements in coverage

---

## Integration with Main App

The coverage analysis tool:
- Uses the same recommendation engine as production
- Tests with actual recommendation logic
- Ensures consistency with production behavior
- Validates engine changes don't break coverage

**Key**: Always keep coverage analysis tool in sync with main app recommendation engine changes.

---

## Support

For issues or questions:
1. Check error messages in console output
2. Verify CSV file format matches upload tool
3. Ensure category mapping matches validation config
4. Review generated reports for insights

---

**Last Updated**: December 2025  
**Version**: 1.0.0

