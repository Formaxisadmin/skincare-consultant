# Report Page UI Structure
## Complete Design Specifications for the Personalized Skincare Report View

### Document Purpose
This document contains detailed UI specifications for the **Report Viewer Page** only. Use this for designing the report display interface.

---

## Overall Layout

### Container
- **Max Width**: 4xl (896px)
- **Centering**: Auto margins (mx-auto)
- **Padding**: 4 (16px vertical), 4 (16px horizontal)
- **Background**: Default/white page background
- **Animation**: Staggered fade-in effects using Framer Motion

### Section Structure
- **Card Style**: White background, rounded-2xl corners, shadow-lg
- **Padding**: 8 (32px) on all sides
- **Margin Bottom**: 8 (32px) between sections
- **Animation**: Sequential fade-in with 0.2s delay increments

---

## 1. Header Section

### Layout
- **Position**: Top of page, centered
- **Margin Bottom**: 12 (48px)
- **Animation**: Fade-in from bottom (y: 20 → 0)

### Elements

#### Title
- **Text**: "Your Personalized Skincare Report"
- **Style**: 
  - Gradient text (from-pink-500 to-purple-600)
  - Text size: 4xl (36px)
  - Font weight: Bold
  - Background clip: Text (gradient effect)
  - Centered alignment
  - Margin bottom: 4 (16px)

#### Consultation ID
- **Text**: "Consultation ID: {consultationId}"
- **Style**: 
  - Text color: gray-600
  - Centered alignment
  - Regular font weight

---

## 2. Notices Section (Conditional)

### Visibility
- Only displays if `notices` array has items
- Shows important system messages about recommendations

### Layout
- **Background**: blue-50
- **Border**: 2px solid, blue-200
- **Border Radius**: rounded-2xl
- **Padding**: 6 (24px)
- **Margin Bottom**: 8 (32px)
- **Animation**: Fade-in from bottom

### Elements

#### Icon
- **Type**: Info icon (Lucide)
- **Size**: w-6 h-6 (24px)
- **Color**: blue-600
- **Position**: Left side, flex-shrink-0
- **Margin Top**: 1 (4px) for alignment

#### Content
- **Title**: "Important Information"
  - Font weight: Bold
  - Text color: blue-900
  - Margin bottom: 2 (8px)

#### Notice List
- **Layout**: Vertical stack (space-y-2)
- **Items**: 
  - Bullet point (•) in blue-600
  - Text in blue-800
  - Text size: sm (14px)
  - Flex layout with gap-2

---

## 3. Save Report Section (Conditional)

### Visibility
- Shows if `hideSaveForm` is false AND customer info is not saved
- Hides after successful save (shows success message instead)

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
- **Icon**: 💾 (Save icon emoji)
- **Text**: "Save Your Report"
- **Style**: text-2xl, bold, gray-900
- **Layout**: Flex with icon (text-3xl, margin-right 3)

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

## 4. Skin Profile Section

### Layout
- **Background**: White
- **Border Radius**: rounded-2xl
- **Shadow**: shadow-lg
- **Padding**: 8 (32px)
- **Margin Bottom**: 8 (32px)
- **Animation**: Fade-in with 0.2s delay

### Elements

#### Title
- **Icon**: 🔍 (Magnifying glass emoji)
- **Text**: "Understanding Your Skin"
- **Style**: text-2xl, bold, gray-900
- **Layout**: Flex with icon (text-3xl, margin-right 3)
- **Margin Bottom**: 6 (24px)

#### Profile Grid
- **Layout**: 2-column grid on desktop (md:grid-cols-2), 1 column on mobile
- **Gap**: 6 (24px)

#### Profile Fields

##### Field Structure (Each)
- **Label**: 
  - Font weight: Semibold
  - Text color: gray-700
  - Margin bottom: 2 (8px)
- **Value**: 
  - Text size: lg (18px)
  - Text transform: Capitalize
  - Fallback: "Not specified" if missing

##### Fields
1. **Skin Type**
   - Label: "Skin Type"
   - Value: `profile.skinType` (capitalized)

2. **Sensitivity Level**
   - Label: "Sensitivity Level"
   - Value: `profile.sensitivity` (capitalized)

3. **Climate**
   - Label: "Climate"
   - Value: `profile.climate` (replace '-' with ' ', capitalized)

