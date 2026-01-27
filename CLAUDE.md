# CLAUDE.md - AI Assistant Guide for TrialByte Frontend

This document provides essential context for AI assistants working with the TrialByte clinical trials management frontend application.

## Project Overview

**TrialByte Frontend** is a Next.js 15 application for managing clinical trials, therapeutics, drugs, and user administration. It's built with React 19, TypeScript, and Tailwind CSS.

- **Framework:** Next.js 15.5.7 (App Router)
- **React:** 19 (latest)
- **TypeScript:** 5 (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui components
- **State:** React Query (TanStack) + Context API
- **Backend:** REST API on AWS Lightsail

## Quick Reference

### Essential Commands

```bash
npm run dev       # Start development server at http://localhost:3000
npm run build     # Build for production
npm run start     # Run production build
npm run lint      # Run ESLint
```

### Key Environment Variables

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5002  # Backend API URL
```

### Development Credentials (Local Testing)

```
Email: trialbyteuser@gmail.com
Password: trialbyteuser
```

## Codebase Structure

```
/home/user/trialbytedeployment/
├── app/                          # Next.js App Router
│   ├── _lib/                    # Core libraries
│   │   ├── api.ts              # Centralized API client (CRITICAL)
│   │   └── db.ts               # Database config (unused locally)
│   ├── _types/                  # TypeScript type definitions
│   ├── api/                     # Next.js API routes
│   │   ├── uploadthing/        # File upload endpoints
│   │   └── edgestore/          # Edge storage endpoints
│   ├── admin/                   # Admin dashboard pages
│   │   ├── clinical-trials/    # Trial management
│   │   ├── therapeutics/       # Therapeutic management
│   │   ├── drugs/              # Drug management
│   │   ├── user-list/          # User management
│   │   ├── role-management/    # Roles & permissions
│   │   ├── approvals/          # Approval workflows
│   │   ├── activity-logs/      # Activity logging
│   │   └── dropdown-management/# Dropdown data management
│   ├── user/                    # User-facing pages
│   │   ├── clinical_trial/     # Trial search & browsing
│   │   ├── clinical_analytics/ # Analytics & reports
│   │   ├── drugs/              # Drug search & details
│   │   ├── mail/               # Messaging
│   │   ├── help/               # Help & support
│   │   └── pricing/            # Pricing pages
│   ├── globals.css             # Global styles & CSS variables
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Login page (entry point)
│   └── providers.tsx           # Global providers (React Query, i18n)
│
├── components/                  # Reusable React components
│   ├── ui/                     # shadcn/ui components (50+)
│   ├── modals/                 # Modal components
│   ├── app-sidebar.tsx         # Main admin sidebar
│   ├── manager-sidebar.tsx     # Manager sidebar
│   ├── user-navbar.tsx         # User navigation
│   ├── language-selector.tsx   # i18n language picker
│   └── [feature components]    # Search, filter, export modals
│
├── hooks/                       # Custom React hooks
│   ├── use-drug-names.ts       # Drug name management
│   ├── use-dynamic-dropdown.ts # Dynamic dropdowns
│   ├── use-therapeutic-trial.ts
│   ├── use-mobile.tsx          # Mobile detection
│   └── use-toast.ts            # Toast notifications
│
├── lib/                         # Utility libraries
│   ├── utils.ts                # cn() classname utility
│   ├── date-utils.ts           # Date formatting
│   ├── format-utils.ts         # Data formatting
│   ├── search-utils.ts         # Search utilities
│   └── api/                    # API-specific utilities
│
├── locales/                     # i18n translations
│   ├── en/translation.json     # English
│   ├── es/translation.json     # Spanish
│   └── fr/translation.json     # French
│
├── public/                      # Static assets
│   ├── trialbyte-logo.png      # Main logo
│   ├── pngs/                   # PNG assets
│   └── svgs/                   # SVG assets
│
└── Configuration Files
    ├── next.config.mjs         # Next.js config
    ├── tailwind.config.ts      # Tailwind CSS config
    ├── tsconfig.json           # TypeScript config
    ├── components.json         # shadcn/ui config
    ├── i18n.ts                 # i18next setup
    ├── Dockerfile              # Docker deployment
    └── vercel.json             # Vercel deployment
```

## Critical Files to Know

| File | Purpose |
|------|---------|
| `app/_lib/api.ts` | **Centralized API client** - All backend calls go through here |
| `app/layout.tsx` | Root layout with all providers |
| `app/providers.tsx` | React Query + i18n setup |
| `components/ui/*` | shadcn/ui component library |
| `tailwind.config.ts` | Theme colors and customization |
| `next.config.mjs` | Build configuration |

## Code Conventions

### Component Structure

```typescript
"use client";  // Required for client components

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Props interface
interface ComponentProps {
  prop1: string;
  prop2?: number;
}

export default function ComponentName({ prop1, prop2 }: ComponentProps) {
  const [state, setState] = useState<Type>(initialValue);
  const router = useRouter();

  useEffect(() => {
    // Side effects
  }, [dependencies]);

  const handleAction = () => {
    console.log("Debug: action triggered"); // Debug logging is standard
  };

  return (
    <div className="tailwind-classes">
      {/* Content */}
    </div>
  );
}
```

### API Integration Pattern

Always use the centralized API client from `app/_lib/api.ts`:

```typescript
import { authApi, usersApi, therapeuticsApi, drugsApi, trialsApi } from "@/app/_lib/api";

