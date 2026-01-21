# Allergies and Preferences Implementation Guide
## Database and Excel Sheet Requirements

### Date: Today
### Status: Implementation Complete ✅

---

## ✅ IMPLEMENTATION COMPLETE

### What Was Implemented:
1. ✅ **Allergies Question** - New question in questionnaire (hard constraints)
2. ✅ **Preferences Question** - Updated question (soft constraints)
3. ✅ **Hard Constraints (Allergies)** - Products with allergy ingredients are disqualified (score -999)
4. ✅ **Soft Constraints (Preferences)** - Penalty/bonus system for preferences

---

## 📊 DATABASE/EXCEL SHEET REQUIREMENTS

### 1. FULLINGREDIENTLIST Field (CRITICAL for Allergies)

#### Why It's Important:
- **Hard constraints (allergies)** check against `fullIngredientList` first
- If `fullIngredientList` is empty, it falls back to `keyIngredients`
- **Recommendation**: Always populate `fullIngredientList` for accurate allergy checking

#### Excel Column:
- **Column Name**: `FULLINGREDIENTLIST`
- **Format**: Comma-separated list of ingredients (normalized format)
- **Example**: `water,niacinamide,hyaluronic-acid,glycerin,parabens,fragrance`

#### Normalization Rules:
- All lowercase
- Spaces replaced with hyphens
- Examples:
  - `Vitamin C` → `vitamin-c`
  - `Ascorbic Acid` → `ascorbic-acid`
  - `Parabens` → `parabens`
  - `Fragrance/Parfum` → `fragrance` or `parfum`

#### What to Include:
- **All ingredients** in the product (complete ingredient list)
- **Common allergens**: nuts, soy, wheat, dairy, fragrance, parabens, sulfates, alcohol
- **Active ingredients**: retinol, vitamin-c, niacinamide, salicylic-acid, etc.
- **Preservatives**: parabens, phenoxyethanol, etc.
- **Fragrances**: fragrance, parfum, essential oils

---

### 2. PREFERENCES Field (For Soft Constraints)

#### Excel Column:
- **Column Name**: `PREFERENCES`
- **Format**: Comma-separated list of preferences
- **Valid Values**: See expanded preferences list below

#### Valid Preference Values:
**Core Preferences:**
- `fragrance-free`
- `vegan`
- `cruelty-free`
- `natural`
- `paraben-free`
- `sulfate-free`
- `alcohol-free`
- `oil-free`
- `non-comedogenic`
- `hypoallergenic`

**Product Characteristics:**
- `low-ph`
- `mild-formula`
- `high-strength-active`
- `no-white-cast`
- `matte-finish`
- `ph-balanced`
- `clean-formula`
- `long-lasting`
- `non-sticky`

**Product Benefits:**
- `soothing`
- `nourishing`
- `moisturizing`
- `refreshing`
- `cooling`
- `brightening`
- `anti-aging`
- `gentle-exfoliation`
- `intensive-moisture`

**Usage Characteristics:**
- `beginner-friendly`
- `daily-use`
- `multi-use`
- `multi-tasking`

**Special Categories:**
- `hanbang`
- `cult-favourite`
- `vegan-friendly`
- `pore-care`
- `oil-control`
- `lightweight`
- `essence-like`

---

## 🚨 ALLERGY INGREDIENT MAPPING

### Common Allergen Names in Database:

The following allergen names are used in the questionnaire. Make sure your `fullIngredientList` uses these normalized names or variations:

#### Food Allergens:
- `nuts` - Matches: almond, walnut, cashew, etc.
- `soy` - Matches: soy, soybean, soya
- `wheat` - Matches: wheat, gluten
- `dairy` - Matches: dairy, milk, lactose

#### Skincare Ingredients:
- `fragrance` - Matches: fragrance, parfum, essential-oils
- `parabens` - Matches: parabens, methylparaben, propylparaben
- `sulfates` - Matches: sulfates, sls, sles, sodium-lauryl-sulfate
- `alcohol` - Matches: alcohol, ethanol, denatured-alcohol
- `retinol` - Matches: retinol, retinaldehyde, retinoids
- `vitamin-c` - Matches: vitamin-c, ascorbic-acid, ascorbyl
- `niacinamide` - Matches: niacinamide, nicotinamide
- `salicylic-acid` - Matches: salicylic-acid, bha, beta-hydroxy-acid
- `glycolic-acid` - Matches: glycolic-acid, aha, alpha-hydroxy-acid
- `lactic-acid` - Matches: lactic-acid
- `benzoyl-peroxide` - Matches: benzoyl-peroxide
- `hydroquinone` - Matches: hydroquinone

---

## 📝 EXCEL SHEET UPDATES NEEDED

### Required Updates:

#### 1. FULLINGREDIENTLIST Column
- ✅ **Action**: Add complete ingredient list to all products
- ✅ **Format**: Comma-separated, normalized (lowercase, hyphens)
- ✅ **Priority**: **HIGH** - Critical for allergy checking

#### 2. PREFERENCES Column
- ✅ **Action**: Add preference tags to products
- ✅ **Format**: Comma-separated, use valid preference values
- ✅ **Priority**: **MEDIUM** - Improves recommendation accuracy

#### 3. Verify Existing Data
- ✅ **Action**: Check that existing products have:
  - `fullIngredientList` populated (if available)
  - `preferences` populated (if applicable)
  - Ingredients normalized (lowercase, hyphens)

---

## 🔍 INGREDIENT MATCHING LOGIC