4. **Sun Exposure**
   - Label: "Sun Exposure"
   - Value: `profile.sunExposure` (capitalized)

---

## 5. Identified Concerns Section

### Layout
- **Background**: White
- **Border Radius**: rounded-2xl
- **Shadow**: shadow-lg
- **Padding**: 8 (32px)
- **Margin Bottom**: 8 (32px)
- **Animation**: Fade-in with 0.3s delay

### Elements

#### Title
- **Icon**: 🎯 (Target emoji)
- **Text**: "Your Skin Concerns"
- **Style**: text-2xl, bold, gray-900
- **Layout**: Flex with icon (text-3xl, margin-right 3)
- **Margin Bottom**: 6 (24px)

#### Concerns List
- **Layout**: Vertical stack (space-y-4)
- **Empty State**: "No concerns identified." (gray-500, italic, centered)

#### Concern Item

##### Structure
- **Border Left**: 4px solid, purple-500
- **Padding Left**: 4 (16px)
- **Padding Y**: 2 (8px)

##### Content
- **Title**: 
  - Font weight: Bold
  - Text size: lg (18px)
  - Text color: gray-900
  - Source: `concern.name` or `concern.concern` or "Unknown"

- **Description**: 
  - Text color: gray-600
  - Source: `concern.description` or "No description available"

- **Priority Score** (if available):
  - Text size: sm (14px)
  - Text color: purple-600
  - Font weight: Semibold
  - Format: "Priority Score: X.X" (1 decimal place)
  - Margin top: 2 (8px)

---

## 6. Product Recommendations Section

### Layout
- **Background**: White
- **Border Radius**: rounded-2xl
- **Shadow**: shadow-lg
- **Padding**: 8 (32px)
- **Margin Bottom**: 8 (32px)
- **Animation**: Fade-in with 0.4s delay

### Header Section

#### Left Side
- **Title**: 
  - Icon: 💎 (Diamond emoji)
  - Text: "Recommended Products"
  - Style: text-2xl, bold, gray-900
  - Layout: Flex with icon (text-3xl, margin-right 3)

- **Subtitle** (below title):
  - Quick View Mode: "Clean, minimal view • Click 'Why?' to see reasoning"
  - Detailed View Mode: "Detailed view • Reasoning shown by default"
  - Style: text-sm, gray-500, margin-top 1, margin-left 11

#### Right Side (Controls)
- **Layout**: Flex, items-center, gap-2, flex-wrap

##### Quick View / Detailed View Toggle

###### Button Container
- **Layout**: Flex column, items-end, gap-1

###### Button
- **Padding**: 4 (16px) horizontal, 2.5 (10px) vertical
- **Border Radius**: rounded-lg
- **Text Size**: sm (14px)
- **Font Weight**: Semibold
- **Shadow**: shadow-sm
- **Transition**: All properties
- **Border**: 2px solid

###### States
- **Quick View Active**:
  - Background: blue-100
  - Text: blue-700
  - Border: blue-300
  - Hover: blue-200
  - Icon: 📋
  - Text: "Quick View"

- **Detailed View Active**:
  - Background: purple-100
  - Text: purple-700
  - Border: purple-300
  - Hover: purple-200
  - Icon: 🔍
  - Text: "Detailed View"

###### Sub-label
- **Text**: "Minimal" (Quick View) or "Comprehensive" (Detailed View)
- **Style**: text-xs, gray-400

##### Phased View Toggle (if phased recommendations exist)
- **Button**: 
  - Background: gray-100
  - Text: gray-700
  - Padding: 3 (12px), 2 (8px)
  - Border Radius: rounded-lg
  - Text Size: xs (12px)
  - Font Weight: Semibold
  - Hover: gray-200
  - Icon: RefreshCw (w-3 h-3)
  - Text: "All Products" or "Phased View"

##### Add All Button
- **Button**: 
  - Gradient: from-purple-600 to-pink-600
  - Text: White
  - Padding: 3 (12px), 2 (8px)
  - Border Radius: rounded-lg
  - Text Size: xs (12px)
  - Font Weight: Semibold
  - Shadow: shadow-lg on hover
  - Icon: Package (w-3 h-3)
  - Text: "Add All"

### Content: Phased View (Default)

#### Phase 1: Core (Must-Haves)

