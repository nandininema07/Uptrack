# UpTrack - Personal Tracker

## Overview
UpTrack is a comprehensive Progressive Web Application (PWA) for personal tracking and management. The application helps users build consistency through smart streak tracking, progress visualization, and offline support. It features a modern, responsive design with both light and dark themes, intuitive habit management tools, detailed analytics, and notification systems for habit reminders.

The system is built as a full-stack application with a React frontend, Express.js backend, and PostgreSQL database, designed to work seamlessly across desktop and mobile devices with PWA capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and optimized builds
- **UI Components**: Shadcn/ui component library built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with CSS custom properties for theming, supporting both light and dark modes
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **PWA Features**: Service worker for offline functionality, manifest file for app-like experience, push notifications support

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with proper HTTP status codes and error handling
- **Storage Layer**: Abstracted storage interface with in-memory implementation for development
- **Validation**: Zod schemas for request/response validation and type safety

### Database Schema
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Tables**: 
  - `habits` - Core habit definitions with frequency, reminders, and categorization
  - `habit_completions` - Daily completion records with timestamps and notes
  - `streaks` - Current and longest streak tracking per habit
  - `notifications` - System notifications for reminders and celebrations
- **Features**: UUID primary keys, JSONB for custom schedules, timestamp tracking

### Data Flow
- **Client-Server**: JSON API with credential-based sessions
- **Caching**: React Query handles client-side caching with stale-while-revalidate strategy
- **Offline Support**: Service worker caches API responses and static assets
- **Real-time Updates**: Optimistic updates with automatic rollback on failure

### Component Architecture
- **Layout**: Bottom navigation for mobile-first experience
- **Pages**: Dedicated routes for Today, Habits, Analytics, Calendar, and Settings
- **Reusable Components**: HabitCard, ProgressRing, AddHabitModal with consistent styling
- **Theme System**: Context-based theme provider with system preference detection

### Progressive Web App Features
- **Installation**: Detects installation capability and provides install prompts
- **Offline Mode**: Cache-first strategy for static assets, network-first for API calls
- **Notifications**: Browser notification API integration with permission management
- **Mobile Optimization**: Touch-friendly interface with proper viewport configuration

## External Dependencies

### Core Libraries
- **React Ecosystem**: React 18, React DOM, TypeScript for type safety
- **Build Tools**: Vite for development server and bundling, ESBuild for server compilation
- **UI Framework**: Radix UI primitives for accessible components, Tailwind CSS for styling

### Backend Dependencies
- **Database**: Neon Database (PostgreSQL) with connection pooling via @neondatabase/serverless
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Validation**: Zod for schema validation and type inference
- **Session Management**: Connect-pg-simple for PostgreSQL session storage

### Development & Deployment
- **Development**: TSX for TypeScript execution, Replit-specific plugins for development environment
- **Fonts**: Google Fonts (Inter) and Font Awesome for icons
- **PWA Tools**: Web App Manifest, Service Worker for offline capabilities

### Data & Analytics
- **Date Handling**: date-fns for date manipulation and formatting
- **Query Management**: TanStack Query for server state management and caching
- **Form Handling**: React Hook Form with Zod resolvers for validation

### UI Enhancement Libraries
- **Animations**: Class Variance Authority for component variants
- **Utilities**: clsx and tailwind-merge for conditional styling
- **Charts**: Recharts (referenced in UI components for analytics visualization)
- **Carousels**: Embla Carousel for interactive content navigation