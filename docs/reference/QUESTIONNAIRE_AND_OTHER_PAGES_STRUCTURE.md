# Questionnaire and Other Pages UI Structure
## Complete Design Specifications for Questionnaire Flow, Save Report, and View Report Search

### Document Purpose
This document contains detailed UI specifications for:
1. **Questionnaire Flow** (all questions from start to finish)
2. **Save Report Section** (within report page)
3. **View Report Search Page** (searching for saved reports)

**Note**: This document does NOT include the Report Viewer Page details (see `REPORT_PAGE_UI_STRUCTURE.md` for that).

---

## PART 1: QUESTIONNAIRE FLOW

### Overall Layout

#### Container
- **Max Width**: 3xl (768px)
- **Centering**: Auto margins (mx-auto)
- **Padding**: 4 (16px vertical), 4 (16px horizontal)
- **Background**: Default/white page background
- **Animation**: Framer Motion slide transitions between questions

---

### Progress Bar Section (Top of Page)

#### Layout
- **Position**: Top of questionnaire, above question card
- **Margin Bottom**: 8 (32px)

#### Elements

##### Progress Text
- **Layout**: Flex, justify-between
- **Left Text**: "Question X of Y"
  - Text size: sm (14px)
  - Text color: gray-600
- **Right Text**: "Z% Complete"
  - Text size: sm (14px)
  - Text color: gray-600
- **Margin Bottom**: 2 (8px)

##### Progress Bar
- **Container**: 
  - Height: 2 (8px)
  - Background: gray-200
  - Border Radius: rounded-full
  - Overflow: hidden

- **Progress Fill**: 
  - Height: Full (100%)
  - Background: Gradient (from-pink-500 to-purple-600)
  - Border Radius: rounded-full
  - Animation: Width animates from 0% to progress percentage
  - Transition: Duration 0.3s

---

### Question Card

#### Container
- **Background**: white
- **Border Radius**: rounded-2xl
- **Shadow**: shadow-lg
- **Padding**: 8 (32px)
- **Margin Bottom**: 6 (24px)
- **Animation**: 
  - Initial: opacity 0, x: 50
  - Animate: opacity 1, x: 0
  - Exit: opacity 0, x: -50
  - Transition: Duration 0.3s
  - Mode: "wait" (wait for exit before entering)

#### Question Structure

##### Question Title
- **Text**: Current question text
- **Style**: 
  - Text size: 2xl (24px)
  - Font weight: Bold
  - Text color: gray-900
  - Margin bottom: 3 (12px)

##### Question Description (Optional)
- **Text**: Help text or explanation
- **Style**: 
  - Text color: gray-600
  - Margin bottom: 6 (24px)
  - Visibility: Only if description exists

##### Options Container

###### Layout Logic
- **2-Column Layout**: 
  - Applied if `useTwoColumns: true` OR options.length >= 6
  - Grid: 1 column on mobile, 2 columns on desktop (md:grid-cols-2)
  - Gap: 3 (12px)

- **Single Column Layout**: 
  - Applied if options.length < 6 AND `useTwoColumns` is false
  - Vertical stack (space-y-3)
  - Gap: 3 (12px)

###### Option Button (Clickable)

**Container**:
- **Width**: Full width
- **Text Align**: Left
- **Padding**: 4 (16px)
- **Border Radius**: rounded-xl
- **Border**: 2px solid
- **Transition**: All properties
- **Cursor**: Pointer

**States**:
- **Selected**: 
  - Border: purple-500
  - Background: purple-50

- **Unselected**: 
  - Border: gray-200
  - Hover: border-purple-300, background-gray-50

**Content Layout**:
- **Flex**: items-center

**Icon** (if present):
- **Size**: text-2xl (24px)
- **Margin Right**: 3 (12px)
- **Flex**: flex-shrink-0
- **Content**: Emoji or icon

**Text Content**:
- **Flex**: flex-1, min-w-0 (allows text truncation)

**Label**:
- **Font Weight**: Semibold
- **Text Color**: gray-900

**Description** (if present):
- **Text Size**: sm (14px)
- **Text Color**: gray-600
- **Margin Top**: 1 (4px)

**Checkmark** (if selected):
- **Container**: 
  - Width: 6 (24px)
  - Height: 6 (24px)
  - Shape: Circle (rounded-full)
  - Background: purple-500
  - Layout: Flex, items-center, justify-center
  - Flex: flex-shrink-0
  - Margin Left: 2 (8px)