##### Container
- **Border**: 2px solid, green-200
- **Border Radius**: rounded-xl
- **Padding**: 6 (24px)
- **Background**: green-50
- **Margin Bottom**: 8 (32px) if other phases exist

##### Header
- **Layout**: Flex, items-center, justify-between, margin-bottom 4

###### Left Side
- **Title**: "Phase 1: Core (Must-Haves)"
  - Text size: xl (20px)
  - Font weight: Bold
  - Text color: gray-900
  - Margin bottom: 1 (4px)

- **Description**: "Essential products for healthy skin. Start here!"
  - Text size: sm (14px)
  - Text color: gray-600

###### Right Side
- **Button**: "Add Core Routine to Cart"
  - Gradient: from-green-600 to-emerald-600
  - Text: White
  - Font weight: Bold
  - Padding: 6 (24px) horizontal, 3 (12px) vertical
  - Border Radius: rounded-lg
  - Shadow: shadow-lg on hover
  - Icon: ShoppingCart (w-5 h-5)
  - Layout: Flex, items-center, gap-2

##### Products List
- **Layout**: Vertical stack (space-y-4)
- **Items**: ProductCard components (see below)

#### Phase 2: Treatment (High-Impact)

##### Container
- **Border**: 2px solid, blue-200
- **Border Radius**: rounded-xl
- **Padding**: 6 (24px)
- **Background**: blue-50
- **Margin Bottom**: 8 (32px) if Phase 3 exists

##### Header
- **Title**: "Phase 2: Treatment (High-Impact)"
  - Text size: xl (20px)
  - Font weight: Bold
  - Text color: gray-900
  - Margin bottom: 1 (4px)

- **Description**: "Once your skin is balanced, add this step to target your main concern."
  - Text size: sm (14px)
  - Text color: gray-600
  - Margin bottom: 4 (16px)

##### Products List
- **Layout**: Vertical stack (space-y-4)
- **Items**: ProductCard components

#### Phase 3: Boosters (Optimize)

##### Container
- **Border**: 2px solid, purple-200
- **Border Radius**: rounded-xl
- **Padding**: 6 (24px)
- **Background**: purple-50

##### Header
- **Title**: "Phase 3: Boosters (Optimize)"
  - Text size: xl (20px)
  - Font weight: Bold
  - Text color: gray-900
  - Margin bottom: 1 (4px)

- **Description**: "Optional add-ons to enhance your results."
  - Text size: sm (14px)
  - Text color: gray-600
  - Margin bottom: 4 (16px)

##### Products List
- **Layout**: Vertical stack (space-y-4)
- **Items**: ProductCard components

### Content: Standard View (All Products)

#### Layout
- **Container**: Vertical stack (space-y-6)
- **Empty State**: "No product recommendations available." (gray-500, italic, centered, padding-y 8)

#### Products
- **List**: All products in a single list (no phase grouping)
- **Items**: ProductCard components for each category

### ProductCard Component

#### Container
- **Border Bottom**: 1px solid, gray-200
- **Padding Bottom**: 6 (24px)
- **Last Item**: No border (last:border-0)

#### Header Row
- **Layout**: Flex, items-center, justify-between, margin-bottom 4

##### Left Side
- **Category Name**: 
  - Font weight: Bold
  - Text size: lg (18px)
  - Text color: gray-900
  - Text transform: Uppercase
  - Letter spacing: Wide (tracking-wide)

##### Right Side (Controls)
- **Layout**: Flex, items-center, gap-2

###### "Why?" Button (if reasoning exists)
- **Visibility**: Only shows if product has reasoning
- **Button**: 
  - Padding: 3 (12px) horizontal, 1.5 (6px) vertical
  - Text size: xs (12px)
  - Font weight: Semibold
  - Border Radius: rounded-lg
  - Border: 1px solid
  - Transition: All properties

###### States
- **Active (Reasoning Shown)**:
  - Text: blue-700
  - Background: blue-50
  - Border: blue-300
  - Hover: blue-100
  - Text: "Hide Details"

- **Inactive (Reasoning Hidden)**:
  - Text: gray-600
  - Background: Transparent
  - Border: gray-300
  - Hover: gray-800 text, gray-100 background
  - Text: "Why?"
  - Badge: Shows reason count in Quick View mode (white background, rounded, small)

