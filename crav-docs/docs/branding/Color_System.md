# CR AUDIOVIZ AI - OFFICIAL COLOR SYSTEM
**Version:** 3.0 FINAL  
**Effective:** January 11, 2026  
**Based On:** craudiovizailogo.png (official brand mark)  
**Status:** LOCKED - All applications must use these colors

---

## OFFICIAL BRAND COLORS

Extracted directly from the CR AudioViz AI logo. These are the ONLY authorized brand colors for the entire ecosystem.

### Primary Color - Navy Blue

```css
/* Main Brand Color - From logo circle background */
--cr-navy: #1E3A5F;
--cr-navy-50: #F0F3F7;
--cr-navy-100: #D9E1EB;
--cr-navy-200: #B3C3D7;
--cr-navy-300: #8CA5C3;
--cr-navy-400: #6687AF;
--cr-navy-500: #3F699B;
--cr-navy-600: #1E3A5F;   /* PRIMARY - Logo color */
--cr-navy-700: #172D48;
--cr-navy-800: #0F1F32;
--cr-navy-900: #08121B;
--cr-navy-950: #040912;
```

**Usage:**
- Primary buttons
- Main navigation
- Headers & titles
- Logo backgrounds
- Dark mode primary

### Accent Color - Red

```css
/* Accent Color - From logo play button & tagline */
--cr-red: #E31937;
--cr-red-50: #FEF2F3;
--cr-red-100: #FDE6E9;
--cr-red-200: #FBCCD3;
--cr-red-300: #F8B3BD;
--cr-red-400: #F67F95;
--cr-red-500: #F44668;
--cr-red-600: #E31937;   /* ACCENT - Logo color */
--cr-red-700: #B6142C;
--cr-red-800: #8A0F21;
--cr-red-900: #5D0A16;
--cr-red-950: #30050B;
```

**Usage:**
- Call-to-action buttons
- Important highlights
- Error states
- Active states
- Links (hover)

### Secondary Color - Cyan

```css
/* Secondary Color - From logo vertical bars */
--cr-cyan: #00B4D8;
--cr-cyan-50: #E6F7FB;
--cr-cyan-100: #CCEFF7;
--cr-cyan-200: #99DFEF;
--cr-cyan-300: #66CFE7;
--cr-cyan-400: #33BFDF;
--cr-cyan-500: #00B4D8;   /* SECONDARY - Logo color */
--cr-cyan-600: #0090AD;
--cr-cyan-700: #006C82;
--cr-cyan-800: #004856;
--cr-cyan-900: #00242B;
--cr-cyan-950: #001216;
```

**Usage:**
- Secondary buttons
- Info states
- Links (default)
- Icons
- Accents

---

## SEMANTIC COLORS

Built on the brand foundation for consistency.

### Success - Derived from Cyan

```css
--cr-success: #00B4D8;      /* Use cyan for success */
--cr-success-bg: #E6F7FB;
--cr-success-border: #99DFEF;
```

### Warning - Amber (Neutral)

```css
--cr-warning: #F59E0B;
--cr-warning-bg: #FEF3C7;
--cr-warning-border: #FDE68A;
```

### Error - Use Brand Red

```css
--cr-error: #E31937;         /* Use brand red */
--cr-error-bg: #FEF2F3;
--cr-error-border: #FBCCD3;
```

### Info - Use Brand Cyan

```css
--cr-info: #00B4D8;          /* Use brand cyan */
--cr-info-bg: #E6F7FB;
--cr-info-border: #99DFEF;
```

---

## NEUTRAL PALETTE

For backgrounds, borders, and text.

```css
/* Grayscale */
--cr-white: #FFFFFF;
--cr-gray-50: #F9FAFB;
--cr-gray-100: #F3F4F6;
--cr-gray-200: #E5E7EB;
--cr-gray-300: #D1D5DB;
--cr-gray-400: #9CA3AF;
--cr-gray-500: #6B7280;
--cr-gray-600: #4B5563;
--cr-gray-700: #374151;
--cr-gray-800: #1F2937;
--cr-gray-900: #111827;
--cr-black: #000000;
```

---

## TEXT COLORS