- **Icon**: 
  - White checkmark (SVG)
  - Width: 4 (16px)
  - Height: 4 (16px)

##### Selection Counter (Multiple Choice Only)

**Visibility**: 
- Only shows for multiple choice questions
- Only if selections exist (responses[questionId].length > 0)

**Content**:
- **Text**: "{count} {concern/concerns} selected"
  - Text size: sm (14px)
  - Text color: gray-500
  - Margin top: 4 (16px)

- **Tip** (if 5+ selected AND no maxSelections):
  - Text: "💡 Tip: Focus on your top 3-5 for best results"
  - Text color: amber-600
  - Margin left: 2 (8px)

---

### Error Message Section (Conditional)

#### Visibility
- Only displays if error exists

#### Layout
- **Background**: red-50
- **Border**: 1px solid, red-200
- **Border Radius**: rounded-lg
- **Padding**: 4 (16px)
- **Margin Bottom**: 6 (24px)

#### Content
- **Text**: Error message
- **Text Color**: red-800

---

### Navigation Buttons Section

#### Layout
- **Flex**: justify-between
- **Position**: Bottom of questionnaire

#### Back Button

**Position**: Left side

**Button**:
- **Layout**: Flex, items-center
- **Padding**: 6 (24px) horizontal, 3 (12px) vertical
- **Border Radius**: rounded-lg
- **Border**: 2px solid, gray-300
- **Text Color**: gray-700
- **Font Weight**: Semibold
- **Background**: Transparent
- **Hover**: background-gray-50
- **Transition**: Colors
- **Disabled State**: 
  - Opacity: 50%
  - Cursor: not-allowed

**Content**:
- **Icon**: ChevronLeft (w-5 h-5, margin-right 2)
- **Text**: "Back"

**Disabled When**: 
- validStep === 0 (first question)
- OR currentQuestion is null

#### Next/Submit Button

**Position**: Right side

**Button**:
- **Layout**: Flex, items-center
- **Padding**: 6 (24px) horizontal, 3 (12px) vertical
- **Border Radius**: rounded-lg
- **Background**: Gradient (from-pink-500 to-purple-600)
- **Text Color**: white
- **Font Weight**: Semibold
- **Shadow**: shadow-lg on hover
- **Transition**: All properties
- **Disabled State**: 
  - Opacity: 50%
  - Cursor: not-allowed

**Content**:
- **Loading State** (isSubmitting):
  - Icon: Loader2 (w-5 h-5, animate-spin, margin-right 2)
  - Text: "Processing..."

- **Last Question** (validStep === totalSteps - 1):
  - Text: "Get My Report"

- **Other Questions**:
  - Text: "Next"
  - Icon: ChevronRight (w-5 h-5, margin-left 2)

**Disabled When**: 
- Question is not answered (!isAnswered())
- OR isSubmitting is true

---

## QUESTIONNAIRE QUESTIONS DETAILS

### Question 1: Age Range
- **ID**: `ageRange`
- **Type**: Single choice
- **Required**: Yes
- **Question**: "What's your age range?"
- **Description**: "This helps us understand your skin's needs at this life stage."
- **Layout**: Single column (6 options)
- **Options**:
  1. Under 18 (👶)
  2. 18-25 (🧑)
  3. 26-35 (👨)
  4. 36-45 (👨‍💼)
  5. 46-55 (👨‍🦳)
  6. 56+ (👴)

### Question 2: Skin Type
- **ID**: `skinType`
- **Type**: Single choice
- **Required**: Yes
- **Question**: "How would you describe your skin type overall?"
- **Description**: "Think about how your skin feels most of the day."
- **Layout**: Single column (5 options)
- **Options**:
  1. Oily (💧) - "Shiny, large pores, prone to breakouts"
  2. Dry (🏜️) - "Tight, flaky, rough texture"
  3. Combination (🔀) - "Oily T-zone, dry cheeks"
  4. Normal (✨) - "Balanced, not too oily or dry"
  5. Not sure (❓) - "We'll help you figure it out"

### Question 3: Sensitivity
- **ID**: `sensitivity`
- **Type**: Single choice
- **Required**: Yes
- **Question**: "Does your skin react easily to products or environmental factors?"
- **Description**: "Helps us avoid ingredients that might irritate your skin."
- **Layout**: Single column (3 options)
- **Options**:
  1. Very sensitive - "Redness, burning, reactions frequent"
  2. Somewhat sensitive - "Occasional reactions"
  3. Not sensitive - "Rarely reacts"