###### "Compare" Button (if alternative exists)
- **Visibility**: Only shows if alternative product exists
- **Button**: 
  - Text: purple-600
  - Hover: purple-700 text, purple-50 background
  - Border Radius: rounded
  - Padding: 2 (8px) horizontal, 1 (4px) vertical
  - Text size: xs (12px)
  - Font weight: Semibold
  - Icon: ChevronDown (when collapsed) or ChevronUp (when expanded)
  - Text: "Compare" or "Hide Comparison"

#### Product Display

##### Single View (Default)

###### Card
- **Layout**: Flex, gap-3
- **Padding**: 3 (12px) in comparison mode, 3 (12px) in single mode
- **Background**: 
  - Single mode: gray-50, rounded-xl
  - Comparison mode: transparent
- **Hover**: gray-100 background (single mode only)
- **Transition**: Colors
- **Height**: Full height in comparison mode

###### Product Icon
- **Size**: 14x14 (56px)
- **Background**: Gradient (from-purple-200 to-pink-200)
- **Border Radius**: rounded-lg
- **Content**: Bottle emoji (🧴, text-lg)
- **Layout**: Flex, items-center, justify-center
- **Flex**: flex-shrink-0

###### Product Content
- **Layout**: flex-1, min-w-0 (text truncation)

###### Header
- **Layout**: Flex, items-start, justify-between, margin-bottom 2

###### Left Side
- **Product Name**: 
  - Font weight: Semibold
  - Text size: sm (14px)
  - Text color: gray-900
  - Min-width: 0 (text truncation)

- **Brand**: 
  - Text size: xs (12px)
  - Text color: gray-600

- **Alternative Label** (if in comparison and is alternative):
  - Text size: xs (12px)
  - Text color: purple-600
  - Font weight: Semibold
  - Margin top: 1 (4px)
  - Visibility: Only in single view, not comparison

###### Right Side
- **Price**: 
  - Font weight: Bold
  - Text size: base (16px)
  - Text color: purple-600
  - Margin left: 2 (8px)
  - Whitespace: nowrap
  - Format: "${price.toFixed(2)}"
  - Visibility: Only if price is valid number > 0

###### Description
- **Text**: product.description
- **Text size**: xs (12px)
- **Text color**: gray-700
- **Margin top**: 1 (4px)
- **Line clamp**: 2 lines
- **Visibility**: Only if description exists

###### Reasoning Section (Conditional)

###### Container
- **Visibility**: Only if `shouldShowReasoning` is true
- **Margin top**: 3 (12px)
- **Padding**: 3 (12px)
- **Background**: blue-50
- **Border Radius**: rounded-lg
- **Border**: 1px solid, blue-200
- **Animation**: Fade-in and height animation (motion.div)

###### Title
- **Text**: "Why we chose this:"
- **Text size**: xs (12px)
- **Font weight**: Semibold
- **Text color**: blue-900
- **Margin bottom**: 2 (8px)
- **Layout**: Flex, items-center, gap-1.5
- **Icon**: Info (w-3.5 h-3.5)

###### Reasons List
- **Layout**: Vertical stack (space-y-1.5)

###### Reason Item
- **Text size**: xs (12px)
- **Text color**: blue-800
- **Layout**: Flex, items-start, gap-2
- **Bullet**: blue-500, margin-top 0.5, flex-shrink-0
- **Text**: flex-1, leading-relaxed

###### Reason Count
- **Quick View**: Shows top 3 reasons
- **Detailed View**: Shows up to 5 reasons
- **More Indicator**: 
  - Text: "+ X more reason(s)"
  - Text size: xs (12px)
  - Text color: blue-600
  - Font style: Italic
  - Margin top: 1 (4px)
  - Padding left: 5 (20px)
  - Visibility: Only if more reasons exist

###### Actions
- **Layout**: Flex, items-center, gap-2, margin-top 3, flex-wrap

###### Cart Quantity Badge (if in cart)
- **Background**: purple-100
- **Text**: purple-700
- **Padding**: 2 (8px) horizontal, 1 (4px) vertical
- **Border Radius**: rounded-full
- **Text size**: xs (12px)
- **Font weight**: Semibold
- **Layout**: Flex, items-center, gap-1
- **Icon**: ShoppingCart (w-3 h-3)
- **Content**: Quantity number

