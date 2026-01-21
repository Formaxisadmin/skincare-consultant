# Complete Recommendation Engine Requirements
## Combined Analysis: Technical Fixes + Expert System Logic

This document combines:
1. **Technical fixes** from the initial analysis (category mismatches, validation, etc.)
2. **Expert system logic** from the new requirements (gender logic, multi-pass system, reasoning, etc.)

---

## 📊 REQUIREMENTS COVERAGE ANALYSIS

### ✅ NEW REQUIREMENTS (Expert System Logic)
These are **additions** to the original analysis:

#### Phase 1: Profile & Concern Analysis Enhancements
- ✅ **Gender-Specific Logic** (NEW)
- ✅ **Age-Specific Texture Preferences** (NEW - enhances existing age logic)
- ✅ **Hard vs Soft Constraints** (NEW - improves existing avoid ingredients logic)

#### Phase 2: Flawless Recommendation Core
- ✅ **Multi-Pass Recommendation System** (NEW - addresses missing categories)
- ✅ **Hard Constraints (Allergies)** (NEW - critical safety feature)
- ✅ **Soft Constraints (Preferences)** (NEW - improves user experience)

#### Phase 3: Flawless Report Output
- ✅ **Reasoning Snippets** (NEW - transparency)
- ✅ **Display "Why" in ReportViewer** (NEW - UX)
- ✅ **Failsafe/Compromise Notifications** (NEW - transparency)

### ⚠️ MISSING FROM NEW REQUIREMENTS (Still Needed)
These technical issues are **not covered** by the new requirements:

1. **Category Name Mismatch** (Critical #1) - Still needs fixing
2. **Case-Sensitive Matching** (Critical #2) - Still needs fixing
3. **Usage Time Validation** (High #12) - Not mentioned
4. **Climate Suitability** (High #13) - Not mentioned (but database has field)
5. **Product Rating** (High #14) - Not mentioned (but database has field)
6. **Product Diversity** (Medium #16) - Not mentioned
7. **Duplicate Prevention** (Medium #15) - Not mentioned
8. **Treatment Category Handling** (Medium #18) - Not mentioned
9. **Optional Categories** (Medium #19) - Not mentioned
10. **Frequency Field Usage** (Medium #21) - Not mentioned
11. **Data Validation** (All items) - Not mentioned

---

## 🎯 COMPLETE IMPLEMENTATION PLAN

### PHASE 0: Technical Foundation (Must Do First)
**Purpose**: Fix critical technical issues before adding new logic

#### 0.1 Fix Category Name Mismatch
- **Decision needed**: Use `'eye-cream'` or `'eye_cream'` consistently
- **Action**: Update database schema OR update code to match database
- **Files**: `src/lib/mongodb.js`, `src/lib/recommendationEngine.js`, `src/data/concernMapping.js`

#### 0.2 Add Data Validation
- **Action**: Validate all products have required fields before scoring
- **Action**: Normalize all category names to lowercase
- **Action**: Normalize all ingredient names (lowercase, hyphens)
- **Files**: `src/lib/recommendationEngine.js`

#### 0.3 Fix Case Sensitivity
- **Action**: Normalize all string comparisons (case-insensitive)
- **Action**: Document expected database format
- **Files**: `src/lib/recommendationEngine.js`

---

### PHASE 1: Enhanced Profile & Concern Analysis

#### 1.1 Gender-Specific Logic (NEW)
**Status**: ✅ Covered in new requirements
**Database Changes Required**:
- Add `gender` field to ProductSchema: `gender: { type: String, enum: ['male', 'female', 'neutral'], default: 'neutral' }`
- Tag existing products with gender (most will be 'neutral')

**Code Changes Required**:
- Update `buildProfile()` to include gender
- Update `calculateProductScore()` to add gender affinity scoring (+5 points)
- Logic:
  - Male → male: +5, neutral: +3, female: 0
  - Female/Non-binary → female/neutral: +5, male: 0
  - Prefer not to say → neutral: +5, male/female: +2

**Files**: `src/lib/mongodb.js`, `src/lib/recommendationEngine.js`

#### 1.2 Age-Specific Texture Preferences (NEW)
**Status**: ✅ Covered in new requirements
**Database Changes Required**:
- Add `texture` field to ProductSchema: `texture: { type: String, enum: ['gel', 'lightweight', 'gel-cream', 'cream', 'rich-cream', 'balm'] }`
- Tag existing products with texture based on formulation

**Code Changes Required**:
- Update `buildProfile()` to add `preferredTexture` array based on age:
  - under18, 18-25: `['gel', 'lightweight']`
  - 26-35: `['gel-cream', 'lightweight']`
  - 36-45: `['cream', 'rich-cream']`
  - 46+: `['rich-cream', 'balm']`
- Update `calculateProductScore()` to add texture matching (+5-10 points)

**Files**: `src/lib/mongodb.js`, `src/lib/recommendationEngine.js`

#### 1.3 Hard vs Soft Constraints (NEW)
**Status**: ✅ Covered in new requirements
**Questionnaire Changes Required**:
- Split `preferences` question into two:
  1. **"Do you have any known allergies?"** (Hard constraints)
     - Options: Common allergens (nuts, soy, specific preservatives, etc.)
     - Stored in: `responses.allergies` (new field)
  2. **"Do you have preferences?"** (Soft constraints)
     - Options: vegan, fragrance-free, cruelty-free, natural (existing)
     - Stored in: `responses.preferences` (existing field)

**Database Changes Required**:
- Add `fullIngredientList` field to ProductSchema (optional, but recommended)
  - `fullIngredientList: { type: [String], default: [] }`
- This allows checking hard constraints against full ingredient list

**Code Changes Required**:
- Update `calculateProductScore()` to check hard constraints FIRST
  - If product contains ANY allergy ingredient → return score of -999 (disqualified)
  - Check `fullIngredientList` if available, otherwise check `keyIngredients`
- Update soft constraints to use penalty/bonus system:
  - Preference match: +5 points
  - Preference mismatch: -10 points (but not disqualified)

**Files**: `src/data/questions.js`, `src/lib/mongodb.js`, `src/lib/recommendationEngine.js`, `src/app/api/submit-consultation/route.js`

---

### PHASE 2: Flawless Recommendation Core

#### 2.1 Multi-Pass Recommendation System (NEW)
**Status**: ✅ Covered in new requirements
**Purpose**: Ensure users always get complete routines, even with strict constraints

**Implementation**:
- Modify `recommendProducts()` to implement 4-pass system:

**Pass 1: Perfect Match**
- Run scoring with ALL constraints (hard, soft, preferences, budget)
- Check if all required categories have at least one product (score > 20)
- If YES → Done, proceed to routines
- If NO → Add notice and proceed to Pass 2

**Pass 2: Relax Preferences**
- Temporarily ignore `budget` and `preferences` scoring
- Re-run scoring
- Check again for all required categories
- If YES → Done, add notice about compromise
- If NO → Proceed to Pass 3

**Pass 3: Relax Secondary Concerns**
- Remove lowest priority concern from calculation
- Re-run scoring
- Check again for all required categories
- If YES → Done, add notice about focusing on primary concerns
- If NO → Proceed to Pass 4

**Pass 4: Essential Fallback**
- For missing critical categories (cleanser, SPF), run minimal scoring:
  - Only score based on: Skin Type + Sensitivity
  - Ignore all other constraints
- This ensures user always gets safe, basic products

**Code Changes Required**:
- Refactor `recommendProducts()` to support multiple passes
- Add `notices` array to track compromises
- Add validation function to check if all required categories have products
- Return notices along with recommendations

**Files**: `src/lib/recommendationEngine.js`

#### 2.2 Minimum Score Threshold (EXISTING + ENHANCED)
**Status**: ✅ Partially covered (new requirements use score > 20)
**Action**: Implement minimum score threshold (20 points) before recommending products
**Files**: `src/lib/recommendationEngine.js`

#### 2.3 Usage Time Validation (MISSING FROM NEW REQUIREMENTS)
**Status**: ⚠️ Not mentioned in new requirements, but still needed
**Action**: Filter products by `usage` field when building routines
- Morning routine: Only use products with `usage: 'morning'` or `usage: 'both'`
- Evening routine: Only use products with `usage: 'evening'` or `usage: 'both'`
**Files**: `src/lib/recommendationEngine.js` (buildMorningRoutine, buildEveningRoutine)

#### 2.4 Climate Suitability (MISSING FROM NEW REQUIREMENTS)
**Status**: ⚠️ Not mentioned, but database has field
**Action**: Add climate matching to scoring (+5 points for climate match)
**Files**: `src/lib/recommendationEngine.js`

#### 2.5 Product Rating (MISSING FROM NEW REQUIREMENTS)
**Status**: ⚠️ Not mentioned, but database has field
**Action**: Add rating to scoring (normalize to 0-10 points: `(rating / 5) * 10`)
**Files**: `src/lib/recommendationEngine.js`

#### 2.6 Concern Priority Weighting (EXISTING + ENHANCED)
**Status**: ✅ Partially covered (new requirements mention priority, but not implementation)
**Action**: Use concern priority scores to weight concern matches in product scoring
- Current: `concernScore = (concernMatches.length / this.concerns.length) * 35`
- New: `concernScore = sum(concernMatches.map(c => c.priorityScore)) / totalPriority * 35`
**Files**: `src/lib/recommendationEngine.js`

#### 2.7 Budget Tier Hierarchy (EXISTING + ENHANCED)
**Status**: ⚠️ Not fully addressed in new requirements
**Action**: Implement tier hierarchy (budget < mid < premium)
- Exact match: +5 points
- Adjacent tier: +3 points (budget → mid, mid → premium)
- Two tiers away: +1 point (budget → premium)
**Files**: `src/lib/recommendationEngine.js`

#### 2.8 Product Diversity (MISSING FROM NEW REQUIREMENTS)
**Status**: ⚠️ Not mentioned, but improves UX
**Action**: When selecting top 2 products, prefer different brands when scores are similar
- If top 2 products are from same brand and scores are within 5 points, prefer second-best product from different brand
**Files**: `src/lib/recommendationEngine.js`

---

### PHASE 3: Flawless Report Output

#### 3.1 Reasoning Snippets (NEW)
**Status**: ✅ Covered in new requirements
**Purpose**: Explain why each product was chosen

**Implementation**:
- Modify `calculateProductScore()` to return object instead of number:
  ```javascript
  return {
    score: 85,
    reasoning: [
      "Matches your 'Oily' skin type.",
      "Targets your primary concern: 'Acne & Breakouts'.",
      "Contains Niacinamide to help control oil and reduce redness.",
      "This is a fragrance-free product, perfect for your sensitive skin."
    ]
  }
  ```
- Build reasoning array as score is calculated
- Each scoring component adds reasoning snippet

**Code Changes Required**:
- Refactor `calculateProductScore()` to return `{ score, reasoning }`
- Update all scoring logic to add reasoning snippets
- Update `recommendProducts()` to handle score objects
- Store reasoning in recommendations

**Files**: `src/lib/recommendationEngine.js`

#### 3.2 Display "Why" in ReportViewer (NEW)
**Status**: ✅ Covered in new requirements
**Purpose**: Show reasoning to user in UI

**Implementation**:
- Update `ReportViewer.jsx` to display reasoning snippets
- Create component to render reasoning as bulleted list under each product
- Style appropriately (e.g., subtle text, icons)

**Files**: `src/components/ReportViewer.jsx`

#### 3.3 Failsafe/Compromise Notifications (NEW)
**Status**: ✅ Covered in new requirements
**Purpose**: Transparently communicate compromises made

**Implementation**:
- Add `notices` array to `generateCompleteAnalysis()` return value
- Display notices in `ReportViewer.jsx` at top of report
- Examples:
  - "We couldn't find products that match all your preferences. We've widened the search..."
  - "This product is over your budget, but is the best match for your acne and sensitivity."
  - "This routine focuses on your primary goal of reducing acne. We recommend addressing dullness after your skin has calmed down."

**Files**: `src/lib/recommendationEngine.js`, `src/components/ReportViewer.jsx`

---

## 🔄 INTEGRATION CHECKLIST

### Database Schema Updates Needed:
- [ ] Add `gender` field to ProductSchema (enum: ['male', 'female', 'neutral'])
- [ ] Add `texture` field to ProductSchema (enum: ['gel', 'lightweight', 'gel-cream', 'cream', 'rich-cream', 'balm'])
- [ ] Add `fullIngredientList` field to ProductSchema (array of strings, optional)
- [ ] Fix category name mismatch (`eye_cream` vs `eye-cream`)
- [ ] Ensure all categories are lowercase
- [ ] Ensure all ingredients are normalized (lowercase, hyphens)
- [ ] Tag existing products with gender (most = 'neutral')
- [ ] Tag existing products with texture
- [ ] Add full ingredient lists to products (if available)

### Questionnaire Updates Needed:
- [ ] Split `preferences` question into `allergies` (hard) and `preferences` (soft)
- [ ] Add common allergen options (nuts, soy, preservatives, etc.)
- [ ] Update ConsultationSchema to include `allergies` field
- [ ] Update API route to handle `allergies` field

### Code Updates Needed:
- [ ] Fix category name mismatch
- [ ] Add data validation (required fields, null checks)
- [ ] Fix case sensitivity issues
- [ ] Add gender-specific scoring
- [ ] Add age-based texture preferences
- [ ] Add hard constraints (allergies) checking
- [ ] Update soft constraints (preferences) scoring
- [ ] Implement multi-pass recommendation system
- [ ] Add minimum score threshold
- [ ] Add usage time validation
- [ ] Add climate suitability scoring
- [ ] Add product rating scoring
- [ ] Add concern priority weighting
- [ ] Add budget tier hierarchy
- [ ] Add product diversity logic
- [ ] Refactor `calculateProductScore()` to return reasoning
- [ ] Update `recommendProducts()` to handle multi-pass system
- [ ] Add `notices` array to analysis output
- [ ] Update `ReportViewer.jsx` to display reasoning
- [ ] Update `ReportViewer.jsx` to display notices

### Testing Needed:
- [ ] Test with user having allergies (hard constraints)
- [ ] Test with user having many preferences (soft constraints)
- [ ] Test multi-pass system (no perfect match → relax preferences → relax concerns → fallback)
- [ ] Test gender-specific recommendations
- [ ] Test age-based texture preferences
- [ ] Test reasoning snippets generation
- [ ] Test notices display
- [ ] Test edge cases (empty database, no matches, etc.)

---

## 📋 PRIORITIZED IMPLEMENTATION ORDER

### Week 1: Foundation (Phase 0)
1. Fix category name mismatch
2. Add data validation
3. Fix case sensitivity
4. Update database schema (gender, texture, fullIngredientList)

### Week 2: Enhanced Profile (Phase 1)
1. Split preferences question (allergies vs preferences)
2. Add gender-specific scoring
3. Add age-based texture preferences
4. Add hard constraints (allergies) checking
5. Update soft constraints (preferences) scoring

### Week 3: Flawless Core (Phase 2)
1. Implement multi-pass recommendation system
2. Add minimum score threshold
3. Add usage time validation
4. Add climate suitability scoring
5. Add product rating scoring
6. Add concern priority weighting
7. Add budget tier hierarchy
8. Add product diversity logic

### Week 4: Flawless Output (Phase 3)
1. Refactor `calculateProductScore()` to return reasoning
2. Update `recommendProducts()` to return notices
3. Update `ReportViewer.jsx` to display reasoning
4. Update `ReportViewer.jsx` to display notices
5. Test all edge cases

---

## 🚨 CRITICAL GAPS IDENTIFIED

### Missing from New Requirements (But Still Needed):

1. **Usage Time Validation** - Critical for preventing morning products in evening routine
2. **Climate Suitability** - Database has field but it's unused
3. **Product Rating** - Database has field but it's unused
4. **Product Diversity** - Improves user experience
5. **Treatment Category Handling** - Products exist but aren't used in routines
6. **Optional Categories** - Concern mapping has optional categories but they're ignored
7. **Frequency Field Usage** - Database has field but routines use hardcoded frequencies
8. **Duplicate Prevention** - Same product could be recommended twice
9. **Data Validation** - No validation of product structure before scoring

### Recommendations:
- **Include all missing items** in implementation plan
- **Prioritize critical items** (usage time, data validation) in Phase 2
- **Consider optional items** (product diversity, optional categories) as enhancements

---

## 📝 NOTES

1. **Database Migration**: Will need to update existing products with new fields (gender, texture, fullIngredientList)
2. **Backward Compatibility**: Ensure existing consultations still work after changes
3. **Performance**: Multi-pass system will be slower - consider caching or optimization
4. **User Experience**: Notices should be friendly and explanatory, not technical
5. **Testing**: Need comprehensive test cases for all edge cases
6. **Documentation**: Document all scoring weights and their rationale
7. **Monitoring**: Add logging to track which pass was used and why

---

## ✅ CONCLUSION

**The new requirements are excellent and add significant value**, but they **don't cover all technical issues**. We need to:

1. ✅ **Implement new requirements** (gender logic, multi-pass system, reasoning)
2. ⚠️ **Also implement missing technical fixes** (usage time, climate, rating, etc.)
3. ✅ **Combine both** for a truly flawless system

**Total Requirements**: 
- **New Requirements**: 9 items (expert system logic)
- **Missing Technical Fixes**: 9 items (still needed)
- **Total**: 18 items to implement

**Recommendation**: Implement all items in the prioritized order above for a complete, flawless recommendation system.