### Question 4: Primary Concerns
- **ID**: `primaryConcerns`
- **Type**: Multiple choice
- **Required**: Yes
- **Max Selections**: None (flexible, suggests 3-5)
- **Question**: "What are your main skin concerns?"
- **Description**: "Select all that apply. We recommend choosing your top 3-5 most important concerns for the best recommendations."
- **Layout**: 2-column grid (10 options)
- **Options**:
  1. Acne / breakouts (🔴)
  2. Dark spots / pigmentation (🌗)
  3. Fine lines / wrinkles (📅)
  4. Dryness / dehydration (💦)
  5. Excess oil / shine (✨)
  6. Dullness / lack of radiance (🌑)
  7. Redness / inflammation (🔥)
  8. Dark circles (😴)
  9. Large pores (⭕)
  10. Texture / roughness (🪨)

**Selection Counter**: 
- Shows count: "X concerns selected"
- Shows tip if 5+ selected: "💡 Tip: Focus on your top 3-5 for best results"

### Question 5: Acne Severity (Conditional)
- **ID**: `acneSeverity`
- **Type**: Single choice
- **Required**: Yes (if shown)
- **Conditional**: Only shows if "acne" is selected in primaryConcerns
- **Question**: "How would you describe your acne?"
- **Description**: "This helps us recommend the right strength of products."
- **Layout**: Single column (3 options)
- **Options**:
  1. Mild - "Occasional pimples"
  2. Moderate - "Regular breakouts, some scarring"
  3. Severe - "Painful cysts, significant scarring"

### Question 6: Current Routine
- **ID**: `currentRoutine`
- **Type**: Single choice
- **Required**: Yes
- **Question**: "What's your current skincare routine like?"
- **Description**: "We'll recommend a routine that matches your comfort level."
- **Layout**: Single column (4 options)
- **Options**:
  1. I don't have one / very minimal
  2. Basic - "Cleanser and moisturizer"
  3. Moderate - "Cleanser, treatment, moisturizer, SPF"
  4. Extensive - "5+ steps"

### Question 7: Sun Exposure
- **ID**: `sunExposure`
- **Type**: Single choice
- **Required**: Yes
- **Question**: "How much time do you spend outdoors daily?"
- **Description**: "Affects SPF recommendations and pigmentation risk."
- **Layout**: Single column (3 options)
- **Options**:
  1. Minimal - "Mostly indoors"
  2. Moderate - "1-3 hours"
  3. High - "3+ hours or outdoor job"

### Question 8: Climate
- **ID**: `climate`
- **Type**: Single choice
- **Required**: Yes
- **Question**: "What's your local climate like?"
- **Description**: "Helps us recommend the right product textures."
- **Layout**: Single column (5 options)
- **Options**:
  1. Hot & humid (🌴)
  2. Hot & dry (🏜️)
  3. Cold & dry (❄️)
  4. Cold & humid (🌧️)
  5. Moderate/Temperate (🌤️)

### Question 9: Lifestyle Factors
- **ID**: `lifestyleFactors`
- **Type**: Multiple choice
- **Required**: No
- **Question**: "Which of these apply to you?"
- **Description**: "Contextual factors that affect your skin. We'll ask follow-up questions if needed."
- **Layout**: 2-column grid (8 options)
- **Options**:
  1. High stress levels
  2. Heavy makeup use
  3. Irregular sleep
  4. Facial hair removal
  5. Regular exercise
  6. Frequent travel
  7. Smoker
  8. None of the above

### Question 10: Facial Hair Removal Method (Conditional)
- **ID**: `facialHairRemovalMethod`
- **Type**: Single choice
- **Required**: Yes (if shown)
- **Conditional**: Only shows if "facial-hair-removal" is selected in lifestyleFactors
- **Question**: "How do you remove facial hair?"
- **Description**: "This helps us recommend products that work best with your hair removal method."
- **Layout**: Single column (5 options)
- **Options**:
  1. Shaving
  2. Waxing
  3. Threading
  4. Laser
  5. Other

### Question 11: Facial Hair Removal Frequency (Conditional)
- **ID**: `facialHairRemovalFrequency`
- **Type**: Single choice
- **Required**: Yes (if shown)
- **Conditional**: Only shows if facialHairRemovalMethod is selected and not 'none'
- **Question**: "How often do you remove facial hair?"
- **Description**: "This helps us recommend the right products for your frequency."
- **Layout**: Single column (4 options)
- **Options**:
  1. Daily
  2. 2-3 times per week
  3. Weekly
  4. Occasionally

