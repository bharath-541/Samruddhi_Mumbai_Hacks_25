# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **Predictive Hospital AI Dashboard** built for a hackathon, specifically designed for Mumbai's healthcare needs. The application predicts hospital surge events based on pollution levels, festivals, and other environmental factors affecting patient influx.

## Architecture

### Tech Stack
- **Frontend**: React 19.1.1 + TypeScript + Vite
- **Styling**: TailwindCSS with custom clinical design system
- **Routing**: React Router DOM v7.8.1
- **Charts**: Recharts for data visualization
- **UI Components**: Radix UI primitives with custom components
- **Testing**: Vitest + React Testing Library
- **Deployment**: Firebase Hosting

### Directory Structure
```
src/
├── components/
│   ├── layout/        # Layout components (Layout, Sidebar, TopNavbar)
│   ├── charts/        # Chart components (Interactive, Line, Responsive)
│   ├── shared/        # Reusable UI components (StatsCard, ClinicalBadge, etc.)
│   ├── routing/       # Routing utilities
│   └── error/         # Error boundary components
├── pages/             # Main page components
├── services/          # Data services (mock data, weather, disease surge)
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
├── styles/            # Theme and styling utilities
└── lib/               # Library configurations
```

### Data Architecture
- **MockDataService**: Singleton service providing realistic hospital metrics
- **PatientForecast**: Predicts patient influx with confidence intervals
- **Alert System**: Context-aware alerts based on AQI, bed occupancy, ICU usage
- **Recommendations**: AI-generated suggestions for staffing and supplies
- **Explanations**: Detailed breakdowns of prediction factors

### Key Features
- **Real-time Dashboard**: Hospital metrics, bed occupancy, ICU usage
- **Predictive Analytics**: 7-day patient surge forecasting
- **Environmental Integration**: AQI-based surge predictions
- **Mobile-Responsive**: Optimized for tablets and mobile devices
- **Clinical Design System**: Medical-grade color schemes and typography

## Common Development Commands

### Development Server
```bash
cd "Mumbai_hacks _frontend/hospital-dashboard"
npm run dev
```

### Build and Preview
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality
```bash
# Lint code
npm run lint

# Type checking (included in build)
npm run build  # runs tsc -b && vite build
```

### Testing
```bash
# Run tests (Vitest is configured but no test files exist yet)
npx vitest
```

### Deployment
```bash
# Deploy to Firebase
npm run build
firebase deploy
```

## Development Patterns

### Component Architecture
- Components use TypeScript with strict typing
- Props interfaces defined in `types/index.ts`
- Responsive design using TailwindCSS breakpoints
- Mobile-first approach with `lg:` breakpoints for desktop

### Styling System
- Custom clinical color palette in `tailwind.config.js`
- Design tokens: `clinical-*`, `alert-*`, `status-*` color scales  
- Medical typography: Inter for UI, JetBrains Mono for data
- Spacing system: `clinical-xs` through `clinical-2xl`

### Data Flow
- Services use singleton pattern for data management
- Mock data simulates realistic hospital scenarios
- Time-based variations (day/night patterns)
- Event-based surge modeling (festivals, pollution, epidemics)

### Path Aliases
Vite is configured with path aliases for clean imports:
- `@/` → `./src/`
- `@/components` → `./src/components/`
- `@/pages` → `./src/pages/`
- `@/services` → `./src/services/`
- `@/types` → `./src/types/`
- `@/utils` → `./src/utils/`
- `@/lib` → `./src/lib/`

### Page Structure
1. **Home**: Landing page with clean gradient layout
2. **Overview**: Main dashboard with metrics and alerts
3. **Predictions**: 7-day forecast with filtering options
4. **Recommendations**: AI-generated action items
5. **Explainability**: Detailed prediction explanations

## Development Notes

### Working Directory
The main application is located in:
```
Mumbai_hacks _frontend/hospital-dashboard/
```

### Key Files to Understand
- `src/types/index.ts`: Complete type definitions
- `src/services/mockDataService.ts`: Data generation logic
- `src/components/layout/Layout.tsx`: Main layout with responsive behavior
- `vite.config.ts`: Build configuration with path aliases
- `tailwind.config.js`: Design system configuration

### Mobile Responsiveness
- Sidebar collapses on mobile (`< 1024px`)
- Touch-optimized components in `shared/` directory
- Grid layouts adapt using `MobileOptimizedGrid`
- Navigation uses chip-style buttons on mobile

### Firebase Configuration
- Hosting configured in `firebase.json`
- SPA routing with `index.html` fallback
- Built files deploy from `dist/` directory

### State Management
- Uses React hooks and context (no external state management)
- `useNavigation` hook manages active tab state
- Local state for real-time updates (30-second intervals)

When working with this codebase, focus on the medical/clinical context and ensure all features serve the hospital surge prediction use case.
