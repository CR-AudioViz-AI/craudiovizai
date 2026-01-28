# JAVARI BRAND STANDARDS 2026
**Effective:** January 11, 2026  
**Version:** 2.0  
**Status:** Official Brand Guidelines

---

## BRAND MIGRATION COMPLETE ✅

**All 11 "Crav" branded applications have been renamed to "Javari" branding:**

### Completed Rebranding

| Old Name | New Name | Status |
|----------|----------|--------|
| crav-social-graphics | javari-graphics | ✅ Renamed |
| crav-travel | javari-travel | ✅ Renamed |
| crav-property-hub | javari-property | ✅ Renamed |
| crav-movie-audio | javari-movie-audio | ✅ Renamed |
| crav-analytics-dashboard | javari-analytics | ✅ Renamed |
| crav-game-studio | javari-game-studio | ✅ Renamed |
| crav-model-arena | javari-model-arena | ✅ Renamed |
| cravbarrels | javari-spirits | ✅ Renamed |
| crav-competitive-intelligence | javari-intelligence | ✅ Renamed |
| crav-ops-center | javari-ops | ✅ Renamed |
| crav-components | javari-components | ✅ Renamed |

### Domain Configuration

**All rebranded apps now have proper domains:**

- ✅ travel.craudiovizai.com
- ✅ property.craudiovizai.com
- ✅ movie-audio.craudiovizai.com
- ✅ analytics.craudiovizai.com
- ✅ game-studio.craudiovizai.com
- ✅ model-arena.craudiovizai.com
- ✅ spirits.craudiovizai.com
- ✅ intelligence.craudiovizai.com
- ✅ ops.craudiovizai.com
- ✅ components.craudiovizai.com

---

## BRAND ARCHITECTURE

### Primary Brand: CR AudioViz AI
**Tagline:** "Your Story. Our Design"  
**Legal Entity:** CR AudioViz AI, LLC  
**EIN:** 39-3646201

### Sub-Brands

1. **Javari AI** - AI assistant platform
2. **Javari** - Application family brand
3. **CRAIverse** - Virtual world (future)

---

## NAMING CONVENTIONS

### Standard Format
`javari-[category/function]`

**Examples:**
- javari-ebook
- javari-resume-builder
- javari-first-responders
- javari-spirits

### Domain Structure
`[category].craudiovizai.com`

**Examples:**
- ebook.craudiovizai.com
- resume.craudiovizai.com
- spirits.craudiovizai.com

---

## BRAND COLORS

**Based on CR AudioViz AI Logo**

### Primary Palette

```css
/* Primary - Navy Blue (from logo circle) */
--javari-navy: #1E3A5F;           /* Dark Navy - Main brand color */
--javari-navy-dark: #152B47;      /* Darker navy */
--javari-navy-light: #2E4A6F;     /* Lighter navy */

/* Accent - Red (from logo play button & tagline) */
--javari-red: #E31937;            /* Brand Red - Energy & creativity */
--javari-red-dark: #C5162E;       /* Darker red */
--javari-red-light: #FF2D4A;      /* Lighter red */

/* Secondary - Cyan (from logo bars) */
--javari-cyan: #00B4D8;           /* Cyan - Innovation & media */
--javari-cyan-dark: #0096B8;      /* Darker cyan */
--javari-cyan-light: #0FA4C8;     /* Lighter cyan */
```

**Alternative for modern web (current site uses):**
```css
/* If navy feels too dark for web, use these: */
--javari-blue: #2563EB;           /* Blue 600 - More vibrant */
--javari-green: #16A34A;          /* Green 600 - Success */
--javari-purple: #7C3AED;         /* Violet 600 - Premium */
```

---

### ⚠️ IMPORTANT: Logo vs Website Color Discrepancy

