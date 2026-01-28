# CR AudioViz AI - Master Brand Guide
## Official Design System & Logo Requirements

**Version:** 1.0  
**Effective Date:** January 9, 2026  
**Maintainer:** Cindy & Roy Henderson

---

## 1. Brand Identity

### 1.1 Company Overview
CR AudioViz AI is a multi-app SaaS platform powered by Javari AI, offering 50+ specialized applications for business, creativity, collecting, real estate, and lifestyle.

### 1.2 Brand Values
- **Innovation** - AI-powered tools that work smarter
- **Accessibility** - Mobile-first, easy to use
- **Trust** - Secure, reliable, professional
- **Community** - Apps for everyone

---

## 2. Color System

### 2.1 Primary Colors

| Name | Hex | RGB | Tailwind | Usage |
|------|-----|-----|----------|-------|
| **CR Cyan** | #0891B2 | 8, 145, 178 | cyan-600 | Primary brand color |
| **CR Cyan Light** | #22D3EE | 34, 211, 238 | cyan-400 | Highlights, gradients |
| **CR Cyan Dark** | #0E7490 | 14, 116, 144 | cyan-700 | Depth, pressed states |

### 2.2 Neutral Colors

| Name | Hex | RGB | Tailwind | Usage |
|------|-----|-----|----------|-------|
| **Slate Dark** | #1E293B | 30, 41, 59 | slate-800 | Headings, strong text |
| **Slate** | #475569 | 71, 85, 105 | slate-600 | Body text |
| **Slate Light** | #94A3B8 | 148, 163, 184 | slate-400 | Secondary text |
| **Gray** | #F3F4F6 | 243, 244, 246 | gray-100 | Backgrounds |
| **White** | #FFFFFF | 255, 255, 255 | white | Cards, content |

### 2.3 Accent Colors

| Name | Hex | RGB | Tailwind | Usage |
|------|-----|-----|----------|-------|
| **CR Red** | #DC2626 | 220, 38, 38 | red-600 | Errors ONLY |
| **CR Red** | #DC2626 | - | red-600 | "Cindy & Roy" branding |

