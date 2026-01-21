# Conditional Question Flow Logic
## Smart Questionnaire Routing Based on User Responses

### Date: Today
### Status: Draft - Pending Approval

---

## 🎯 GOAL

Create a **smart, conditional question flow** that:
1. Shows relevant questions based on user's previous answers
2. Avoids asking irrelevant questions (e.g., shaving to females)
3. Reduces total questions by showing only what's needed
4. Makes the questionnaire feel personalized, not annoying

---

## 📊 PROPOSED QUESTION FLOW

### Base Questions (Always Shown):
1. **Age Range** - Always shown (affects texture preferences)
2. **Skin Type** - Always shown (core requirement)
3. **Sensitivity** - Always shown (core requirement)
4. **Primary Concerns** - Always shown (core requirement)
5. **Acne Severity** - Conditional (only if acne selected)
6. **Current Routine** - Always shown
7. **Sun Exposure** - Always shown
8. **Climate** - Always shown
9. **Lifestyle Factors** - Always shown (optional)
10. **Allergies** - Always shown (safety critical)
11. **Preferences** - Always shown

### Conditional Questions (Based on Responses):

#### Option A: Gender-Based Routing (Simpler)
**Logic**: Use gender to route to different question sets, but **don't use gender for scoring**

**Flow**:
1. **Gender Question** (Keep it, but only for routing, not scoring)
   - Options: Male, Female, Non-binary, Prefer not to say
   
2. **Conditional Routing**:
   - **If Male**: Show shaving question
   - **If Female**: Show hormonal/makeup questions
   - **If Non-binary**: Show general lifestyle questions
   - **If Prefer not to say**: Skip to scent preference

3. **Scent Preference**: Show to everyone (after conditional questions)

**Pros**:
- Simple logic
- Clear routing
- Familiar question (gender)

**Cons**:
- Still asks gender (but only for routing, not scoring)
- Some users might still find it unnecessary

---

#### Option B: Behavioral Routing (Better - Recommended)
**Logic**: Use behavioral questions to route, no gender question needed

**Flow**:
1. **Skin Care Routine Question** (Enhanced)
   - "What's your current skincare routine like?"
   - Options: None/Basic, Moderate, Extensive
   - **Follow-up**: If Extensive → Ask about specific products used

2. **Lifestyle Factors Question** (Enhanced)
   - "Which of these apply to you?"
   - Options: Stress, Sleep, Makeup, Exercise, **Facial Hair Removal**, Travel, None
   - **Follow-up**: If "Facial Hair Removal" selected → Show shaving-specific questions

3. **Scent Preference**: Show to everyone

**Pros**:
- No gender question needed
- More inclusive
- Based on actual behaviors
- Natural flow

**Cons**:
- Slightly more complex logic
- Requires enhancing existing questions

---

#### Option C: Hybrid Approach (Best - Recommended)
**Logic**: Combine both approaches - use enhanced questions with smart routing

**Flow**:

**Step 1: Enhanced Lifestyle Factors**
- Question: "Which of these apply to you?"
- Options: 
  - High stress levels
  - Irregular sleep patterns
  - Heavy makeup use
  - **Facial hair removal** (shaving, waxing, etc.) ← NEW
  - Regular exercise/sweating
  - Frequent travel
  - None of the above

**Step 2: Conditional Follow-up Questions**

**If "Facial hair removal" selected:**
- Show: "How do you remove facial hair?"
  - Options: Shaving, Waxing, Threading, Laser, Other
- Show: "How often do you remove facial hair?"
  - Options: Daily, 2-3x per week, Weekly, Occasionally
- **Logic**: If shaving + frequent → Prioritize soothing ingredients, avoid irritants

**If "Heavy makeup use" selected:**
- Show: "What type of makeup do you wear?"
  - Options: Light (BB cream, tinted moisturizer), Medium (foundation), Heavy (full coverage)
- **Logic**: If heavy makeup → Prioritize double cleansing, non-comedogenic products

**If "High stress levels" selected:**
- Show: "Do you experience stress-related skin issues?"
  - Options: Breakouts, Inflammation, Dryness, None
- **Logic**: If breakouts/inflammation → Prioritize calming ingredients

**Step 3: Scent Preference** (Always shown to everyone)

**Pros**:
- No gender question needed
- More inclusive and personalized
- Based on actual behaviors
- Natural, conversational flow
- Users only see relevant questions

**Cons**:
- More complex logic
- Requires updating existing questions

---

## 🎯 RECOMMENDED APPROACH: Option C (Hybrid)

### Question Flow Logic:

