# Technology Stack

**Analysis Date:** 2026-06-24

## Languages

**Primary:**
- TypeScript 5.9.3 - Next.js App Router UI, domain models, and league calculations in `src/app/*.tsx`, `src/types/league.ts`, and `src/lib/league.ts`
- JavaScript (ECMAScript modules) - Firebase initialization and persistence services in `src/lib/firebase.js` and `src/services/*.js`

**Secondary:**
- CSS - Global styling and the page-level CSS Module in `src/app/globals.css` and `src/app/page.module.css`
- JSON - Package metadata and compiler configuration in `package.json`, `package-lock.json`, and `tsconfig.json`

## Runtime

**Environment:**
- Node.js - No project version is pinned; the inspected development environment uses Node.js 24.13.0
- Browser - The primary application entry point is a client component (`"use client"`) in `src/app/page.tsx`

**Package Manager:**
- npm 11.6.2 in the inspected development environment; no `packageManager` field is declared in `package.json`
- Lockfile: present at `package-lock.json` using lockfile version 3

## Frameworks

**Core:**
- Next.js 15.5.19 - App Router application, development server, production build, and Node.js server; configured through `next.config.mjs`
- React 19.2.7 - Client rendering, hooks, and component state in `src/app/page.tsx`
- React DOM 19.2.7 - Browser DOM renderer used by Next.js
- Firebase 11.10.0 - Browser SDK for Authentication, Cloud Firestore, and Analytics in `src/lib/firebase.js` and `src/services/*.js`

**Testing:**
- Not detected - `package.json` has no test script or test dependency, and the repository contains no test configuration

**Build/Dev:**
- Next.js CLI 15.5.19 - `npm run dev`, `npm run build`, and `npm run start` scripts in `package.json`
- TypeScript 5.9.3 - Strict type checking with JavaScript interoperability enabled by `tsconfig.json`
- ESLint 9.39.4 - Repository linting through `npm run lint`
- eslint-config-next 15.5.19 - Next.js recommended and Core Web Vitals rules in `eslint.config.mjs`

## Key Dependencies

**Critical:**
- `next` 15.5.19 - Owns routing, bundling, metadata, and application runtime from `src/app/layout.tsx` and `src/app/page.tsx`
- `react` 19.2.7 - Owns all interactive state and effects in `src/app/page.tsx`
- `firebase` 11.10.0 - Provides the only persistent data store and authentication mechanism through `src/lib/firebase.js`

**Infrastructure:**
- `lucide-react` 0.468.0 - Supplies UI icons imported by `src/app/page.tsx`
- `@types/node` 22.19.19 - Node.js type definitions for build-time TypeScript support
- `@types/react` 19.2.16 and `@types/react-dom` 19.2.3 - React type definitions

## Configuration

**Environment:**
- Firebase browser configuration is read from `NEXT_PUBLIC_FIREBASE_*` variables in `src/lib/firebase.js`
- `.env.example` and `.env.local` are present; their contents are intentionally not read
- The application checks the API key, auth domain, project ID, and app ID before enabling authentication in `src/lib/firebase.js` and `src/app/page.tsx`
- All Firebase variables use the `NEXT_PUBLIC_` prefix and are therefore bundled as public browser configuration, not server-side secrets

**Build:**
- `next.config.mjs` exports the default empty Next.js configuration
- `tsconfig.json` targets ES2017, enables strict mode, allows JavaScript, uses bundler module resolution, and maps `@/*` to `src/*`
- `eslint.config.mjs` uses ESLint flat config with Next.js recommended and Core Web Vitals rules
- `next-env.d.ts` supplies generated Next.js TypeScript declarations

## Platform Requirements

**Development:**
- Install dependencies from `package-lock.json` with npm
- Provide Firebase public configuration through an uncommitted local environment file or shell environment
- Use a Node.js release supported by Next.js 15; the repository does not pin an exact Node.js version
- Run `npm run dev` for development and `npm run lint` for static analysis

**Production:**
- Build with `npm run build` and run the generated Next.js application with `npm run start`
- A Firebase project must provide Google Authentication, Cloud Firestore, and optional Analytics configuration
- No deployment platform, container image, or platform-specific production configuration is detected

---

*Stack analysis: 2026-06-24*
