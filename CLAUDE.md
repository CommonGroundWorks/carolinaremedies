# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Lint code with ESLint
- `npm run type-check` - Run TypeScript type checking

### Testing Commands
- `npm run test` - Run all unit tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:e2e` - Run Playwright end-to-end tests
- `npm run test:ux` - Run UX fidelity tests

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict configuration
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **State Management**: Zustand stores
- **Testing**: Vitest (unit), Playwright (E2E)
- **UI Libraries**: Custom components with Tailwind, Lucide React icons
- **Forms**: React Hook Form with Zod validation
- **Animation**: Framer Motion

### Project Structure

#### Core Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - Component library organized by feature
- `src/lib/` - Core utilities, services, and store configuration
- `src/types/` - TypeScript type definitions
- `src/hooks/` - Custom React hooks

#### Component Organization
Components are organized by feature:
- `admin/` - Administrative components for inventory management
- `cart/` - Shopping cart drawer and related components
- `checkout/` - Checkout flow components (forms, payment, confirmation)
- `layout/` - Page layout components (header, footer)
- `product/` - Product display components (grid, cards, details)
- `ui/` - Reusable UI components (buttons, cards, badges)

### State Management
The application uses Zustand stores located in `src/lib/stores/`:
- **CartStore** (`useCartStore`) - Shopping cart state and actions
- **UserStore** (`useUserStore`) - User authentication and preferences
- **UIStore** (`useUIStore`) - Global UI state (modals, mobile menu)

### Service Architecture
Services are located in `src/lib/services/`:
- **ProductService** - Product data management with Supabase integration
- **InventoryService** - Stock level management and alerts

### Testing Strategy
- Unit tests use Vitest with React Testing Library
- E2E tests use Playwright with multiple browser configurations
- UX fidelity tests ensure design consistency
- Test files are co-located with components or in dedicated test directories

### Key Development Patterns

#### Text Management
- Uses JSON-based internationalization system (`src/lib/i18n.ts`)
- Text content stored in `locales/en.json`
- Dynamic text loading with caching for performance
- Variable substitution support for dynamic content

#### Category System
- Dynamic category management in `src/lib/categories.ts`
- Extensible with metadata (icons, colors, descriptions)
- SEO-optimized with automatic URL generation
- Support for hierarchical category structures

#### Image Optimization
- Images stored in `public/images/optimized/` with multiple formats (WebP, AVIF, JPG)
- Responsive images with card/hero/original/thumbnail sizes
- Fallback system for missing images

#### Error Handling
- Graceful fallbacks for database connectivity issues
- Error boundaries for component-level error handling
- Toast notifications for user feedback

#### Database Integration
- Supabase configuration in `src/lib/supabase.ts`
- Type-safe database operations with generated types (`src/types/database.types.ts`)
- Row Level Security (RLS) policies for data protection

### Environment Configuration
Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase public API key

### Development Workflow
1. Always run `npm run type-check` before commits
2. Use `npm run lint` for code quality
3. Run relevant tests for your changes
4. Database changes require migration files in `supabase/migrations/`
5. Component changes should include corresponding tests

### Cannabis Industry Considerations
This is a hemp/cannabis e-commerce platform with specific requirements:
- Age verification systems
- Regulatory compliance features
- Product categorization (flower, concentrates, edibles, topicals, vapes, accessories)
- Weight-based pricing variations
- Lab result integrations
- Cash on delivery payment system

## Code Cleanup and File Management Rules

### File Creation Guidelines
- ALWAYS analyze existing components before creating new ones
- NEVER create duplicate functionality that already exists in the codebase
- USE existing components from the established component library
- PREFER extending existing components over creating new ones
- ONLY create new files when functionality is genuinely missing or required

### Component Reusability Assessment
- REUSE existing components from `src/components/` when possible:
  - UI: Button, Card, Badge from ui/
  - Product: ProductGrid, ProductCard, ProductDetail
  - Cart: CartDrawer for shopping cart functionality
  - Checkout: CheckoutForm, CustomerForm, OrderSummary, PaymentMethod
  - Layout: Header for navigation
  - Admin: InventoryDashboard, InventoryAlerts
- EXTEND existing services rather than duplicating logic
- FOLLOW established patterns for state management (Zustand stores)

### Before Creating New Code
1. Search existing codebase for similar functionality
2. Review component library for reusable elements
3. Check if existing services can be extended
4. Verify no duplicate implementations exist
5. Only proceed if functionality is genuinely needed

### Cleanup Responsibilities
- REMOVE unused imports and dead code
- CONSOLIDATE duplicate functionality
- MAINTAIN consistent file structure
- FOLLOW established naming conventions
- ENSURE proper TypeScript typing

### Important Instructions
- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested

### Project-Specific Features

#### Cash on Delivery (COD) System
- Primary payment method for the platform
- Checkout flow supports COD-specific validation
- Order processing designed for cash collection on delivery

#### Inventory Management
- Real-time stock level tracking
- Administrative alerts for low inventory
- Integration with product service for availability checks

#### Multi-format Image Support
- Comprehensive image optimization pipeline
- Multiple size variants (thumbnail, card, hero, original)
- Format variants (WebP, AVIF, JPG) with fallbacks

#### Clean Architecture
- Service layer separation between UI and business logic
- Type safety with comprehensive TypeScript definitions
- Performance optimizations with lazy loading ready
- BDD-ready structure with clear component boundaries