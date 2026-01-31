# RoofMaster 360

A professional roofing estimation platform with both a responsive website AND native iOS/Android mobile applications.

## Overview

RoofMaster 360 enables roofing professionals to:
- Create and manage roofing projects with detailed measurements
- Input roof dimensions manually or via drone data import
- Generate professional cost estimates with itemized breakdowns
- Look up permit history for properties
- Access subscription plans and support resources

## Platform Architecture

This project includes **two interfaces**:

### 1. Marketing Website (Express Server - Port 8081)
- Responsive single-page website for desktop and mobile browsers
- Sections: Hero, Features, How It Works, Pricing, Contact
- Located: `server/templates/website.html`
- **Access**: Default URL (main Replit URL)

### 2. Native Mobile App (Expo - Port 8082)
- React Native app for iOS and Android devices
- Full project management and estimation features
- Located: `client/` directory
- **Access**: Scan QR code with Expo Go app

## Tech Stack

- **Website**: HTML5/CSS3/JavaScript served via Express
- **Mobile App**: Expo SDK 54, React Native
- **Navigation**: React Navigation 7 (Bottom Tabs + Stack navigators)
- **State**: React hooks with AsyncStorage for local persistence
- **Styling**: React Native StyleSheet with custom theme system
- **Server**: Express.js (port 8081 - proxies Expo dev endpoints to Metro)
- **Expo Dev Server**: Metro on port 8082

## Project Structure

```
client/
├── App.tsx                 # App entry with providers
├── components/             # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── ErrorBoundary.tsx
│   ├── ErrorFallback.tsx
│   ├── HeaderTitle.tsx
│   ├── KeyboardAwareScrollViewCompat.tsx
│   ├── Spacer.tsx
│   ├── ThemedText.tsx
│   └── ThemedView.tsx
├── constants/
│   └── theme.ts            # Colors, spacing, typography, shadows
├── hooks/                  # Custom hooks
├── lib/
│   └── query-client.ts     # API configuration
├── navigation/             # Navigation stacks
│   ├── MainTabNavigator.tsx
│   ├── ProjectsStackNavigator.tsx
│   ├── PermitsStackNavigator.tsx
│   ├── ResourcesStackNavigator.tsx
│   ├── AccountStackNavigator.tsx
│   └── RootStackNavigator.tsx
└── screens/                # App screens
    ├── ProjectsScreen.tsx
    ├── PermitsScreen.tsx
    ├── ResourcesScreen.tsx
    ├── AccountScreen.tsx
    ├── NewProjectScreen.tsx
    ├── CostInputScreen.tsx
    ├── EstimatePreviewScreen.tsx
    └── ContactScreen.tsx
```

## Navigation Structure

**Tab Navigation (4 tabs):**
1. **Projects** - List/manage roofing estimates
2. **Permits** - Search permit history by address
3. **Resources** - Features overview, pricing plans, support
4. **Account** - Profile, subscription, settings

**Modal/Stack Screens:**
- New Project → Cost Input → Estimate Preview
- Contact Us

## Color Palette

- **Primary**: Deep Navy Blue (#1A2332)
- **Accent**: Vibrant Orange (#FF6B35)
- **Success**: Forest Green (#2D6A4F)
- **Light Background**: Off-White (#F8F9FA)
- **Dark Background**: Charcoal (#151D28)

## Running the App

The app automatically starts with `npm run all:dev` which runs both:
- Express backend server on port 8081 (serves website and proxies Expo dev requests)
- Expo development server (Metro) on port 8082

### Accessing the Website (Desktop/Mobile Browsers)
- **Default URL**: The marketing website is served at the root URL for all browser visitors
- Express intercepts browser requests and serves the website
- Expo development endpoints are proxied to Metro on port 8082

### Accessing the Mobile App (iOS/Android)
Scan the QR code with Expo Go app to test on your physical device.

### Production Deployment
When deployed, the Express server serves both:
- The marketing website at the root URL (`/`)
- Expo manifest for native mobile apps (detected via expo-platform header)

## Recent Changes

- **Dec 20, 2025**: AI Assistant, branding, and detailed estimates
  - Added RoofMaster AI assistant powered by GPT-5.2 for roofing guidance
  - AI provides material recommendations, cost estimation, maintenance tips, and permit guidance
  - Chat interface with conversation history and quick prompts
  - Free tier: 1 free AI request for logged-in users before requiring subscription
  - Added JWT-based user authentication with secure password hashing (PBKDF2)
  - Implemented login/signup screens with session management
  - Added protected API routes with ownership verification
  - PDF generation for estimates using expo-print and expo-sharing
  - Text-to-speech for reading estimates aloud using expo-speech
  - Web Speech API integration for browser-based speech-to-text
  - PostgreSQL database integration with users and projects tables
  - Projects sync to database for authenticated users
  - **Company Branding**: Upload company logo and set company name for branded estimates/PDFs
  - **Detailed Material Breakdown**: Per-square quantity calculations showing:
    - Shingles: bundles x cost (3 bundles/sq for 3-tab, 4 for architectural)
    - Underlayment: rolls x cost (1 roll per 3 squares)
    - Ice & Water Shield: rolls x cost
    - Drip Edge & Starter Strip: pieces x cost
    - Ridge Cap: bundles x cost
    - Flashing: pieces x cost
    - Roof Vents: units x cost
    - Nails: pounds x cost

- **Dec 16, 2025**: Added Google Solar API and Shovels.ai integrations
  - New Project screen: "Auto-Measure from Address" button uses Google Solar API to get satellite roof measurements
  - Returns: total area, roof squares, pitch, orientation, and individual roof segments
  - Permits screen: Real permit lookup via Shovels.ai API
  - Searches 5 years of permit history by zip code/state
  - Filters results to roofing-related permits only
  - Backend endpoints: POST /api/roof-measurements, POST /api/permits, GET /api/config/status

- **Dec 16, 2025**: Added Terms of Service, Privacy Policy, and Feedback features
  - Created /terms and /privacy pages with professional legal content
  - All support issues link to lionshareanimation.com
  - Updated website footer with proper links to legal pages
  - Added "Send Feedback" screen to mobile app (bug reports, feature requests, general feedback)
  - Added Legal screen with WebView to display terms/privacy in-app
  - Updated Account screen with feedback and legal navigation

- **Dec 15, 2025**: Fixed port routing for website priority
  - Express now runs on port 8081 (external-facing port)
  - Metro bundler moved to port 8082
  - Added http-proxy-middleware to proxy Expo dev endpoints
  - Website is now the default page for browser visitors

- **Dec 15, 2025**: Added responsive marketing website
  - Created full-featured website with Hero, Features, How It Works, Pricing, Contact sections
  - Implemented responsive design for desktop, tablet, and mobile browsers
  - Added mobile hamburger menu navigation
  - Configured Express to serve website for browser requests

- **Dec 15, 2025**: Initial MVP build
  - Created 4-tab navigation structure for mobile app
  - Implemented project creation flow with measurement inputs
  - Added cost input with materials, labor, and additional costs
  - Built estimate preview with PDF-style layout
  - Designed permits lookup screen
  - Created resources page with features and pricing
  - Built account screen with settings and subscription info
  - Generated custom app icon
  - Applied professional roofing industry color scheme

## User Preferences

- Professional, construction-industry aesthetic
- AAA-quality mobile design
- Smooth transitions and touch interactions
- Support for iOS and Android via Expo Go