###### Add to Cart Button
- **Gradient**: from-pink-500 to-purple-600
- **Text**: White
- **Padding**: 3 (12px) horizontal, 1.5 (6px) vertical
- **Border Radius**: rounded-lg
- **Text size**: xs (12px)
- **Font weight**: Semibold
- **Shadow**: shadow-lg on hover
- **Transition**: All properties
- **Layout**: Flex, items-center, gap-1
- **Icon**: ShoppingCart (w-3 h-3)

###### States
- **Default**: "Add to Cart"
- **In Cart**: "Add More"
- **Disabled**: "Coming Soon" (if no Shopify ID)
  - Opacity: 50%
  - Cursor: not-allowed

##### Comparison View (When "Compare" Clicked)

###### Container
- **Layout**: Vertical stack (space-y-3)

###### Divider Text
- **Text**: "Compare both options side-by-side"
- **Text size**: xs (12px)
- **Text align**: Center
- **Text color**: gray-500
- **Font weight**: Medium
- **Margin bottom**: 2 (8px)

###### Comparison Grid
- **Layout**: Grid, 1 column on mobile, 2 columns on desktop (md:grid-cols-2)
- **Gap**: 4 (16px)

###### Primary Product Column
- **Container**: 
  - Border: 2px solid, purple-200
  - Border Radius: rounded-lg
  - Background: white
  - Overflow: hidden

- **Header**: 
  - Text: "⭐ Primary Recommendation"
  - Text size: xs (12px)
  - Font weight: Semibold
  - Text color: purple-700
  - Background: purple-50
  - Padding: 3 (12px) horizontal, 2 (8px) vertical
  - Border bottom: 1px solid, purple-200

- **Product Card**: 
  - Padding: 2 (8px)
  - Background: transparent
  - ProductCard component inside

###### Alternative Product Column
- **Container**: 
  - Border: 2px solid, blue-200
  - Border Radius: rounded-lg
  - Background: white
  - Overflow: hidden

- **Header**: 
  - Text: "🔄 Alternative Option"
  - Text size: xs (12px)
  - Font weight: Semibold
  - Text color: blue-700
  - Background: blue-50
  - Padding: 3 (12px) horizontal, 2 (8px) vertical
  - Border bottom: 1px solid, blue-200

- **Product Card**: 
  - Padding: 2 (8px)
  - Background: transparent
  - ProductCard component inside

---

## 7. Add Complete Routine Button

### Layout
- **Width**: Full width
- **Margin Bottom**: 8 (32px)
- **Animation**: Fade-in with 0.45s delay

### Button
- **Gradient**: from-pink-500 via-purple-600 to-indigo-600
- **Text**: White
- **Font weight**: Bold
- **Padding**: 6 (24px) horizontal, 4 (16px) vertical
- **Border Radius**: rounded-xl
- **Shadow**: shadow-lg, hover: shadow-xl
- **Transition**: All properties
- **Layout**: Flex, items-center, justify-center, gap-3

### Elements
- **Icon**: Package (w-5 h-5)
- **Text**: "Add My Complete Routine to Cart"
- **Subtext**: "(Morning + Evening)"
  - Text size: sm (14px)
  - Opacity: 90%

---

## 8. Morning Routine Section

### Layout
- **Background**: Gradient (from-yellow-50 to-orange-50)
- **Border Radius**: rounded-2xl
- **Shadow**: shadow-lg
- **Padding**: 8 (32px)
- **Margin Bottom**: 8 (32px)
- **Animation**: Fade-in with 0.5s delay

### Elements

#### Title
- **Icon**: Sun (Lucide, w-8 h-8, orange-500)
- **Text**: "Morning Routine (5-10 minutes)"
- **Style**: text-2xl, bold, gray-900
- **Layout**: Flex with icon (margin-right 3)
- **Margin Bottom**: 6 (24px)

#### Steps List
- **Layout**: Vertical stack (space-y-4)
- **Empty State**: "No morning routine available." (gray-500, italic, centered, padding-y 4)

#### Step Card

##### Container
- **Background**: white
- **Border Radius**: rounded-xl
- **Padding**: 5 (20px)
- **Shadow**: shadow-sm

##### Layout
- **Flex**: items-start, gap-4