### Question 12: Makeup Type (Conditional)
- **ID**: `makeupType`
- **Type**: Single choice
- **Required**: Yes (if shown)
- **Conditional**: Only shows if "makeup" is selected in lifestyleFactors
- **Question**: "What type of makeup do you typically wear?"
- **Description**: "This helps us recommend the right cleansing and skincare products."
- **Layout**: Single column (3 options)
- **Options**:
  1. Light - "BB cream, tinted moisturizer"
  2. Medium - "Foundation"
  3. Heavy - "Full coverage"

### Question 13: Stress Skin Issues (Conditional)
- **ID**: `stressSkinIssues`
- **Type**: Multiple choice
- **Required**: No (if shown)
- **Conditional**: Only shows if "stress" is selected in lifestyleFactors
- **Question**: "Do you experience stress-related skin issues?"
- **Description**: "This helps us recommend products to address stress-related concerns."
- **Layout**: Single column (4 options)
- **Options**:
  1. Breakouts
  2. Inflammation/Redness
  3. Dryness
  4. None

### Question 14: Scent Preference
- **ID**: `scentPreference`
- **Type**: Single choice
- **Required**: Yes
- **Question**: "What scent do you prefer in skincare products?"
- **Description**: "We'll prioritize products that match your scent preference."
- **Layout**: Single column (6 options)
- **Options**:
  1. Unscented / Fragrance-free (🌿)
  2. Citrus (lemon, orange, grapefruit) (🍋)
  3. Floral (rose, lavender, jasmine) (🌹)
  4. Woody / Spicy (sandalwood, cedar) (🌲)
  5. Fresh / Clean (mint, eucalyptus) (🌱)
  6. No preference (✨)

### Question 15: Allergies
- **ID**: `allergies`
- **Type**: Multiple choice
- **Required**: No
- **Question**: "Do you have any known allergies to skincare ingredients?"
- **Description**: "We'll completely avoid products containing these ingredients for your safety."
- **Layout**: 2-column grid (17 options)
- **Options**:
  1. Fragrance/Parfum
  2. Alcohol
  3. Retinol/Vitamin A
  4. Vitamin C
  5. Salicylic Acid
  6. Glycolic Acid
  7. Benzoyl Peroxide
  8. Parabens
  9. Sulfates
  10. Nuts
  11. Soy
  12. Wheat/Gluten
  13. Dairy
  14. Niacinamide
  15. Lactic Acid
  16. Hydroquinone
  17. No known allergies

### Question 16: Preferences
- **ID**: `preferences`
- **Type**: Multiple choice
- **Required**: No
- **Question**: "Any product preferences?"
- **Description**: "We'll prioritize products that match your preferences, but may recommend alternatives if needed."
- **Layout**: 2-column grid (11 options)
- **Options**:
  1. Fragrance-free
  2. Vegan
  3. Cruelty-free
  4. Paraben-free
  5. Sulfate-free
  6. Alcohol-free
  7. Oil-free
  8. Non-comedogenic
  9. Natural/Organic
  10. Hypoallergenic
  11. No specific preferences

---

## PART 2: SAVE REPORT SECTION

### Note
This section appears within the Report Viewer Page, but is documented here as it's part of the user flow (not the report display itself).

### Layout
- **Background**: Gradient (from-purple-50 to-pink-50)
- **Border**: 2px solid, purple-200
- **Border Radius**: rounded-2xl
- **Shadow**: shadow-lg
- **Padding**: 8 (32px)
- **Margin Bottom**: 8 (32px)
- **Animation**: Fade-in/slide animation

### Elements

#### Title
- **Icon**: 💾 (Save icon emoji, text-3xl)
- **Text**: "Save Your Report"
- **Style**: text-2xl, bold, gray-900
- **Layout**: Flex with icon (margin-right 3)
- **Margin Bottom**: 4 (16px)

#### Description
- **Text**: "Enter your email or mobile number to access this report later. Visit /view-report anytime to view it!"
- **Style**: gray-600, margin-bottom 6

#### Form

##### Label
- **Text**: "Email or Mobile Number"
- **Icons**: Mail and Phone icons (Lucide, w-4 h-4)
- **Style**: block, text-sm, font-semibold, gray-700, margin-bottom 2
- **Layout**: Flex with icons, gap-2

##### Input Field
- **Type**: Text input
- **Width**: Full width
- **Padding**: 4 (16px) horizontal, 3 (12px) vertical
- **Border**: 2px solid, gray-300
- **Border Radius**: rounded-lg
- **Focus State**: 
  - Border: purple-500
  - Ring: 2px, purple-200
