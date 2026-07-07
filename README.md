# league-table-creator
This application basically for create fixtures and keep scores for your football league

## Firebase Google Sign-In deployment

This application uses the Firebase client SDK (`signInWithPopup`), not NextAuth/Auth.js.
`NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `AUTH_URL`, and `AUTH_SECRET` are therefore not used.

Copy `.env.example` to `.env.local` for local development. In Netlify, add the same
`NEXT_PUBLIC_FIREBASE_*` variables under **Site configuration > Environment variables**.
They must be available to the Build scope because Next.js embeds public variables in the
static bundle during `npm run build`. After adding or changing them, trigger a fresh deploy.

Required variables:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` (`simple-league-creator.firebaseapp.com`)
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (`simple-league-creator`)
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` is optional and only enables Analytics.

Firebase/Google configuration required for production:

1. In **Firebase Console > Authentication > Settings > Authorized domains**, add the
   production Netlify hostname only, for example `your-site.netlify.app` (no scheme/path).
   Add any custom production domain separately. Keep `localhost` for local development.
2. In **Firebase Console > Authentication > Sign-in method**, enable Google and select a
   support email.
3. If the OAuth client is managed manually in Google Cloud Console, its authorized redirect
   URI must include exactly:
   `https://simple-league-creator.firebaseapp.com/__/auth/handler`

The Netlify page URL is not the OAuth redirect URI for this Firebase popup flow. A redirect
URI such as `https://your-site.netlify.app/api/auth/callback/google` applies to NextAuth and
must not be used here. The Netlify hostname belongs in Firebase Authorized domains instead.

### Verification

Local: run `npm run dev`, open `http://localhost:3000`, sign in, select an account, sign out,
and sign in again.

Production: deploy after setting the Netlify variables, open the primary production URL
(not an unapproved deploy-preview URL), repeat sign-in/sign-out, and confirm the browser
console has no `auth/unauthorized-domain` or `auth/invalid-api-key` error. To test deploy
previews, authorize their exact hostnames in Firebase as well.