##### Step Number
- **Size**: 10x10 (40px)
- **Shape**: Circle (rounded-full)
- **Background**: Gradient (from-yellow-400 to-orange-500)
- **Text**: White, bold
- **Layout**: Flex, items-center, justify-center
- **Flex**: flex-shrink-0
- **Content**: Step number (1, 2, 3, etc.)

##### Step Content
- **Layout**: flex-1

###### Category
- **Text**: Uppercase, bold, text-sm, gray-900, tracking-wide
- **Margin Bottom**: 1 (4px)

###### Product Name
- **Text**: Semibold, gray-700
- **Margin Bottom**: 2 (8px)

###### Instruction
- **Text**: text-sm, gray-600
- **Margin Bottom**: 2 (8px)

###### Important Note (if applicable)
- **Layout**: Flex, items-center, gap-2
- **Text**: text-sm, orange-600, semibold
- **Icon**: AlertCircle (w-4 h-4)
- **Content**: "Never skip this step!"

---

## 9. Evening Routine Section

### Layout
- **Background**: Gradient (from-indigo-50 to-purple-50)
- **Border Radius**: rounded-2xl
- **Shadow**: shadow-lg
- **Padding**: 8 (32px)
- **Margin Bottom**: 8 (32px)
- **Animation**: Fade-in with 0.6s delay

### Elements

#### Title
- **Icon**: Moon (Lucide, w-8 h-8, indigo-600)
- **Text**: "Evening Routine (10-15 minutes)"
- **Style**: text-2xl, bold, gray-900
- **Layout**: Flex with icon (margin-right 3)
- **Margin Bottom**: 6 (24px)

#### Steps List
- **Layout**: Vertical stack (space-y-4)
- **Empty State**: "No evening routine available." (gray-500, italic, centered, padding-y 4)

#### Step Card

##### Container
- **Background**: white
- **Border Radius**: rounded-xl
- **Padding**: 5 (20px)
- **Shadow**: shadow-sm

##### Layout
- **Flex**: items-start, gap-4

##### Step Number
- **Size**: 10x10 (40px)
- **Shape**: Circle (rounded-full)
- **Background**: Gradient (from-indigo-500 to-purple-600)
- **Text**: White, bold
- **Layout**: Flex, items-center, justify-center
- **Flex**: flex-shrink-0
- **Content**: Step number (1, 2, 3, etc.)

##### Step Content
- **Layout**: flex-1

###### Header
- **Layout**: Flex, items-center, justify-between, margin-bottom 1

###### Category
- **Text**: Uppercase, bold, text-sm, gray-900, tracking-wide

###### Frequency Badge (if not daily)
- **Background**: purple-100
- **Text**: purple-700
- **Padding**: 2 (8px) horizontal, 1 (4px) vertical
- **Border Radius**: rounded-full
- **Text size**: xs (12px)
- **Font weight**: Semibold
- **Content**: Frequency (e.g., "2-3x/week")

###### Product Name
- **Text**: Semibold, gray-700
- **Margin Bottom**: 2 (8px)

###### Instruction
- **Text**: text-sm, gray-600
- **Margin Bottom**: 2 (8px)

###### Important Note (if applicable)
- **Layout**: Flex, items-center, gap-2
- **Text**: text-sm, purple-600, semibold
- **Icon**: AlertCircle (w-4 h-4)
- **Content**: "Start slowly and build tolerance"

---

## 10. Personalized Tips Section (Conditional)

### Visibility
- Only displays if `tips` array has items

### Layout
- **Background**: White
- **Border Radius**: rounded-2xl
- **Shadow**: shadow-lg
- **Padding**: 8 (32px)
- **Margin Bottom**: 8 (32px)
- **Animation**: Fade-in with 0.7s delay

### Elements

#### Title
- **Icon**: 💡 (Lightbulb emoji)
- **Text**: "Personalized Tips"
- **Style**: text-2xl, bold, gray-900
- **Layout**: Flex with icon (text-3xl, margin-right 3)
- **Margin Bottom**: 6 (24px)

#### Tips List
- **Layout**: Vertical stack (space-y-3)

#### Tip Item
- **Layout**: Flex, items-start, gap-3
- **Bullet**: purple-500, margin-top 1
- **Text**: gray-700

---

## 11. Success Notification (Floating)