- **Placeholder**: "your.email@example.com or +1 234 567 8900"
- **Transition**: All properties

##### Helper Text
- **Text**: "* Enter your email address or mobile number to access this report later"
- **Style**: text-sm, gray-500, italic, margin-top 2

##### Error Message (if error)
- **Background**: red-50
- **Border**: 2px solid, red-200
- **Border Radius**: rounded-lg
- **Padding**: 4 (16px)
- **Text**: red-800, text-sm

##### Submit Button
- **Style**: 
  - Full width on mobile, auto on desktop
  - Padding: 6 (24px) horizontal, 3 (12px) vertical
  - Gradient: from-pink-500 to-purple-600
  - Text: White, bold
  - Border Radius: rounded-lg
  - Shadow: shadow-lg, hover: shadow-xl
  - Transition: All properties
- **States**:
  - Default: Full opacity
  - Disabled: opacity-50, cursor-not-allowed
  - Loading: Shows Loader2 icon (spinning) + "Saving..."
  - Success: Shows CheckCircle icon + "Save Report"
- **Layout**: Flex, items-center, justify-center, gap-2

### Success Message (After Save)

#### Layout
- **Background**: green-50
- **Border**: 2px solid, green-200
- **Border Radius**: rounded-2xl
- **Shadow**: shadow-lg
- **Padding**: 8 (32px)
- **Margin Bottom**: 8 (32px)
- **Animation**: Scale and fade animation

#### Elements
- **Icon**: CheckCircle (w-8 h-8, green-600)
- **Title**: "Report Saved Successfully!" (text-2xl, bold, gray-900)
- **Description**: 
  - Text: gray-700
  - Includes link to /view-report
  - Mentions email or mobile number based on what was saved
- **Layout**: Flex with icon, gap-3

---

## PART 3: VIEW REPORT SEARCH PAGE

### Page Route
- **URL**: `/view-report`
- **Purpose**: Allows users to search for their saved reports by email or phone number

### Overall Layout

#### Container
- **Min Height**: Full screen (min-h-screen)
- **Background**: Gradient (from-pink-50 via-purple-50 to-blue-50)
- **Padding**: 12 (48px) vertical
- **Max Width**: 4xl (896px) for content
- **Centering**: Auto margins (mx-auto)
- **Padding Horizontal**: 4 (16px)

### Loading State (Suspense Fallback & Initial Load)

#### Layout
- **Background**: Gradient (from-pink-50 via-purple-50 to-blue-50)
- **Min Height**: Full screen
- **Layout**: Flex, items-center, justify-center
- **Padding**: 12 (48px) vertical

#### Elements
- **Spinner**: 
  - Width: 16 (64px)
  - Height: 16 (64px)
  - Border: 4px solid, purple-500
  - Border Top: Transparent
  - Border Radius: rounded-full
  - Animation: animate-spin
  - Centered: mx-auto
  - Margin Bottom: 4 (16px)

- **Text**: "Loading..." or "Loading your report..."
  - Text color: gray-600
  - Centered alignment

### Header Section (Only shown when NOT viewing a report)

#### Visibility
- Only displays when `selectedConsultation` is null
- Hides when a report is being viewed

#### Layout
- **Text Align**: Center
- **Margin Bottom**: 12 (48px)
- **Animation**: Fade-in from bottom (y: 20 → 0)

#### Elements

##### Title
- **Text**: "View Your Reports"
- **Style**: 
  - Text size: 5xl (48px)
  - Font weight: Bold
  - Gradient text: from-pink-500 to-purple-600 (bg-clip-text, text-transparent)
  - Margin bottom: 4 (16px)

##### Description
- **Text**: "Enter your email or mobile number to access your saved skincare consultation reports"
- **Style**: 
  - Text size: xl (20px)
  - Text color: gray-600
  - Max width: 2xl (672px)
  - Centered: mx-auto

### Search Form Section (Only shown when NOT viewing a report)

#### Visibility
- Only displays when `selectedConsultation` is null

#### Layout
- **Background**: white
- **Border Radius**: rounded-2xl
- **Shadow**: shadow-lg
- **Padding**: 8 (32px)
- **Margin Bottom**: 8 (32px)
- **Animation**: Fade-in from bottom (y: 20 → 0) with 0.2s delay

#### Form

##### Form Container
- **Layout**: Vertical stack (space-y-6)