```css
/* Light Mode */
--cr-text-primary: var(--cr-navy-700);      /* #172D48 */
--cr-text-secondary: var(--cr-gray-600);    /* #4B5563 */
--cr-text-tertiary: var(--cr-gray-500);     /* #6B7280 */
--cr-text-disabled: var(--cr-gray-400);     /* #9CA3AF */

/* Dark Mode */
--cr-text-primary-dark: var(--cr-gray-50);  /* #F9FAFB */
--cr-text-secondary-dark: var(--cr-gray-300); /* #D1D5DB */
--cr-text-tertiary-dark: var(--cr-gray-400);  /* #9CA3AF */
--cr-text-disabled-dark: var(--cr-gray-600);  /* #4B5563 */
```

---

## BACKGROUND COLORS

```css
/* Light Mode */
--cr-bg-primary: var(--cr-white);
--cr-bg-secondary: var(--cr-gray-50);
--cr-bg-tertiary: var(--cr-gray-100);
--cr-bg-elevated: var(--cr-white);

/* Dark Mode */
--cr-bg-primary-dark: var(--cr-navy-900);      /* #08121B */
--cr-bg-secondary-dark: var(--cr-navy-800);    /* #0F1F32 */
--cr-bg-tertiary-dark: var(--cr-navy-700);     /* #172D48 */
--cr-bg-elevated-dark: var(--cr-navy-800);     /* #0F1F32 */
```

---

## BORDER COLORS

```css
/* Light Mode */
--cr-border: var(--cr-gray-200);
--cr-border-hover: var(--cr-gray-300);
--cr-border-focus: var(--cr-navy-600);

/* Dark Mode */
--cr-border-dark: var(--cr-navy-700);
--cr-border-hover-dark: var(--cr-navy-600);
--cr-border-focus-dark: var(--cr-cyan-500);
```

---

## GRADIENTS

```css
/* Primary Gradient - Navy to Cyan */
--cr-gradient-primary: linear-gradient(135deg, #1E3A5F 0%, #00B4D8 100%);

/* Accent Gradient - Navy to Red */
--cr-gradient-accent: linear-gradient(135deg, #1E3A5F 0%, #E31937 100%);

/* Hero Gradient - Full spectrum */
--cr-gradient-hero: linear-gradient(135deg, #1E3A5F 0%, #00B4D8 50%, #E31937 100%);

/* Subtle Background */
--cr-gradient-bg: linear-gradient(180deg, #F9FAFB 0%, #FFFFFF 100%);
```

---

## COMPONENT STYLES

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--cr-navy-600);
  color: white;
  border: 2px solid var(--cr-navy-600);
}
.btn-primary:hover {
  background: var(--cr-navy-700);
  border-color: var(--cr-navy-700);
}

/* Accent Button (CTA) */
.btn-accent {
  background: var(--cr-red-600);
  color: white;
  border: 2px solid var(--cr-red-600);
}
.btn-accent:hover {
  background: var(--cr-red-700);
  border-color: var(--cr-red-700);
}

/* Secondary Button */
.btn-secondary {
  background: var(--cr-cyan-500);
  color: white;
  border: 2px solid var(--cr-cyan-500);
}
.btn-secondary:hover {
  background: var(--cr-cyan-600);
  border-color: var(--cr-cyan-600);
}

/* Outline Button */
.btn-outline {
  background: transparent;
  color: var(--cr-navy-600);
  border: 2px solid var(--cr-navy-600);
}
.btn-outline:hover {
  background: var(--cr-navy-600);
  color: white;
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--cr-navy-600);
  border: 2px solid transparent;
}
.btn-ghost:hover {
  background: var(--cr-gray-100);
  border-color: var(--cr-gray-200);
}
```

### Links

```css
a {
  color: var(--cr-cyan-500);
  text-decoration: none;
}
a:hover {
  color: var(--cr-red-600);
  text-decoration: underline;
}
```

### Cards

```css
.card {
  background: var(--cr-white);
  border: 1px solid var(--cr-gray-200);
  border-radius: 12px;
}
.card:hover {
  border-color: var(--cr-cyan-500);
  box-shadow: 0 4px 12px rgba(30, 58, 95, 0.1);
}
```

### Inputs

```css
input, select, textarea {
  border: 2px solid var(--cr-gray-300);
  background: var(--cr-white);
  color: var(--cr-navy-700);
}
input:focus, select:focus, textarea:focus {
  border-color: var(--cr-cyan-500);
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 180, 216, 0.1);
}
```

---

## TAILWIND CONFIG

Complete tailwind configuration for all applications:

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        navy: {
          50: '#F0F3F7',
          100: '#D9E1EB',
          200: '#B3C3D7',
          300: '#8CA5C3',
          400: '#6687AF',
          500: '#3F699B',
          600: '#1E3A5F',  // PRIMARY
          700: '#172D48',
          800: '#0F1F32',
          900: '#08121B',
          950: '#040912',
        },
        brand: {
          red: '#E31937',
          cyan: '#00B4D8',
          navy: '#1E3A5F',
        },
        red: {
          50: '#FEF2F3',
          100: '#FDE6E9',
          200: '#FBCCD3',
          300: '#F8B3BD',
          400: '#F67F95',
          500: '#F44668',
          600: '#E31937',  // ACCENT
          700: '#B6142C',
          800: '#8A0F21',
          900: '#5D0A16',
          950: '#30050B',
        },
        cyan: {
          50: '#E6F7FB',
          100: '#CCEFF7',
          200: '#99DFEF',
          300: '#66CFE7',
          400: '#33BFDF',
          500: '#00B4D8',  // SECONDARY
          600: '#0090AD',
          700: '#006C82',
          800: '#004856',
          900: '#00242B',
          950: '#001216',
        },
      },
    },
  },
  plugins: [],
}

export default config
```