```
1. Age Range (Always)
2. Skin Type (Always)
3. Sensitivity (Always)
4. Primary Concerns (Always)
5. Acne Severity (Conditional: only if acne selected)
6. Current Routine (Always)
7. Sun Exposure (Always)
8. Climate (Always)
9. Lifestyle Factors (Enhanced - Always, but triggers conditionals)
   ├─ If "Facial hair removal" → Show shaving questions
   ├─ If "Heavy makeup use" → Show makeup questions
   └─ If "High stress levels" → Show stress questions
10. Shaving Details (Conditional: only if facial hair removal selected)
11. Makeup Details (Conditional: only if heavy makeup selected)
12. Stress Details (Conditional: only if high stress selected)
13. Scent Preference (Always - after conditionals)
14. Allergies (Always)
15. Preferences (Always)
```

---

## 📋 DETAILED CONDITIONAL LOGIC

### Conditional Question 1: Facial Hair Removal

**Trigger**: User selects "Facial hair removal" in Lifestyle Factors

**Follow-up Questions**:
1. **"How do you remove facial hair?"**
   - Options: Shaving, Waxing, Threading, Laser, Other
   - **Scoring Logic**:
     - If Shaving → Check for soothing ingredients (+5), avoid irritants (-10)
     - If Waxing/Threading → Check for calming ingredients (+3)
     - If Laser → Check for sensitive skin products (+3)

2. **"How often do you remove facial hair?"**
   - Options: Daily, 2-3x per week, Weekly, Occasionally
   - **Scoring Logic**:
     - If Daily/Frequent → Stronger emphasis on soothing ingredients
     - If Occasionally → Lighter emphasis

**Benefits**:
- Only shown to users who actually remove facial hair
- More accurate than gender-based assumption
- Inclusive (works for all genders)

---

### Conditional Question 2: Heavy Makeup Use

**Trigger**: User selects "Heavy makeup use" in Lifestyle Factors

**Follow-up Questions**:
1. **"What type of makeup do you typically wear?"**
   - Options: Light (BB cream, tinted moisturizer), Medium (foundation), Heavy (full coverage)
   - **Scoring Logic**:
     - If Heavy → Prioritize double cleansing products (+5)
     - If Heavy → Prioritize non-comedogenic products (+3)
     - If Heavy → Prioritize pore-clearing ingredients (+3)

**Benefits**:
- Only shown to users who wear makeup
- Helps recommend proper cleansing routine
- Prevents clogged pores

---

### Conditional Question 3: High Stress Levels

**Trigger**: User selects "High stress levels" in Lifestyle Factors

**Follow-up Questions**:
1. **"Do you experience stress-related skin issues?"**
   - Options: Breakouts, Inflammation/Redness, Dryness, None
   - **Scoring Logic**:
     - If Breakouts → Prioritize acne-fighting ingredients (+3)
     - If Inflammation → Prioritize calming ingredients (centella, niacinamide) (+5)
     - If Dryness → Prioritize barrier repair ingredients (+3)

**Benefits**:
- Only shown to users with stress
- Helps address stress-related skin issues
- More targeted recommendations

---

### Conditional Question 4: Acne Severity (Already Exists)

**Trigger**: User selects "Acne" in Primary Concerns

**Follow-up Questions**:
1. **"How would you describe your acne?"**
   - Options: Mild, Moderate, Severe
   - **Scoring Logic**: Already implemented (concern priority modifiers)

**Benefits**:
- Already working
- Only shown when relevant

---

## 🎯 SCORING LOGIC UPDATES

### 1. Shaving Logic (Conditional)
**Trigger**: User selects "Facial hair removal" + "Shaving" + "Daily/Frequent"

**Scoring**:
- Soothing ingredients: +5 points (centella, allantoin, aloe-vera, chamomile, green-tea, niacinamide)
- Irritants penalty: -10 points (alcohol, denatured-alcohol, ethanol, high-alcohol, astringent)
- Not disqualified: Products with irritants are penalized but not disqualified

---

### 2. Makeup Logic (Conditional)
**Trigger**: User selects "Heavy makeup use" + "Heavy (full coverage)"

**Scoring**:
- Double cleansing products: +5 points (oil cleansers, balm cleansers)
- Non-comedogenic products: +3 points
- Pore-clearing ingredients: +3 points (salicylic-acid, niacinamide, clay)

---

### 3. Stress Logic (Conditional)
**Trigger**: User selects "High stress levels" + "Inflammation/Redness"

**Scoring**:
- Calming ingredients: +5 points (centella, niacinamide, green-tea, chamomile)
- Barrier repair ingredients: +3 points (ceramides, hyaluronic-acid)

---

### 4. Scent Preference (Always)
**Scoring**:
- Scent match: +3 points
- Works for everyone

---

## 📊 QUESTION FLOW VISUALIZATION

