# RoofMaster 360 - Graphite Liquid Glass Design Guidelines

## Brand Identity

**Purpose:** Premium roofing estimation app for professional contractors seeking precision, speed, and sophistication.

**Aesthetic Direction:** Luxury automotive dashboard meets spatial glass computing. Dark graphite base with liquid glass panels that shimmer like polished platinum. Every surface feels like premium frosted metal with subtle depth and metallic refraction. Think Rolls-Royce instrument cluster meets next-gen interfaces.

**Unforgettable Element:** Layered translucent glass surfaces floating over deep graphite gradients, with metallic silver shimmer that responds to interaction. Platinum accents glow subtly on touch, creating a sense of refined craftsmanship.

## Navigation Architecture

**Tab Navigation (4 tabs + FAB):**
- Projects (saved estimates)
- Permits (lookup history)
- Resources (features, pricing)
- Account (profile, subscription)
- Floating Action Button: New Project (platinum sphere with metallic shine)

## Screen-by-Screen Specifications

### Welcome Screen
- **Header:** Transparent, skip button top-right
- **Layout:** Full-screen, non-scrollable
- **Content:** Large frosted glass panel with logo, tagline "Precision Roofing Estimates from the Sky" in platinum text, animated graphite gradient mesh background, primary button with metallic glow
- **Insets:** Top: insets.top + Spacing.xl, Bottom: insets.bottom + Spacing.xl

### Features Carousel
- **Header:** Standard, skip button (right)
- **Layout:** Horizontal scrollable, 3 slides with large icon in metallic glass circle, title, description, pagination dots (platinum for active)
- **Insets:** Standard with navigation

### Sign In
- **Header:** Transparent
- **Layout:** Non-scrollable, centered glass card
- **Content:** Glass panel with Apple/Google sign-in buttons (frosted glass with platinum glow), terms/privacy links
- **Insets:** Top: insets.top + Spacing.xl, Bottom: insets.bottom + Spacing.xl

### Projects Tab
- **Header:** Custom transparent, "Projects" title, filter icon (right)
- **Layout:** ScrollView root
- **Content:** Search bar (frosted glass with metallic tint), project cards (glass panels with subtle metallic shadows, thumbnail with glass overlay, estimate total in platinum glow, date), empty state illustration
- **Insets:** Top: headerHeight + Spacing.xl, Bottom: tabBarHeight + 40 + Spacing.xl

### New Project Modal
- **Header:** Standard, "Cancel" (left), "Next" (right, platinum glow when enabled)
- **Layout:** Scrollable form
- **Content:** Property address input (glass with silver focus glow), measurement upload dropzone (platinum border glow), manual override inputs, floating "Continue" button (glass sphere with platinum glow)
- **Floating button shadow:** offset (0, 2), opacity 0.10, radius 2
- **Insets:** Top: Spacing.xl, Bottom: insets.bottom + Spacing.xl

### Cost Input Screen
- **Header:** "Back" (left), "Preview" (right, platinum)
- **Layout:** Scrollable form
- **Content:** Section headers in metallic silver, materials list (glass cards with + button), labor rate input, real-time total in platinum glow
- **Insets:** Top: Spacing.xl, Bottom: insets.bottom + Spacing.xl

### Estimate Preview
- **Header:** "Back" (left), "Save" + "Share PDF" (right)
- **Layout:** ScrollView with glass document preview
- **Content:** PDF preview on frosted glass, logo watermark, itemized breakdown in glass table, total in platinum, bottom sheet with save options
- **Insets:** Top: Spacing.xl, Bottom: insets.bottom + Spacing.xl

### Permits Tab
- **Header:** Transparent, "Permit Lookup", search icon (right)
- **Layout:** ScrollView
- **Content:** Pinned search bar, permit cards with status badges (colored metallic glow)
- **Insets:** Top: headerHeight + Spacing.xl, Bottom: tabBarHeight + Spacing.xl