**Current Situation:**
- **Logo colors:** Navy Blue (#1E3A5F), Red (#E31937), Cyan (#00B4D8)
- **Website colors:** Blue (#2563EB), Green (#16A34A), Purple (#7C3AED)

**Recommendation:**
Choose ONE consistent palette across all applications:

**Option A - Logo-First** (Professional, Corporate)
- Use: Navy, Red, Cyan from logo
- Best for: Corporate apps, B2B tools, professional services
- Vibe: Established, trustworthy, media/audio brand

**Option B - Website-First** (Modern, Tech)
- Use: Blue, Green, Purple from current site
- Best for: Consumer apps, creative tools, modern SaaS
- Vibe: Innovative, friendly, tech-forward

**Option C - Hybrid** (Recommended)
- Primary: Navy from logo (#1E3A5F) 
- Accent: Red from logo (#E31937)
- Vibrant: Blue from site (#2563EB) for CTAs
- Success: Green from site (#16A34A)

**Action Required:** Decision needed on unified color palette to ensure brand consistency across all 50+ applications.

### Neutral Palette

```css
/* Backgrounds */
--javari-bg-primary: #FFFFFF;     /* White */
--javari-bg-secondary: #F9FAFB;   /* Gray 50 */
--javari-bg-tertiary: #F3F4F6;    /* Gray 100 */

/* Dark Mode */
--javari-bg-dark: #111827;        /* Gray 900 */
--javari-bg-dark-secondary: #1F2937; /* Gray 800 */

/* Text */
--javari-text-primary: #111827;   /* Gray 900 */
--javari-text-secondary: #6B7280; /* Gray 500 */
--javari-text-tertiary: #9CA3AF;  /* Gray 400 */
```

### Semantic Colors

```css
/* Success */
--javari-success: #10B981;        /* Green 500 */
--javari-success-bg: #D1FAE5;     /* Green 100 */

/* Warning */
--javari-warning: #F59E0B;        /* Amber 500 */
--javari-warning-bg: #FEF3C7;     /* Amber 100 */

/* Error */
--javari-error: #EF4444;          /* Red 500 */
--javari-error-bg: #FEE2E2;       /* Red 100 */

/* Info */
--javari-info: #3B82F6;           /* Blue 500 */
--javari-info-bg: #DBEAFE;        /* Blue 100 */
```

---

## TYPOGRAPHY

### Font Families

```css
/* Primary (UI) */
--javari-font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Secondary (Display) */
--javari-font-display: 'Cal Sans', 'Inter', sans-serif;

/* Monospace (Code) */
--javari-font-mono: 'Fira Code', 'Consolas', monospace;
```

### Font Sizes

```css
/* Headings */
--javari-text-5xl: 3rem;      /* 48px */
--javari-text-4xl: 2.25rem;   /* 36px */
--javari-text-3xl: 1.875rem;  /* 30px */
--javari-text-2xl: 1.5rem;    /* 24px */
--javari-text-xl: 1.25rem;    /* 20px */

/* Body */
--javari-text-lg: 1.125rem;   /* 18px */
--javari-text-base: 1rem;     /* 16px */
--javari-text-sm: 0.875rem;   /* 14px */
--javari-text-xs: 0.75rem;    /* 12px */
```

---

## LOGO USAGE

### Logo Files
- **Primary:** `javariailogo.png` (Javari AI)
- **Secondary:** `craudiovizailogo.png` (CR AudioViz AI)

### Clear Space
Minimum clear space = height of logo "J" letter

### Minimum Size
- Digital: 32px height
- Print: 0.5 inches height

### Placement
- Top-left corner of applications
- Center for splash screens
- Always link to homepage

---

## UI COMPONENTS

### Buttons

```tsx
/* Primary Button */
className="bg-javari-primary hover:bg-javari-primary-dark text-white 
           rounded-lg px-6 py-3 font-medium transition-colors"

/* Secondary Button */
className="bg-white hover:bg-javari-bg-secondary text-javari-primary 
           border border-javari-primary rounded-lg px-6 py-3 
           font-medium transition-colors"

/* Ghost Button */
className="bg-transparent hover:bg-javari-bg-secondary text-javari-primary 
           rounded-lg px-6 py-3 font-medium transition-colors"
```

### Cards

```tsx
/* Standard Card */
className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"

/* Elevated Card */
className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"

/* Interactive Card */
className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 
           hover:shadow-md hover:border-javari-primary/30 
           transition-all cursor-pointer"
```

### Inputs

```tsx
/* Text Input */
className="w-full px-4 py-3 border border-gray-300 rounded-lg 
           focus:ring-2 focus:ring-javari-primary focus:border-transparent 
           outline-none transition-all"

/* Select */
className="w-full px-4 py-3 border border-gray-300 rounded-lg 
           bg-white focus:ring-2 focus:ring-javari-primary 
           focus:border-transparent outline-none"
```

---

## SPACING SYSTEM

```css
/* Base unit: 4px */
--javari-space-1: 0.25rem;   /* 4px */
--javari-space-2: 0.5rem;    /* 8px */
--javari-space-3: 0.75rem;   /* 12px */
--javari-space-4: 1rem;      /* 16px */
--javari-space-6: 1.5rem;    /* 24px */
--javari-space-8: 2rem;      /* 32px */
--javari-space-12: 3rem;     /* 48px */
--javari-space-16: 4rem;     /* 64px */
--javari-space-24: 6rem;     /* 96px */
```

---

## BORDER RADIUS

```css
--javari-radius-sm: 0.375rem;  /* 6px */
--javari-radius-md: 0.5rem;    /* 8px */
--javari-radius-lg: 0.75rem;   /* 12px */
--javari-radius-xl: 1rem;      /* 16px */
--javari-radius-2xl: 1.5rem;   /* 24px */
--javari-radius-full: 9999px;  /* Fully rounded */
```

---

## SHADOWS

```css
--javari-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--javari-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--javari-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--javari-shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```

---

## ANIMATION

### Transitions

```css
/* Fast - UI feedback */
--javari-transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);

/* Normal - Standard interactions */
--javari-transition-normal: 300ms cubic-bezier(0.4, 0, 0.2, 1);

/* Slow - Large movements */
--javari-transition-slow: 500ms cubic-bezier(0.4, 0, 0.2, 1);
```

### Usage

```css
/* Hover states */
transition: all var(--javari-transition-fast);

/* Modal/drawer animations */
transition: transform var(--javari-transition-normal);

/* Page transitions */
transition: opacity var(--javari-transition-slow);
```

---

## VOICE & TONE

### Brand Voice
- **Empowering**: Help users achieve their goals
- **Professional**: Business-grade quality
- **Accessible**: Clear, jargon-free language
- **Innovative**: Cutting-edge but not intimidating

### Tone Guidelines
- **Be direct** - Get to the point quickly
- **Be helpful** - Solve problems, don't create them
- **Be human** - Warm without being casual
- **Be confident** - We know what we're doing

### Writing Style
- Use active voice
- Short sentences (15-20 words max)
- One idea per paragraph
- Scannable content (bullets, headers)

---

## APPLICATION HEADERS

### Standard Header Structure

```tsx
<header className="border-b border-gray-200 bg-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
      {/* Logo */}
      <Link href="/">
        <Image src="/javariailogo.png" alt="Javari" />
      </Link>
      
      {/* Navigation */}
      <nav>
        {/* Primary nav items */}
      </nav>
      
      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Credits badge, auth buttons */}
      </div>
    </div>
  </div>
</header>
```

---

## FOOTER STRUCTURE

### Standard Footer

```tsx
<footer className="border-t border-gray-200 bg-javari-bg-secondary">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {/* Company */}
      {/* Products */}
      {/* Resources */}
      {/* Legal */}
    </div>
    
    <div className="mt-8 pt-8 border-t border-gray-200">
      <p className="text-center text-javari-text-secondary">
        © 2026 CR AudioViz AI, LLC. All rights reserved.
      </p>
    </div>
  </div>
</footer>
```

---

## PRICING PAGE STANDARDS

### Structure
1. Hero section with value proposition
2. Pricing tiers (Free, Basic, Pro, Enterprise)
3. Feature comparison table
4. FAQs
5. CTA section

### Tier Colors
- **Free**: Gray
- **Basic**: Blue
- **Pro**: Indigo (Primary)
- **Enterprise**: Purple (Secondary)

### Tier Structure
```tsx
{
  name: "Pro",
  price: "$29",
  description: "For professionals",
  features: [
    "10,000 credits/month",
    "All professional tools",
    "Priority support",
    "Advanced analytics"
  ],
  cta: "Start Free Trial",
  highlighted: true
}
```

---

## ERROR MESSAGES

### Format
```
[Icon] [Action Failed]
Clear explanation of what went wrong.
Actionable step to resolve.
```

### Examples

**Good:**
```
❌ Payment Failed
Your card was declined. Please update your payment method to continue.
[Update Payment Method]
```

**Bad:**
```
Error 402: Payment processing entity returned negative acknowledgment
```

---

## SUCCESS MESSAGES

### Format
```
[Icon] [Success Message]
What happened successfully.
Optional next step.
```

### Example
```
✅ Project Created
Your project "Website Redesign" is ready.
[View Project] or [Create Another]
```

---

## LOADING STATES

### Spinners
Use indigo primary color
Standard size: 24px
Large size: 48px

### Skeleton Screens
- Gray-200 background
- Gray-300 shimmer
- Pulse animation (2s duration)

### Progress Bars
- Primary color for fill
- Gray-200 for background
- Show percentage if known

---

## ACCESSIBILITY STANDARDS

### Color Contrast
- Text on white: minimum 4.5:1
- Large text: minimum 3:1
- Interactive elements: minimum 3:1

### Keyboard Navigation
- All interactive elements focusable
- Visible focus indicators
- Logical tab order

### Screen Readers
- Semantic HTML
- ARIA labels where needed
- Alt text for all images
- Meaningful link text

---

## RESPONSIVE BREAKPOINTS

```css
/* Mobile */
@media (min-width: 640px) { }   /* sm */

/* Tablet */
@media (min-width: 768px) { }   /* md */

/* Desktop */
@media (min-width: 1024px) { }  /* lg */

/* Wide */
@media (min-width: 1280px) { }  /* xl */

/* Ultra-wide */
@media (min-width: 1536px) { }  /* 2xl */
```

---

## BRAND ASSETS CHECKLIST

### Required Files
- [ ] javariailogo.png (primary)
- [ ] craudiovizailogo.png (company)
- [ ] favicon.ico (16x16, 32x32)
- [ ] apple-touch-icon.png (180x180)
- [ ] og-image.png (1200x630)
- [ ] twitter-image.png (1200x675)

### Logo Variations Needed
- [ ] Full color
- [ ] White (for dark backgrounds)
- [ ] Black (for light backgrounds)
- [ ] Icon only (square)

---

## IMPLEMENTATION CHECKLIST

### Per Application
- [ ] Brand colors in tailwind.config
- [ ] Logo in /public
- [ ] Standard header component
- [ ] Standard footer component
- [ ] Pricing page with correct tiers
- [ ] Error/success message components
- [ ] Loading state components
- [ ] Responsive design tested
- [ ] Accessibility audit passed
- [ ] OG image configured

---

## BRAND COMPLIANCE

### Required Elements
1. ✅ Javari branding (no "Crav")
2. ✅ Correct color palette
3. ✅ Standard typography
4. ✅ Proper logo usage
5. ✅ Consistent spacing
6. ✅ Accessibility standards
7. ✅ Responsive design
8. ✅ Loading/error states

### Audit Schedule
- **Monthly**: Automated brand checks
- **Quarterly**: Manual design review
- **Annually**: Complete brand refresh

---

## VERSION HISTORY

**Version 2.0** (January 11, 2026)
- Completed Crav → Javari migration (11 apps)
- Established comprehensive color palette
- Defined component standards
- Added accessibility guidelines

**Version 1.0** (December 2025)
- Initial brand standards
- Logo guidelines
- Basic color palette

---

**Maintained by:** Roy Henderson, CEO  
**Contact:** royhenderson@craudiovizai.com  
**Last Updated:** January 11, 2026