### How Allergy Checking Works:

1. **Primary Check**: `fullIngredientList` (if available and not empty)
2. **Fallback**: `keyIngredients` (if `fullIngredientList` is empty)
3. **Matching Method**:
   - Exact match (case-insensitive)
   - Partial match (contains the allergy term)
   - Example: `vitamin-c` matches `ascorbic-acid` (partial match)

### Example:
**User Allergy**: `vitamin-c`
**Product Ingredients**: `water,ascorbic-acid,hyaluronic-acid,glycerin`
**Result**: ✅ **MATCH** - Product contains `ascorbic-acid` which matches `vitamin-c`

---

## ⚠️ IMPORTANT NOTES

### 1. Ingredient Normalization
- **Always normalize ingredients**: lowercase, hyphens for spaces
- **Be consistent**: Use the same format across all products
- **Check spelling**: Typos will cause missed matches

### 2. Complete Ingredient Lists
- **Use `fullIngredientList`**: More comprehensive than `keyIngredients`
- **Include all ingredients**: Don't skip preservatives, fragrances, etc.
- **Order doesn't matter**: Ingredients can be in any order

### 3. Preference Tags
- **Be accurate**: Only tag products that actually have these characteristics
- **Use valid values**: Check the valid preference values list above
- **Multiple tags**: Products can have multiple preference tags

### 4. Testing Allergies
- **Test with common allergens**: fragrance, parabens, alcohol
- **Test with active ingredients**: retinol, vitamin-c, niacinamide
- **Verify disqualified products**: Products with allergies should get score -999

---

## 📋 CHECKLIST FOR DATABASE UPDATES

### Before Uploading Products:

- [ ] **FULLINGREDIENTLIST** column added to Excel
- [ ] All products have `fullIngredientList` populated (if available)
- [ ] Ingredients are normalized (lowercase, hyphens)
- [ ] Common allergens are included in ingredient lists
- [ ] **PREFERENCES** column has valid preference values
- [ ] Products are tagged with appropriate preferences
- [ ] Existing products in database are updated with `fullIngredientList`
- [ ] Test allergy checking with sample products
- [ ] Verify products with allergies are disqualified (score -999)

---

## 🧪 TESTING RECOMMENDATIONS

### Test Cases:

1. **Allergy Test - Fragrance**:
   - User selects allergy: `fragrance`
   - Product has `fragrance` in `fullIngredientList`
   - Expected: Product disqualified (score -999)

2. **Allergy Test - Vitamin C**:
   - User selects allergy: `vitamin-c`
   - Product has `ascorbic-acid` in `fullIngredientList`
   - Expected: Product disqualified (partial match)

3. **Preference Test - Fragrance-Free**:
   - User selects preference: `fragrance-free`
   - Product has `fragrance-free` in preferences
   - Expected: Product gets +5 points bonus

4. **Preference Test - Mismatch**:
   - User selects preference: `fragrance-free`
   - Product does NOT have `fragrance-free` in preferences
   - Expected: Product gets -10 points penalty (but not disqualified)

---

## 🎯 SUMMARY

### What You Need to Do:

1. ✅ **Add FULLINGREDIENTLIST to Excel**:
   - Add complete ingredient list to all products
   - Normalize ingredients (lowercase, hyphens)
   - Include all ingredients (preservatives, fragrances, etc.)

2. ✅ **Update PREFERENCES in Excel**:
   - Tag products with appropriate preferences
   - Use valid preference values
   - Be accurate with preference tags

3. ✅ **Verify Existing Data**:
   - Check existing products in database
   - Update products with `fullIngredientList` if missing
   - Verify ingredient normalization

4. ✅ **Test Allergy Checking**:
   - Test with common allergens
   - Verify products are disqualified correctly
   - Check that partial matching works

### What's Already Done:

- ✅ Questionnaire updated with allergies question
- ✅ Preferences question updated
- ✅ Hard constraints (allergies) implemented
- ✅ Soft constraints (preferences) implemented
- ✅ Database schema supports `fullIngredientList` and `preferences`
- ✅ Recommendation engine checks allergies first
- ✅ Products with allergies are disqualified (score -999)
- ✅ Preferences use penalty/bonus system

---

## 🚀 NEXT STEPS

1. **Update Excel Sheet**:
   - Add `FULLINGREDIENTLIST` column
   - Populate with complete ingredient lists
   - Normalize all ingredients

2. **Update Database**:
   - Upload updated products with `fullIngredientList`
   - Verify ingredients are normalized
   - Test allergy checking

3. **Test Implementation**:
   - Test with users who have allergies
   - Verify products are disqualified correctly
   - Check preference matching works

4. **Monitor Results**:
   - Check for any missed allergy matches
   - Verify preference scoring is working
   - Adjust ingredient matching if needed

---

## 📞 SUPPORT

If you encounter issues:
1. Check that `fullIngredientList` is populated
2. Verify ingredients are normalized (lowercase, hyphens)
3. Check that allergy names match ingredient names
4. Test with sample products and allergies
5. Verify preference values are valid

---

## ✅ CONCLUSION

**Implementation is complete!** The system now:
- ✅ Checks allergies first (hard constraints)
- ✅ Disqualifies products with allergy ingredients (score -999)
- ✅ Uses penalty/bonus system for preferences (soft constraints)
- ✅ Supports comprehensive ingredient checking via `fullIngredientList`

**Next step**: Update your Excel sheet with `fullIngredientList` and `preferences` data, then upload to the database.