### Resources Tab
- **Header:** Transparent, "Resources"
- **Layout:** ScrollView
- **Content:** Feature carousel (horizontal glass cards), pricing tiers (3 stacked glass cards, current has platinum border), support buttons
- **Insets:** Top: headerHeight + Spacing.xl, Bottom: tabBarHeight + Spacing.xl

### Account Tab
- **Header:** Standard, "Account"
- **Layout:** Non-scrollable sections
- **Content:** Profile card (glass panel with avatar, name, email), subscription card with tier badge, settings list (glass cells), logout button
- **Insets:** Top: Spacing.xl, Bottom: tabBarHeight + Spacing.xl

## Color Palette

- **Graphite Base:** #1A1D23 (deep charcoal foundation)
- **Graphite Gradient:** Linear from #2D3139 to #1A1D23
- **Platinum:** #E8E9ED (bright metallic accent for CTAs, active states)
- **Silver:** #9CA3AF (medium metallic for borders, secondary accents)
- **Glass Base:** rgba(255, 255, 255, 0.06)
- **Glass Border:** rgba(255, 255, 255, 0.12)
- **Text Primary:** #FFFFFF
- **Text Secondary:** rgba(255, 255, 255, 0.60)
- **Success Glow:** #34D399 (metallic green)
- **Error Glow:** #F87171 (metallic red)

## Typography

- **Font:** SF Pro Display (system)
- **Headings:** 28pt Bold, white with platinum glow (text-shadow: 0 0 16px rgba(232, 233, 237, 0.4))
- **Subheadings:** 20pt Semibold, white
- **Body:** 16pt Regular, rgba(255,255,255,0.85)
- **Captions:** 14pt Regular, rgba(255,255,255,0.60)

## Visual Design

### Glass Components
- **Glass Panels:** Background blur (20), rgba(255,255,255,0.06) overlay, 1px border rgba(255,255,255,0.12), 16px radius
- **Primary Buttons:** Glass base + platinum gradient overlay (0.25 opacity), platinum glow shadow (0 0 20px rgba(232,233,237,0.5)), press: scale(0.96) + increased glow
- **Secondary Buttons:** Glass base, silver glow border (1px), press: silver glow intensifies
- **Input Fields:** Glass base, platinum glow border on focus (2px), placeholder 0.4 opacity
- **Cards:** Glass panel with elevation, 20px padding, hover/press: scale + glow increase
- **FAB:** Spherical (56x56), platinum radial gradient core, pulsing metallic glow (0 0 28px rgba(232,233,237,0.7)), shadow: offset (0,2), opacity 0.10, radius 2

### Visual Feedback
- All touchables: Press state opacity 0.7 AND scale 0.96
- Metallic shimmer: Subtle animated gradient shift on interactive elements
- Glows pulse gently (1.5s duration)

### Icons
- Feather icons, 24px navigation, 20px buttons
- Subtle platinum glow: text-shadow 0 0 6px rgba(232,233,237,0.3)

## Assets to Generate

1. **icon.png** - Glass sphere with graphite/platinum gradient glow
   - WHERE USED: Device home screen

2. **splash-icon.png** - Simplified logo on graphite glass
   - WHERE USED: App launch

3. **empty-projects.png** - Minimalist glass roof blueprint with metallic accents
   - WHERE USED: Projects tab empty state

4. **empty-permits.png** - Glass document with platinum search icon
   - WHERE USED: Permits tab empty state

5. **onboarding-drone.png** - Stylized drone with glass/metallic panels
   - WHERE USED: Features carousel slide 1

6. **onboarding-permit.png** - Permit document with platinum approval stamp
   - WHERE USED: Features carousel slide 2

7. **onboarding-sync.png** - Cloud with glass/metallic nodes
   - WHERE USED: Features carousel slide 3

8. **avatar-contractor-1.png to avatar-contractor-4.png** - Professional avatars with metallic glass frames
   - WHERE USED: Account profile, setup

**Asset Style:** Glass/translucent aesthetic with graphite base, platinum (#E8E9ED) and silver (#9CA3AF) metallic glows, minimal line art, premium automotive-inspired elegance.