### Example Flow 1: Male User Who Shaves
```
1. Age Range → 26-35
2. Skin Type → Oily
3. Sensitivity → Somewhat
4. Primary Concerns → Acne, Oiliness
5. Acne Severity → Moderate (conditional: acne selected)
6. Current Routine → Moderate
7. Sun Exposure → Moderate
8. Climate → Hot-humid
9. Lifestyle Factors → Facial hair removal, Exercise
10. Facial Hair Removal Method → Shaving (conditional: facial hair removal selected)
11. Facial Hair Removal Frequency → Daily (conditional: facial hair removal selected)
12. Scent Preference → Unscented
13. Allergies → None
14. Preferences → Fragrance-free, Oil-free
```

### Example Flow 2: Female User Who Wears Makeup
```
1. Age Range → 26-35
2. Skin Type → Combination
3. Sensitivity → Not
4. Primary Concerns → Dullness, Aging
5. Current Routine → Extensive (no acne, so no acne severity question)
6. Sun Exposure → Moderate
7. Climate → Moderate
8. Lifestyle Factors → Heavy makeup use, Stress
9. Makeup Type → Heavy (conditional: heavy makeup selected)
10. Stress Skin Issues → Breakouts (conditional: stress selected)
11. Scent Preference → Floral
12. Allergies → Fragrance
13. Preferences → Cruelty-free, Natural
```

### Example Flow 3: User with No Special Conditions
```
1. Age Range → 18-25
2. Skin Type → Normal
3. Sensitivity → Not
4. Primary Concerns → Dullness
5. Current Routine → Basic
6. Sun Exposure → Minimal
7. Climate → Moderate
8. Lifestyle Factors → None
9. Scent Preference → No preference (no conditionals triggered)
10. Allergies → None
11. Preferences → None
```

---

## 🎯 BENEFITS OF CONDITIONAL FLOW

### 1. Personalized Experience
- Users only see relevant questions
- Feels like a conversation, not an interrogation
- Reduces questionnaire length for most users

### 2. More Accurate
- Questions are based on actual behaviors, not assumptions
- More targeted recommendations
- Better user experience

### 3. Inclusive
- No gender assumptions
- Works for all users
- Respects individual preferences

### 4. Efficient
- Shorter questionnaire for users without special conditions
- Only shows what's needed
- Reduces drop-off rate

---

## 📋 IMPLEMENTATION DETAILS

### Question Structure:

```javascript
{
  id: 'lifestyleFactors',
  question: "Which of these apply to you?",
  type: 'multiple',
  options: [
    { value: 'stress', label: 'High stress levels' },
    { value: 'sleep', label: 'Irregular sleep patterns' },
    { value: 'makeup', label: 'Heavy makeup use' },
    { value: 'facial-hair-removal', label: 'Facial hair removal' }, // NEW
    { value: 'exercise', label: 'Regular exercise/sweating' },
    { value: 'travel', label: 'Frequent travel' },
    { value: 'none', label: 'None of the above' },
  ],
}

// Conditional question 1: Facial hair removal
{
  id: 'facialHairRemovalMethod',
  question: "How do you remove facial hair?",
  type: 'single',
  conditional: {
    dependsOn: 'lifestyleFactors',
    showIf: (value) => value && value.includes('facial-hair-removal'),
  },
  options: [
    { value: 'shaving', label: 'Shaving' },
    { value: 'waxing', label: 'Waxing' },
    { value: 'threading', label: 'Threading' },
    { value: 'laser', label: 'Laser' },
    { value: 'other', label: 'Other' },
  ],
}

// Conditional question 2: Facial hair removal frequency
{
  id: 'facialHairRemovalFrequency',
  question: "How often do you remove facial hair?",
  type: 'single',
  conditional: {
    dependsOn: 'facialHairRemovalMethod', // Only show if method is selected
    showIf: (value) => value && value !== 'none',
  },
  options: [
    { value: 'daily', label: 'Daily' },
    { value: '2-3x-week', label: '2-3 times per week' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'occasionally', label: 'Occasionally' },
  ],
}

// Conditional question 3: Makeup type
{
  id: 'makeupType',
  question: "What type of makeup do you typically wear?",
  type: 'single',
  conditional: {
    dependsOn: 'lifestyleFactors',
    showIf: (value) => value && value.includes('makeup'),
  },
  options: [
    { value: 'light', label: 'Light (BB cream, tinted moisturizer)' },
    { value: 'medium', label: 'Medium (foundation)' },
    { value: 'heavy', label: 'Heavy (full coverage)' },
  ],
}

// Conditional question 4: Stress skin issues
{
  id: 'stressSkinIssues',
  question: "Do you experience stress-related skin issues?",
  type: 'multiple',
  conditional: {
    dependsOn: 'lifestyleFactors',
    showIf: (value) => value && value.includes('stress'),
  },
  options: [
    { value: 'breakouts', label: 'Breakouts' },
    { value: 'inflammation', label: 'Inflammation/Redness' },
    { value: 'dryness', label: 'Dryness' },
    { value: 'none', label: 'None' },
  ],
}
```