##### Input Field

###### Label
- **Text**: "Email or Mobile Number"
- **Icons**: Mail and Phone icons (Lucide, w-4 h-4)
- **Style**: 
  - Block display
  - Text size: sm (14px)
  - Font weight: Semibold
  - Text color: gray-700
  - Margin bottom: 2 (8px)
- **Layout**: Flex with icons, gap-2

###### Input
- **Type**: Text input
- **ID**: "contactInfo"
- **Width**: Full width
- **Padding**: 4 (16px) horizontal, 3 (12px) vertical
- **Border**: 2px solid, gray-300
- **Border Radius**: rounded-lg
- **Focus State**: 
  - Border: purple-500
  - Ring: 2px, purple-200
- **Placeholder**: "your.email@example.com or +1 234 567 8900"
- **Transition**: All properties
- **Disabled State**: 
  - Opacity: 50%
  - Cursor: not-allowed
- **Auto-saves to localStorage**: Saves contact info for persistence

###### Helper Text
- **Text**: "* Enter your email address or mobile number to access your saved reports"
- **Style**: 
  - Text size: sm (14px)
  - Text color: gray-500
  - Italic
  - Margin top: 2 (8px)

##### Error Message (if error)

###### Layout
- **Background**: red-50
- **Border**: 2px solid, red-200
- **Border Radius**: rounded-lg
- **Padding**: 4 (16px)
- **Layout**: Flex, items-start, gap-3

###### Content
- **Icon**: AlertCircle (w-5 h-5, red-600, flex-shrink-0, margin-top 0.5)
- **Text**: Error message
- **Text Color**: red-800
- **Text Size**: sm (14px)

##### Submit Button

###### Button
- **Width**: Full width
- **Padding**: 6 (24px) horizontal, 3 (12px) vertical
- **Background**: Gradient (from-pink-500 to-purple-600)
- **Text**: White, bold
- **Border Radius**: rounded-lg
- **Shadow**: shadow-lg, hover: shadow-xl
- **Transition**: All properties
- **Layout**: Flex, items-center, justify-center, gap-2

###### States
- **Default**: 
  - Icon: Search (w-5 h-5)
  - Text: "Find My Reports"

- **Loading**: 
  - Icon: Loader2 (spinning, w-5 h-5)
  - Text: "Searching..."

- **Disabled**: 
  - Opacity: 50%
  - Cursor: not-allowed
  - Disabled when: isSearching is true

### Consultation List Section (Results - Only shown when NOT viewing a report)

#### Visibility
- Only displays when `consultations` array exists, has items, AND `selectedConsultation` is null

#### Layout
- **Background**: white
- **Border Radius**: rounded-2xl
- **Shadow**: shadow-lg
- **Padding**: 8 (32px)
- **Margin Bottom**: 8 (32px)
- **Animation**: Fade-in from bottom (y: 20 → 0), exit animation (y: -20, opacity 0)

#### Header

##### Title
- **Text**: "Your Reports ({count})"
- **Style**: 
  - Text size: 2xl (24px)
  - Font weight: Bold
  - Text color: gray-900
  - Margin bottom: 6 (24px)
- **Layout**: Flex with icon, items-center
- **Icon**: FileText (w-6 h-6, margin-right 3)

#### Report Cards List

##### Container
- **Layout**: Vertical stack (space-y-4)

##### Report Card (Clickable Button)

**Container**:
- **Width**: Full width
- **Text Align**: Left
- **Padding**: 6 (24px)
- **Background**: Gradient (from-purple-50 to-pink-50)
- **Border**: 2px solid, purple-200
- **Border Radius**: rounded-xl
- **Hover**: 
  - Border: purple-400
  - Shadow: shadow-lg
- **Transition**: All properties
- **Cursor**: Pointer

**Layout**: Flex, items-start, justify-between

**Left Side**:
- **Layout**: flex-1

###### Number Badge + Title
- **Layout**: Flex, items-center, gap-3, margin-bottom 2

**Number Badge**:
- **Size**: 10x10 (40px)
- **Shape**: Circle (rounded-full)
- **Background**: Gradient (from-pink-500 to-purple-600)
- **Text**: White, bold
- **Layout**: Flex, items-center, justify-center
- **Flex**: flex-shrink-0
- **Content**: Index + 1 (1, 2, 3, etc.)

**Title Section**:
- **Title**: "Skincare Consultation Report"
  - Font weight: Bold
  - Text size: lg (18px)
  - Text color: gray-900