### 2.4 Forbidden Colors
**DO NOT USE** these colors anywhere in the platform:
- Purple / Violet (#8B5CF6, etc.)
- Green / Emerald (#10B981, etc.)
- Yellow / Amber (#F59E0B, etc.)
- Orange (#F97316, etc.)
- Pink / Rose (#EC4899, etc.)
- Indigo (#6366F1, etc.)

---

## 3. Logo System

### 3.1 Master Logo Style

All CR AudioViz AI app logos must follow the **3D Gradient Style**:

```
┌─────────────────────────────────────────┐
│                                         │
│   ╭───────────────╮                     │
│   │  ┌─────────┐  │  ← Outer glow       │
│   │  │  ICON   │  │    (cyan-400/20%)   │
│   │  │         │  │                     │
│   │  └─────────┘  │  ← Inner shadow     │
│   ╰───────────────╯    (slate-800/30%)  │
│                                         │
│   Background: Linear gradient           │
│   Top: cyan-400                         │
│   Bottom: cyan-700                      │
│                                         │
└─────────────────────────────────────────┘
```

### 3.2 Logo Components

**Base Shape:**
- Rounded square (border-radius: 22% of size)
- Subtle drop shadow for 3D depth
- Linear gradient background (cyan-400 → cyan-700)

**Icon Layer:**
- White or slate-800 icon centered
- Icon should be 60% of logo size
- Simple, recognizable silhouette

**Glow Effect:**
- Outer glow: cyan-400 at 20% opacity
- Creates floating/elevated appearance

### 3.3 Required Sizes

| Size | Usage | Format |
|------|-------|--------|
| 16x16 | Browser tab (tiny) | PNG, ICO |
| 32x32 | Favicon | PNG, ICO |
| 64x64 | Navigation bar | PNG, SVG |
| 128x128 | App cards, thumbnails | PNG, SVG |
| 256x256 | Hero sections | PNG, SVG |
| 512x512 | App stores, marketing | PNG |
| 1024x1024 | Print, high-res | PNG, SVG |

### 3.4 File Naming Convention

```
/public/
├── logo.svg           # Primary vector logo
├── logo.png           # Primary raster (512x512)
├── logo-dark.svg      # For dark backgrounds
├── logo-light.svg     # For light backgrounds
├── favicon.ico        # Multi-size ICO
├── favicon-16x16.png
├── favicon-32x32.png
├── apple-touch-icon.png  # 180x180
└── og-image.png       # 1200x630 social sharing
```

---

## 4. App Logo Specifications

### 4.1 Logo Design Requirements by Category

Each app logo should:
1. Use the 3D gradient base (cyan-400 → cyan-700)
2. Feature a unique icon representing the app's function
3. Be instantly recognizable at 32x32 size
4. Work on both light and dark backgrounds

### 4.2 Icon Suggestions by App Category

#### Craft Apps
| App | Icon Suggestion | Style Notes |
|-----|-----------------|-------------|
| crochet-platform | Crochet hook + yarn ball | Curved, flowing lines |
| knitting-platform | Knitting needles crossed | X pattern with yarn |
| machineknit-platform | Machine gear + needle | Technical, precise |

#### Collectors Apps
| App | Icon Suggestion | Style Notes |
|-----|-----------------|-------------|
| javari-cards | Playing card / Trading card | Fanned cards look |
| javari-disney-vault | Castle silhouette | Iconic Disney castle |
| javari-comic-crypt | Comic speech bubble | POW! style |
| javari-card-vault | Safe/vault door | Secure feeling |
| javari-coin-cache | Stack of coins | Shiny, metallic |
| javari-vinyl-vault | Vinyl record | Grooves visible |
| javari-watch-works | Watch face | Classic timepiece |
| javari-spirits | Bottle silhouette | Elegant whiskey bottle |
| javari-scrapbook | Open book/album | Pages turning |

#### Real Estate Apps
| App | Icon Suggestion | Style Notes |
|-----|-----------------|-------------|
| javari-realty | House with key | Home + transaction |
| javari-property | Building outline | Multi-story |
| javari-property-hub | Pin on map | Location focused |
| javari-orlando | Florida state + sun | Regional identity |
| mortgage-rate-monitor | Graph with house | Data + real estate |
| javari-home-services | Wrench + house | Service focused |
| javari-construction | Hard hat / crane | Building in progress |

#### Business Tools
| App | Icon Suggestion | Style Notes |
|-----|-----------------|-------------|
| javari-invoice | Receipt/document | Dollar sign accent |
| javari-pdf-tools | PDF icon | Document with "PDF" |
| javari-presentation-maker | Slides/screen | Presentation boards |
| javari-resume-builder | Document + person | Professional |
| javari-cover-letter | Envelope + document | Communication |
| javari-email-templates | Email icon | @ symbol |
| javari-business-formation | Building blocks | Foundation |
| javari-legal | Scales of justice | Balance, fairness |
| javari-legal-docs | Gavel + document | Legal authority |
| javari-insurance | Shield + umbrella | Protection |

#### Content & Media
| App | Icon Suggestion | Style Notes |
|-----|-----------------|-------------|
| javari-music | Musical notes | Flowing melody |
| javari-video-analysis | Play button + eye | Video insight |
| javari-movie | Film reel / clapboard | Cinema |
| javari-ebook | Open book + digital | E-reader style |
| javari-social-posts | Share icon | Social connection |
| javari-game-studio | Game controller | Gaming |
| javari-games | Dice / joystick | Playful |
| javari-games-hub | Multiple game icons | Hub concept |
| javari-arena | Trophy / stadium | Competition |

#### Community & Nonprofit
| App | Icon Suggestion | Style Notes |
|-----|-----------------|-------------|
| javari-first-responders | Badge / siren | Emergency services |
| javari-veterans-connect | Star + flag | Military honor |
| javari-faith-communities | Hands together | Unity |
| javari-animal-rescue | Paw print + heart | Compassion |
| javari-partners | Handshake | Partnership |

#### Lifestyle
| App | Icon Suggestion | Style Notes |
|-----|-----------------|-------------|
| javari-travel | Airplane / globe | Adventure |
| javari-health | Heart + pulse | Wellness |
| javari-fitness | Dumbbell / runner | Active |
| javari-dating | Heart with arrow | Romance |
| javari-family | Family silhouette | Togetherness |
| javari-shopping | Shopping bag | Retail |
| javari-entertainment | Star / ticket | Fun |
| javari-education | Graduation cap | Learning |
| javari-merch | T-shirt | Products |

#### Platform & Infrastructure
| App | Icon Suggestion | Style Notes |
|-----|-----------------|-------------|
| javari-admin | Gear + shield | Control |
| javari-dashboard | Grid of cards | Overview |
| javari-auth | Lock / key | Security |
| javari-ai | Brain / neural | Intelligence |
| javari-ops | Wrench + cog | Operations |
| javari-analytics | Bar chart | Data |
| javari-portal | Door / gateway | Entry point |
| javari-builder | Blocks / crane | Construction |
| javari-forge | Anvil / hammer | Creation |

---

## 5. Cross-Branding Requirements

### 5.1 "Powered by Javari AI" Badge

Every app must display the Javari AI badge:

```
┌────────────────────────────────┐
│  ⚡ Powered by Javari AI       │
│     A CR AudioViz AI Product   │
└────────────────────────────────┘
```

**Placement:** Footer, about page, or subtle corner badge

### 5.2 CR AudioViz AI Logo Usage

The master CR AudioViz AI logo should appear:
- In the footer of every app
- On the about/credits page
- In documentation headers

### 5.3 Visual Continuity Elements

All apps must share:
1. **Same cyan gradient** for primary buttons
2. **Same slate text colors**
3. **Same rounded corners** (rounded-lg = 8px)
4. **Same shadow style** (shadow-md)
5. **Same font stack** (Inter, system-ui, sans-serif)

---

## 6. Mobile-First Requirements

### 6.1 Viewport Standards

| Device | Width | Must Support |
|--------|-------|--------------|
| Small Phone | 320px | Yes |
| Standard Phone | 375px | Yes (Primary) |
| Large Phone | 414px | Yes |
| Small Tablet | 768px | Yes |
| Tablet | 1024px | Yes |
| Desktop | 1280px+ | Yes |

### 6.2 Touch Target Requirements

- **Minimum tap target:** 44x44px
- **Spacing between targets:** 8px minimum
- **Button padding:** 12px minimum

### 6.3 Mobile Layout Rules

1. **Single column** layouts on mobile (< 768px)
2. **No horizontal scroll** ever
3. **Bottom navigation** for primary actions
4. **Sticky headers** ≤ 60px height
5. **Full-width buttons** on mobile
6. **Collapsible menus** (hamburger)

### 6.4 Font Size Minimums

| Element | Mobile | Desktop |
|---------|--------|---------|
| Body text | 16px | 16px |
| Secondary text | 14px | 14px |
| Headings H1 | 28px | 36px |
| Headings H2 | 24px | 30px |
| Buttons | 16px | 16px |

---

## 7. Implementation Checklist

### 7.1 Per-App Requirements

- [ ] Custom logo in 3D gradient style
- [ ] Favicon set (16, 32, 180, 512)
- [ ] og-image.png for social sharing
- [ ] "Powered by Javari AI" badge
- [ ] CR AudioViz AI footer link
- [ ] Brand colors only (no forbidden colors)
- [ ] Mobile viewport meta tag
- [ ] 44px tap targets
- [ ] No horizontal scroll at 375px
- [ ] E2E tests passing

### 7.2 Required Files

```
/public/
├── logo.svg
├── logo.png
├── favicon.ico
├── favicon-16x16.png
├── favicon-32x32.png
├── apple-touch-icon.png
└── og-image.png
```

---

## 8. Logo Creation Brief

### For Designer/AI Image Generation:

**Style:** 3D glossy app icon style (like iOS/Android app icons)
**Shape:** Rounded square (22% corner radius)
**Background:** Linear gradient from #22D3EE (top) to #0E7490 (bottom)
**Icon:** White silhouette, 60% of logo size, centered
**Effects:** 
- Subtle inner shadow (top-left light source)
- Outer glow (#22D3EE at 20% opacity)
- Slight reflection/shine on top half

**Prompt Template for AI Generation:**
```
3D app icon, glossy rounded square, cyan gradient background 
(#22D3EE to #0E7490), white [ICON_NAME] silhouette centered, 
subtle shadow and glow, professional SaaS style, 
high quality, 512x512
```

---

**Document Version:** 1.0  
**Last Updated:** January 9, 2026  
**Contact:** admin@craudiovizai.com
