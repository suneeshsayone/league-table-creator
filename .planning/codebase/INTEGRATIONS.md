# External Integrations

**Analysis Date:** 2026-06-24

## APIs & External Services

**Firebase Platform:**
- Firebase Authentication - Authenticates users with Google through a browser popup
  - SDK/Client: `firebase/auth` 11.10.0
  - Implementation: `src/lib/firebase.js` and `src/services/authService.js`
  - Auth: Firebase public configuration from `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, and `NEXT_PUBLIC_FIREBASE_APP_ID`
- Cloud Firestore - Persists users, tournaments, teams, fixtures, standings, and top scorers
  - SDK/Client: `firebase/firestore` 11.10.0
  - Implementation: `src/services/authService.js`, `src/services/tournamentService.js`, `src/services/teamService.js`, `src/services/fixtureService.js`, `src/services/standingService.js`, and `src/services/topScorerService.js`
  - Connection: Firebase project configuration in `src/lib/firebase.js`
- Google Analytics for Firebase - Initializes browser analytics only when the API is supported
  - SDK/Client: `firebase/analytics` 11.10.0
  - Implementation: `analyticsPromise` in `src/lib/firebase.js`
  - Configuration: `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

**Web Assets:**
- Google Fonts - Loads the Montserrat font at runtime from `fonts.googleapis.com`
  - Client: CSS `@import` in `src/app/globals.css`
  - Auth: None

## Data Storage

**Databases:**
- Google Cloud Firestore
  - Connection: Firebase public environment variables consumed by `src/lib/firebase.js`
  - Client: Modular Firebase Web SDK from `firebase/firestore`
  - Collections: `users` in `src/services/authService.js`; `tournaments`, `teams`, `fixtures`, `standings`, and `topScorers` in `src/services/*.js`
  - Access pattern: Real-time `onSnapshot` subscriptions for reads and `setDoc`, `deleteDoc`, and `writeBatch` for mutations
  - Ownership pattern: Tournament data is queried by `userId`; child records are additionally queried by `tournamentId`

**File Storage:**
- Not used - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` is passed into Firebase initialization in `src/lib/firebase.js`, but no Firebase Storage SDK or file operation is present

**Caching:**
- None detected - persistence and synchronization rely directly on Firestore subscriptions

## Authentication & Identity

**Auth Provider:**
- Firebase Authentication with Google Identity
  - Implementation: `GoogleAuthProvider`, `signInWithPopup`, `onAuthStateChanged`, and `signOut` in `src/lib/firebase.js` and `src/services/authService.js`
  - Account selection: Google sign-in always requests `select_account` in `src/lib/firebase.js`
  - Profile persistence: Successful sign-in upserts display name, email, photo URL, and timestamps into the Firestore `users` collection in `src/services/authService.js`
  - UI integration: Authentication state gates tournament subscriptions in `src/app/page.tsx`

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- Browser `console.error` is used for Google sign-in failures in `src/services/authService.js`
- Browser `console.error` is used for tournament subscription failures in `src/services/tournamentService.js`
- Firebase Analytics is initialized in `src/lib/firebase.js`, but no explicit custom analytics events are emitted

## CI/CD & Deployment

**Hosting:**
- Not detected - no Vercel, Netlify, Firebase Hosting, container, or other deployment configuration is present
- The available production interface is the standard Next.js `build` and `start` scripts in `package.json`

**CI Pipeline:**
- None detected - `.github/` contains only `code-review-graph.instruction.md`, with no workflow under `.github/workflows/`

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Required by the configuration guard in `src/lib/firebase.js`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Required by the configuration guard in `src/lib/firebase.js`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Required by the configuration guard in `src/lib/firebase.js`
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Required by the configuration guard in `src/lib/firebase.js`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Supplied to Firebase initialization in `src/lib/firebase.js`; storage is not otherwise used
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Supplied to Firebase initialization in `src/lib/firebase.js`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` - Supplies Firebase Analytics configuration in `src/lib/firebase.js`

**Secrets location:**
- `.env.local` is present for local environment configuration and `.env.example` documents the expected shape; neither file was read
- Production variables must be supplied by the deployment environment because no hosting configuration is committed
- The `NEXT_PUBLIC_` values are exposed to browser code and must not be treated as confidential credentials

## Webhooks & Callbacks

**Incoming:**
- None detected - the repository has no API routes, route handlers, server actions, or webhook endpoints

**Outgoing:**
- Firebase SDK calls from the browser to Authentication, Firestore, and Analytics services
- Browser font request to Google Fonts from `src/app/globals.css`
- No custom REST, GraphQL, or webhook client is detected

---

*Integration audit: 2026-06-24*