- **Consultation ID**: 
  - Text: "ID: {consultationId}"
  - Text size: sm (14px)
  - Text color: gray-600

###### Metadata
- **Layout**: Flex, items-center, gap-4, margin-top 3
- **Text Size**: sm (14px)
- **Text Color**: gray-600

**Date**:
- **Layout**: Flex, items-center, gap-2
- **Icon**: Calendar (w-4 h-4)
- **Text**: Formatted date (e.g., "January 15, 2024")

**Email** (if exists):
- **Layout**: Flex, items-center, gap-2
- **Icon**: Mail (w-4 h-4)
- **Text**: Email address

**Phone** (if exists):
- **Layout**: Flex, items-center, gap-2
- **Icon**: Phone (w-4 h-4)
- **Text**: Phone number

**Right Side**:
- **Text**: "View →"
  - Text color: purple-600
  - Font weight: Semibold
  - Margin left: 4 (16px)

**Click Action**: Calls `handleSelectConsultation(consultation)` to load the report

### Selected Report Section (Report View)

#### Visibility
- Only displays when `selectedConsultation` exists AND has `analysis` property

#### Layout
- **Animation**: Fade-in from bottom (y: 20 → 0), exit animation (y: -20, opacity 0)

#### Navigation Buttons (Top)

##### Layout
- **Margin Bottom**: 6 (24px)
- **Layout**: Flex, items-center, justify-between

##### Back to Search Button
- **Position**: Left
- **Button**: 
  - Background: white
  - Border: 2px solid, gray-300
  - Border Radius: rounded-lg
  - Padding: 4 (16px) horizontal, 2 (8px) vertical
  - Hover: background-gray-50
  - Transition: Colors
  - Text: gray-700, semibold
  - Layout: Flex, items-center, gap-2
- **Text**: "← Back to Search"
- **Action**: 
  - Clears selectedConsultation
  - Clears error
  - Removes saved consultation ID from localStorage
  - Replaces URL to /view-report (removes ID parameter)
  - Keeps consultations list (search results) visible

##### Back to Home Link
- **Position**: Right
- **Link**: 
  - Text: "← Back to Home"
  - Text color: purple-600
  - Hover: purple-700, underline
  - Font weight: Semibold
- **Href**: "/"