// Authentication
const res = await authApi.login(email, password);

// CRUD operations
const drugs = await drugsApi.getAllDrugsWithData();
const users = await usersApi.list();
const trial = await trialsApi.getById(id);
```

### State Management

1. **React Query** for server state (data fetching):
```typescript
import { useQuery, useMutation } from "@tanstack/react-query";

const { data, isLoading } = useQuery({
  queryKey: ["drugs"],
  queryFn: () => drugsApi.getAllDrugsWithData(),
});
```

2. **Context API** for complex multi-step forms:
```typescript
// See: app/admin/therapeutics/new/therapeutic-form-context.tsx
const { formData, updateField } = useTherapeuticForm();
updateField("step5_1", "fieldName", value);
```

3. **localStorage** for persistence:
```typescript
localStorage.getItem("token");     // Auth token
localStorage.getItem("userId");    // User ID
localStorage.getItem("role_name"); // User role
localStorage.getItem("i18nextLng"); // Language preference
```

### Form Patterns

Use React Hook Form + Zod for validation:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
});

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { name: "", email: "" },
});
```

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Pages | `page.tsx` | `app/admin/drugs/page.tsx` |
| Layouts | `layout.tsx` | `app/admin/layout.tsx` |
| Components | PascalCase | `DrugFilterModal.tsx` |
| Hooks | `use-*.ts` | `use-drug-names.ts` |
| Utilities | camelCase | `date-utils.ts` |
| Types | PascalCase or in-file | `Drug`, `User`, `Trial` |

### Styling Guidelines

- **Use Tailwind CSS classes** exclusively
- **Custom colors** defined in `tailwind.config.ts`:
  - Primary: `#204B73` (dark blue)
  - Secondary: `#C6EDFD` (light blue)
- **Dark mode** supported via `next-themes`
- **shadcn/ui** for consistent component styling

```typescript
// Use the cn() utility for conditional classes
import { cn } from "@/lib/utils";

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === "primary" && "primary-variant"
)} />
```

### Error Handling

```typescript
try {
  const result = await apiCall();
} catch (err) {
  console.error("Error context:", err);
  toast({
    title: "Error",
    description: err instanceof Error ? err.message : "Unexpected error",
    variant: "destructive",
  });
}
```

### Console Logging

Debug logging with `console.log()` is a **standard practice** in this codebase:

```typescript
console.log("Loading data:", data);
console.log("API response:", response);
console.log("User action:", actionType, payload);
```

## Important Patterns

### Authentication Flow

1. User logs in via `app/page.tsx`
2. Token stored in `localStorage.setItem("token", token)`
3. Role stored in `localStorage.setItem("role_name", role)`
4. API calls include token via `Authorization: Bearer ${token}`
5. Routes redirect based on role (admin vs user)

### Multi-Step Form Pattern

Used in therapeutics and drugs creation:

```typescript
// Context provides shared state
const FormContext = createContext<FormContextType | null>(null);

// Steps access via hook
function StepComponent() {
  const { formData, updateField, goToStep } = useFormContext();
  // ...
}
```

### Data Table Pattern

Using TanStack Table:

```typescript
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  // pagination, sorting, filtering configs
});
```

## Common Tasks

### Adding a New Page

1. Create folder in `app/admin/` or `app/user/`
2. Add `page.tsx` with default export
3. Add `layout.tsx` if needed for nested layout
4. Use `"use client"` directive for interactive pages

### Adding a New API Endpoint

1. Add function to `app/_lib/api.ts` under appropriate namespace
2. Follow existing pattern with proper error handling
3. Include types for request/response

### Adding a New Component

1. Create in `components/` directory
2. Use TypeScript interfaces for props
3. Follow shadcn/ui patterns if building on primitives
4. Include proper accessibility attributes

### Adding shadcn/ui Component

```bash
npx shadcn-ui@latest add [component-name]
```

### Working with Translations

Add keys to `locales/{en,es,fr}/translation.json`:

```typescript
import { useTranslation } from "react-i18next";

const { t } = useTranslation();
return <span>{t("common.save")}</span>;
```

## Things to Avoid

1. **Never modify `node_modules`** - Install packages properly
2. **Don't bypass the API client** - Always use `app/_lib/api.ts`
3. **Avoid inline styles** - Use Tailwind CSS classes
4. **Don't store sensitive data in localStorage** (except auth tokens)
5. **Don't commit `.env.local`** - Use `.env.example` for reference
6. **Avoid direct DOM manipulation** - Use React state and refs

## Build Configuration Notes

From `next.config.mjs`:
- **ESLint ignored during builds** (for development speed)
- **TypeScript errors ignored during builds** (for development speed)
- **Image optimization disabled** (external images used)
- **Standalone output** for Docker deployment

## Testing Guidance

Currently no test framework is configured. When adding tests:
- Consider Jest + React Testing Library
- Test API integration functions
- Test form validation logic
- Test component rendering

## Deployment

### Vercel (Primary)
```bash
npm run build
# Automatic deployment via Vercel
```

### Docker
```bash
docker build -t trialbyte-frontend .
docker run -p 3000:3000 trialbyte-frontend
```

### Production Environment Variables
```bash
NEXT_PUBLIC_API_BASE_URL=https://trialbyte-backend.98h6kpq3ehd7c.us-east-1.cs.amazonlightsail.com
EDGE_STORE_ACCESS_KEY=<key>
EDGE_STORE_SECRET_KEY=<secret>
```

## User Roles

| Role | Access |
|------|--------|
| Admin | Full access to `/admin/*` routes |
| User | Access to `/user/*` routes |

Role is determined at login and stored in `localStorage.role_name`.

## Recent Changes (as of Jan 2026)

- Login page UI updates with language translation support
- Sidebar hover effects
- Icon file path case fixes
- Major UI changes in admin and user sections
- AWS Lightsail deployment setup

## Quick Debugging Checklist

1. **API not working?**
   - Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
   - Verify backend is running
   - Check browser console for errors
   - Look for CORS issues

2. **Component not rendering?**
   - Add `"use client"` directive if using hooks/state
   - Check for TypeScript errors
   - Verify imports are correct

3. **Styles not applying?**
   - Ensure Tailwind classes are valid
   - Check `tailwind.config.ts` for custom values
   - Clear `.next` cache: `rm -rf .next`

4. **Build failing?**
   - Run `npm run lint` for quick checks
   - Check terminal for specific errors
   - Verify all imports resolve correctly

## Summary for AI Assistants

When working with this codebase:

1. **Always use the centralized API client** (`app/_lib/api.ts`)
2. **Follow existing patterns** - Check similar components/pages first
3. **Use Tailwind CSS** for all styling
4. **Add console.log** for debugging (project standard)
5. **Use shadcn/ui** components where possible
6. **Check types** - TypeScript is strict mode
7. **Test locally** with `npm run dev` before committing
8. **Respect role-based access** - Admin vs User routes are separate