---

## 🎯 SCORING LOGIC UPDATES

### 1. Facial Hair Removal Logic

**If user shaves frequently (daily/2-3x per week)**:
- Soothing ingredients: +5 points
- Irritants penalty: -10 points

**If user waxes/threads**:
- Calming ingredients: +3 points
- Barrier repair ingredients: +3 points

**If user uses laser**:
- Sensitive skin products: +3 points
- Calming ingredients: +3 points

---

### 2. Makeup Logic

**If user wears heavy makeup**:
- Double cleansing products: +5 points
- Non-comedogenic products: +3 points
- Pore-clearing ingredients: +3 points

---

### 3. Stress Logic

**If user has stress-related breakouts**:
- Acne-fighting ingredients: +3 points

**If user has stress-related inflammation**:
- Calming ingredients: +5 points
- Barrier repair ingredients: +3 points

**If user has stress-related dryness**:
- Barrier repair ingredients: +3 points
- Hydrating ingredients: +3 points

---

## 📊 QUESTION COUNT COMPARISON

### Before (Current):
- Total questions: ~12-13 (depending on conditionals)
- Gender question: 1 (always shown)
- Shaving question: 1 (always shown - problematic)
- Scent question: 1 (always shown)

### After (Proposed):
- Base questions: ~11 (always shown)
- Conditional questions: 0-4 (only if relevant)
- **Total questions**: 11-15 (but personalized)

### User Experience:
- **User with no special conditions**: 11 questions (shorter!)
- **User with facial hair removal**: 13 questions (+2 conditional)
- **User with makeup + stress**: 15 questions (+4 conditional)

**Result**: Most users get shorter questionnaire, users with special needs get personalized questions

---

## 🎯 RECOMMENDED IMPLEMENTATION

### Phase 1: Enhanced Lifestyle Factors
1. Add "Facial hair removal" option to Lifestyle Factors
2. Keep existing options (stress, sleep, makeup, exercise, travel)

### Phase 2: Conditional Questions
1. Add facial hair removal method question (conditional)
2. Add facial hair removal frequency question (conditional)
3. Add makeup type question (conditional)
4. Add stress skin issues question (conditional)

### Phase 3: Scoring Logic
1. Update shaving logic to use conditional questions
2. Add makeup logic (double cleansing, non-comedogenic)
3. Add stress logic (calming ingredients, barrier repair)
4. Keep scent preference (always shown)

### Phase 4: Remove Gender Question
1. Remove gender question from questionnaire
2. Remove gender from scoring logic (already done)
3. Keep gender field in schema for backward compatibility

---

## ✅ SUMMARY

### Proposed Flow:
1. **Base Questions** (Always shown): Age, Skin Type, Sensitivity, Concerns, Routine, Sun, Climate, Lifestyle, Allergies, Preferences
2. **Conditional Questions** (Only if relevant):
   - Facial hair removal → Method + Frequency
   - Heavy makeup → Makeup type
   - High stress → Stress skin issues
3. **Scent Preference** (Always shown - after conditionals)

### Benefits:
- ✅ No gender question needed
- ✅ More inclusive (works for all users)
- ✅ Personalized (only relevant questions)
- ✅ Shorter for most users (11 questions vs 12-13)
- ✅ More accurate (based on behaviors, not assumptions)

### Database/Excel:
- ✅ No changes needed (uses existing fields)
- ✅ Optional: Add scent tags to products
- ✅ Recommended: Add texture tags to products

---

## 🚀 NEXT STEPS

1. **Review this logic** - Does this make sense?
2. **Approve approach** - Which option do you prefer? (Recommended: Option C - Hybrid)
3. **Implement** - When you say "go", I'll implement this in the code

---

## 📝 NOTES

1. **Gender Question**: Can be removed entirely (not needed for routing or scoring)
2. **Conditional Logic**: Already supported in questionnaire flow (acne severity is conditional)
3. **Scoring**: Uses existing fields (keyIngredients, preferences, texture)
4. **Database**: No schema changes needed
5. **Backward Compatibility**: Existing consultations will still work (gender field kept in schema)

---

## 🎯 RECOMMENDATION

**Go with Option C (Hybrid Approach)**:
- Most inclusive (no gender assumptions)
- Most personalized (conditional questions)
- Most efficient (shorter for most users)
- Most accurate (based on behaviors)

**Ready to implement when you approve!** 🚀