#### Report Viewer Component
- **Component**: ReportViewer
- **Props**:
  - `consultationId`: selectedConsultation.consultationId
  - `analysis`: selectedConsultation.analysis
  - `hideSaveForm`: true (don't show save form when viewing saved report)
  - `customerInfo`: selectedConsultation.customerInfo
- **See**: `REPORT_PAGE_UI_STRUCTURE.md` for full ReportViewer details

### Back to Home Link (Footer - Only shown when NOT viewing a report)

#### Visibility
- Only displays when `selectedConsultation` is null

#### Layout
- **Text Align**: Center
- **Margin Top**: 8 (32px)

#### Link
- **Text**: "← Back to Home"
- **Text Color**: purple-600
- **Hover**: purple-700, underline
- **Font Weight**: Semibold
- **Href**: "/"

---

## View Report Search Page - User Flow

### Initial Load
1. **Page Loads**: Shows loading spinner (Suspense fallback)
2. **Content Loads**: Shows header and search form
3. **Auto-load Check**: 
   - Checks URL for `?id=consultationId` parameter
   - If present and contact info saved, auto-loads that consultation
   - If present but no contact info, tries to load directly

### Search Flow
1. **User Enters Contact Info**: Email or phone number in input field
2. **User Clicks "Find My Reports"**: Form submits
3. **Loading State**: Button shows spinner, "Searching..."
4. **Validation**: 
   - Checks if input is valid email or phone
   - Shows error if invalid
5. **API Call**: Searches for consultations matching email or phone
6. **Results**:
   - **If Found**: Shows list of consultation cards
   - **If Single Result**: Auto-selects and loads that report
   - **If Not Found**: Shows error message
7. **User Clicks Report Card**: Loads that specific report

### View Report Flow
1. **Report Selected**: ReportViewer component displays
2. **Navigation**: "Back to Search" button appears at top
3. **User Clicks "Back to Search"**: 
   - Returns to search form
   - Keeps search results visible
   - Clears selected consultation
   - Updates URL to remove ID parameter

### URL Persistence
- **With ID**: `/view-report?id=consultationId` - Auto-loads that consultation
- **Without ID**: `/view-report` - Shows search form
- **Navigation**: URL updates when consultation is selected/cleared

### localStorage Persistence
- **Contact Info**: Saves to `view-report-contact` key
- **Selected Consultation ID**: Saves to `view-report-selected-id` key
- **Auto-restore**: Loads saved contact info on page load
- **Clear on Navigation**: Clears selected ID when navigating to /view-report without ID

---

## Design System (Shared)

### Color Palette
- **Primary Gradient**: pink-500 → purple-600
- **Secondary Gradient**: purple-600 → pink-600
- **Info**: blue-50, blue-200, blue-600
- **Success**: green-50, green-200, green-500, green-600
- **Error**: red-50, red-200, red-600, red-800
- **Purple**: purple-50, purple-100, purple-200, purple-300, purple-500, purple-600
- **Gray**: gray-50, gray-100, gray-200, gray-300, gray-400, gray-500, gray-600, gray-700, gray-800, gray-900

### Typography
- **Headings**: 
  - H1: text-4xl, bold
  - H2: text-3xl, bold
  - H3: text-2xl, bold
  - H4: text-xl, bold
- **Body**: 
  - Large: text-lg
  - Medium: text-base
  - Small: text-sm
  - Extra Small: text-xs
- **Weights**: 
  - Bold: 700
  - Semibold: 600
  - Regular: 400

### Spacing
- **Padding**: 
  - Small: 2 (8px)
  - Medium: 4 (16px)
  - Large: 6 (24px)
  - Extra Large: 8 (32px), 12 (48px)
- **Margin**: 
  - Small: 2 (8px)
  - Medium: 4 (16px)
  - Large: 6 (24px)
  - Extra Large: 8 (32px), 12 (48px)
- **Gaps**: 
  - Small: 2 (8px)
  - Medium: 3 (12px), 4 (16px)
  - Large: 6 (24px)

### Borders & Shadows
- **Border Radius**: 
  - Small: rounded-lg
  - Medium: rounded-xl
  - Large: rounded-2xl
  - Full: rounded-full
- **Borders**: 
  - Thin: 1px
  - Medium: 2px
- **Shadows**: 
  - Small: shadow-sm
  - Medium: shadow-md, shadow-lg
  - Large: shadow-xl
  - Hover: Increased shadow

### Animations
- **Page Load**: Fade-in (opacity 0 → 1)
- **Question Transitions**: Slide (x: 50 → 0, opacity 0 → 1)
- **Progress Bar**: Width animation
- **Form Submission**: Loading spinner
- **Results**: Staggered fade-in
- **Transitions**: All properties, smooth (0.2s - 0.3s)

### Responsive Design
- **Mobile**: 
  - Single column layouts
  - Full width containers
  - Reduced padding
  - Stacked elements
- **Desktop**: 
  - Max-width containers
  - 2-column grids where applicable
  - More spacing
- **Breakpoint**: md (768px)

### Interactive States
- **Hover**: 
  - Background color change
  - Shadow increase
  - Border color change
- **Active**: 
  - Border color change
  - Background tint
- **Disabled**: 
  - Opacity: 50%
  - Cursor: not-allowed
- **Focus**: 
  - Ring: 2px, colored
  - Border color change
- **Selected**: 
  - Purple border
  - Purple-50 background
- **Loading**: 
  - Spinner animation
  - Disabled state

---

## User Flow

### Questionnaire Flow
1. **Start**: User lands on consultation page
2. **Progress**: User answers questions one by one
3. **Navigation**: User can go back/forward
4. **Selection**: User selects options (single or multiple)
5. **Validation**: Next button enables when question answered
6. **Submit**: User clicks "Get My Report" on last question
7. **Processing**: Loading state with spinner
8. **Complete**: Redirects to report page

### Save Report Flow
1. **View Report**: User sees report page
2. **Save Option**: User sees save form (if not already saved)
3. **Enter Contact**: User enters email or phone
4. **Submit**: User clicks "Save Report"
5. **Loading**: Button shows spinner
6. **Success**: Success message appears
7. **Access**: User can later access via /view-report

### View Report Search Flow
1. **Navigate**: User goes to /view-report
2. **Enter Contact**: User enters email or phone
3. **Search**: User clicks "Search Reports"
4. **Loading**: Button shows spinner
5. **Results**: 
   - If found: List of reports with "View Report" buttons
   - If not found: "No Reports Found" message
6. **View**: User clicks "View Report" to see report

---

This document provides complete UI specifications for the Questionnaire Flow, Save Report Section, and View Report Search Page. Use this for design mockups, wireframes, and implementation reference.

