# TrialByte Frontend

A modern Next.js 15 application built with React 19, TypeScript, and Tailwind CSS for managing clinical trials, therapeutics, drugs, and user administration.

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **pnpm** package manager
- **Backend API** running (see backend README for setup)

## Getting Started

### 1. Clone the Repository

```bash
cd trialbyte-frontend-v1
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:5002

# NextAuth Configuration (if using authentication)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# UploadThing Configuration (if using file uploads)
UPLOADTHING_SECRET=your-uploadthing-secret
UPLOADTHING_APP_ID=your-uploadthing-app-id
```

**Note:** 
- Replace placeholder values with your actual credentials
- Never commit the `.env.local` file to version control
- The `NEXT_PUBLIC_` prefix makes variables available to the browser
- If `NEXT_PUBLIC_API_BASE_URL` is not set, it defaults to `http://localhost:5002` in development

### 4. Start Development Server

```bash
npm run dev
# or
pnpm dev
```

The application will be available at `http://localhost:3000`. The page will automatically reload when you make changes to the code.

## Available Scripts

- `npm run dev` - Start development server (Next.js dev mode)
- `npm run build` - Build production-ready application
- `npm run start` - Start production server (requires build first)
- `npm run lint` - Run ESLint to check code quality

## Project Structure

```
trialbyte-frontend-v1/
├── app/                    # Next.js App Router pages and layouts
│   ├── admin/             # Admin dashboard pages
│   │   ├── therapeutics/  # Therapeutic management
│   │   ├── drugs/         # Drug management
│   │   ├── approvals/     # Approval workflows
│   │   ├── role-management/ # Role management
│   │   └── ...
│   ├── user/              # User-facing pages
│   │   ├── clinical_trial/ # Clinical trial views
│   │   ├── drugs/         # Drug search and views
│   │   └── ...
│   ├── api/               # API routes (Next.js API handlers)
│   ├── _lib/              # Shared libraries and utilities
│   └── _types/            # TypeScript type definitions
├── components/            # React components
│   ├── ui/               # Reusable UI components (shadcn/ui)
│   └── ...               # Feature-specific components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and helpers
├── public/               # Static assets
├── styles/               # Global styles
├── next.config.mjs       # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## Key Technologies

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Component library (Radix UI based)
- **TanStack Query** - Data fetching and caching
- **TanStack Table** - Table component library
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **NextAuth** - Authentication
- **EdgeStore** - File storage
- **UploadThing** - File upload service

## Development Workflow

### Running the Development Server

```bash
npm run dev
```

The development server includes:
- Hot Module Replacement (HMR) for instant updates
- Fast Refresh for React components
- Error overlay for debugging
- TypeScript type checking

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `.next` directory.

### Starting Production Server

```bash
npm run start
```

**Note:** This requires running `npm run build` first.

## API Integration

The frontend communicates with the backend API. The API base URL is configured via:

1. `NEXT_PUBLIC_API_BASE_URL` environment variable
2. Defaults to `http://localhost:5002` in development
3. Falls back to `window.location.origin` if not set

API calls are made through the `app/_lib/api.ts` utility, which provides:
- Centralized API configuration
- Request/response interceptors
- Error handling
- Authentication token management

## Authentication

The application uses token-based authentication:
- Tokens are stored in `localStorage`
- User roles determine access to admin vs user routes
- Fallback credentials are available for development (see `app/page.tsx`)

## Styling

The project uses:
- **Tailwind CSS** for utility-first styling
- **CSS Modules** for component-specific styles
- **shadcn/ui** components for consistent UI
- **Dark mode** support via `next-themes`

## Component Development

### Using shadcn/ui Components

Components are located in `components/ui/`. To add new components:

```bash
npx shadcn-ui@latest add [component-name]
```

### Creating New Components

1. Create component file in `components/` directory
2. Use TypeScript for type safety
3. Follow existing component patterns
4. Use Tailwind CSS for styling
5. Add console.log statements for debugging (as per project standards)

## Debugging

### Console Logging

The project uses `console.log` for debugging. Check the browser console for:
- API request/response logs
- Component state changes
- Error messages
- Debug information

### TypeScript Errors

TypeScript errors will be shown in:
- Your IDE/editor
- Terminal during build
- Browser console (in development)

### Next.js Debugging

- Check terminal output for build errors
- Use React DevTools browser extension
- Check Network tab for API calls
- Review Next.js error overlay

## Common Development Tasks

### Adding a New Page

1. Create a new file in `app/` directory (or subdirectory)
2. Export a default React component
3. Use Next.js App Router conventions
4. Add routing as needed

### Adding a New API Route

1. Create a file in `app/api/` directory
2. Export route handlers (GET, POST, etc.)
3. Use Next.js API route conventions

### Working with Forms

- Use `react-hook-form` for form management
- Use `zod` for validation schemas
- Follow existing form patterns in the codebase

### Working with Tables

- Use `@tanstack/react-table` for table functionality
- See existing table implementations for patterns
- Use `@tanstack/react-query` for data fetching

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, Next.js will automatically try the next available port (3001, 3002, etc.).

### API Connection Issues

- Verify backend server is running on the correct port
- Check `NEXT_PUBLIC_API_BASE_URL` environment variable
- Verify CORS settings on backend
- Check browser console for error messages

### Build Errors

- Run `npm run lint` to check for code issues
- Verify all TypeScript types are correct
- Check for missing dependencies
- Clear `.next` directory and rebuild: `rm -rf .next && npm run build`

### Module Not Found Errors

- Run `npm install` to ensure all dependencies are installed
- Check import paths are correct
- Verify file extensions in imports (.ts, .tsx)

## Production Deployment

### Build Process

1. Set all required environment variables
2. Run `npm run build` to create production build
3. Test the build locally with `npm run start`
4. Deploy to your hosting platform (Vercel, Netlify, etc.)

### Environment Variables

Ensure all production environment variables are set:
- `NEXT_PUBLIC_API_BASE_URL` - Production API URL
- `NEXTAUTH_URL` - Production frontend URL
- `NEXTAUTH_SECRET` - Strong secret key
- Any other service-specific variables

### Optimization

Next.js automatically optimizes:
- Images (via `next/image`)
- Fonts
- JavaScript bundles
- CSS

Check `next.config.mjs` for additional optimization settings.

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