---

## GLOBALS.CSS

Standard CSS variables for all applications:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Brand Colors */
  --cr-navy: #1E3A5F;
  --cr-red: #E31937;
  --cr-cyan: #00B4D8;
  
  /* Semantic */
  --cr-success: var(--cr-cyan);
  --cr-warning: #F59E0B;
  --cr-error: var(--cr-red);
  --cr-info: var(--cr-cyan);
  
  /* Text */
  --cr-text-primary: #172D48;
  --cr-text-secondary: #4B5563;
  --cr-text-tertiary: #6B7280;
  
  /* Backgrounds */
  --cr-bg-primary: #FFFFFF;
  --cr-bg-secondary: #F9FAFB;
  --cr-bg-tertiary: #F3F4F6;
  
  /* Borders */
  --cr-border: #E5E7EB;
  --cr-border-hover: #D1D5DB;
  
  /* Gradients */
  --cr-gradient-primary: linear-gradient(135deg, #1E3A5F 0%, #00B4D8 100%);
  --cr-gradient-accent: linear-gradient(135deg, #1E3A5F 0%, #E31937 100%);
}

.dark {
  --cr-text-primary: #F9FAFB;
  --cr-text-secondary: #D1D5DB;
  --cr-text-tertiary: #9CA3AF;
  
  --cr-bg-primary: #08121B;
  --cr-bg-secondary: #0F1F32;
  --cr-bg-tertiary: #172D48;
  
  --cr-border: #172D48;
  --cr-border-hover: #1E3A5F;
}
```

---

## MIGRATION CHECKLIST

For each application, update these files:

### Required Updates
- [ ] `tailwind.config.ts` - Use official color palette
- [ ] `app/globals.css` - Use official CSS variables
- [ ] All `className` props - Update to new color classes
- [ ] Logo files - Ensure using official logos
- [ ] OG images - Update with brand colors
- [ ] Favicon - Update with navy/red/cyan

### Files to Update
```
📄 tailwind.config.ts
📄 app/globals.css
📄 components/ui/* (all UI components)
📄 app/page.tsx
📄 app/layout.tsx
📄 public/og-image.png
📄 public/favicon.ico
```

---

## ENFORCEMENT

### Automated Checks
Run this command in each repo to find non-compliant colors:

```bash
# Find hardcoded colors that don't match brand
grep -r "#[0-9A-Fa-f]\{6\}" . \
  --include="*.tsx" --include="*.ts" --include="*.css" \
  | grep -v "1E3A5F\|E31937\|00B4D8"
```

### Manual Review
Before deploying:
1. Check all buttons use navy/red/cyan
2. Verify gradients use brand colors
3. Ensure logos are official versions
4. Test dark mode uses navy-based palette

---

## DO NOT USE

**Forbidden Colors:**
- ❌ `#6366F1` (Old indigo)
- ❌ `#8B5CF6` (Old violet)
- ❌ `#EC4899` (Old pink)
- ❌ `#2563EB` (Old blue)
- ❌ `#16A34A` (Old green)
- ❌ `#7C3AED` (Old purple)

**Exception:** Neutral grays are allowed.

---

## QUESTIONS?

**Contact:** Roy Henderson (royhenderson@craudiovizai.com)  
**Last Updated:** January 11, 2026  
**Version:** 3.0 FINAL - LOCKED