### Layout
- **Position**: Fixed
- **Top**: 4 (16px)
- **Right**: 4 (16px)
- **Z-index**: 50
- **Animation**: Slide-in from top, auto-dismiss

### Notification
- **Background**: green-500
- **Text**: White
- **Padding**: 6 (24px) horizontal, 3 (12px) vertical
- **Border Radius**: rounded-lg
- **Shadow**: shadow-lg
- **Layout**: Flex, items-center, gap-2

### Elements
- **Icon**: CheckCircle (w-5 h-5)
- **Text**: "Added '{productName}' to cart!"

---

## Design System

### Color Palette
- **Primary Gradient**: pink-500 → purple-600
- **Secondary Gradient**: purple-600 → pink-600
- **Tertiary Gradient**: pink-500 → purple-600 → indigo-600
- **Info**: blue-50, blue-200, blue-600, blue-700, blue-800, blue-900
- **Success**: green-50, green-200, green-500, green-600, green-700
- **Warning**: orange-400, orange-500, orange-600
- **Purple**: purple-50, purple-100, purple-200, purple-300, purple-500, purple-600, purple-700
- **Gray**: gray-50, gray-100, gray-200, gray-300, gray-400, gray-500, gray-600, gray-700, gray-800, gray-900
- **Yellow/Orange**: yellow-50, yellow-400, orange-50, orange-500
- **Indigo/Purple**: indigo-50, indigo-500, indigo-600, purple-50, purple-600

### Typography
- **Headings**: 
  - H1: text-4xl, bold
  - H2: text-2xl, bold
  - H3: text-xl, bold
  - H4: text-lg, bold
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
  - Extra Large: 8 (32px)
- **Margin**: 
  - Small: 2 (8px)
  - Medium: 4 (16px)
  - Large: 6 (24px)
  - Extra Large: 8 (32px), 12 (48px)
- **Gaps**: 
  - Small: 1 (4px), 2 (8px)
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
  - Thick: 4px (left border on concerns)
- **Shadows**: 
  - Small: shadow-sm
  - Medium: shadow-lg
  - Large: shadow-xl
  - Hover: Increased shadow

### Animations
- **Page Load**: Fade-in (opacity 0 → 1)
- **Section Entrance**: Staggered delays (0.2s increments)
- **Reasoning Expand/Collapse**: Height + opacity animation
- **Success Notification**: Slide-in from top
- **Transitions**: All properties, smooth (0.2s - 0.3s)

### Responsive Design
- **Mobile**: 
  - Single column layouts
  - Full width containers
  - Reduced padding
  - Stacked elements
- **Desktop**: 
  - Max-width containers (4xl)
  - 2-column grids where applicable
  - Side-by-side comparisons
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

---

## User Interactions

### View Mode Toggle
- **Quick View → Detailed View**: 
  - All reasoning expands automatically
  - "Why?" buttons change to "Hide Details"
  - More reasons shown per product
- **Detailed View → Quick View**: 
  - All reasoning collapses
  - "Hide Details" buttons change to "Why?"
  - User can expand individual items

### Product Comparison
- **Click "Compare"**: 
  - Shows side-by-side view
  - Primary and alternative products displayed
  - Both products have individual "Add to Cart" buttons
- **Click "Hide Comparison"**: 
  - Returns to single product view
  - Shows primary product only

### Reasoning Display
- **Click "Why?" (Quick View)**: 
  - Expands reasoning for that category
  - Shows top 3 reasons
  - Button changes to "Hide Details"
- **Click "Hide Details" (Detailed View)**: 
  - Collapses reasoning for that category
  - Button changes to "Why?"

### Add to Cart
- **Click "Add to Cart"**: 
  - Product added to cart
  - Success notification appears
  - Button changes to "Add More" if already in cart
  - Cart quantity badge appears

### Phase Actions
- **Click "Add Core Routine to Cart"**: 
  - All Phase 1 products added to cart
  - Success message with total price
- **Click "Add All"**: 
  - All recommended products added to cart
  - Success notification

### Save Report
- **Enter email/phone**: 
  - Input field with validation
  - Submit button enables
- **Click "Save Report"**: 
  - Loading state (spinner)
  - Success message appears
  - Form hides, success message shows

---

This document provides complete UI specifications for the Report Viewer Page. Use this for design mockups, wireframes, and implementation reference.

