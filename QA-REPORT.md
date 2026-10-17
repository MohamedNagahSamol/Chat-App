# E2E QA Report - OBJ Chat

**Test target:** `http://localhost:5173`
**Date:** 2026-09-05
**Scope:** Initial render, auth navigation/forms, protected routing, invalid and empty input, rapid interactions, console/network inspection, responsive screenshots at 1440px, 768px, and 375px.
**Overall status:** **Needs Fixes** (no critical UI failure; auth integration has environment/integration defects).

## Summary

- **Page load:** Pass. The login page rendered with the OBJ Chat branding, email/password form, Google sign-in control, and Register link.
- **Navigation:** Pass for Login -> Register and direct `/chat` protection; unauthenticated `/chat` resolves to `/login`.
- **Form validation:** Pass for required fields and native email syntax validation.
- **Invalid credentials:** Pass from a user-feedback perspective; a `Login failed` toast is displayed and the user remains on login.
- **Rapid interactions:** Needs fix. Three immediate clicks produced three login requests and three error toasts.
- **Responsive layout:** Pass visually at 1440x900, 768x900, and 375x812. The auth card remained centered and usable without visible clipping or horizontal overflow.
- **Console/network:** Needs fix. Google Identity Services reports repeated initialization, and login preflight requests return HTTP 404.
- **Chat/profile happy paths:** Not executable without valid credentials or a test account; protected routing was verified instead.

## Console and network issues

### 1. Repeated Google Identity Services initialization (medium)

**Exact console message:**

```text
[GSI_LOGGER]: google.accounts.id.initialize() is called multiple times. This could cause unexpected behavior and only the last initialized instance will be used.
```

The warning appeared repeatedly during page navigation/reloads. It is not a blocking failure in this run, but it can produce unstable Google sign-in behavior and indicates duplicate initialization in development.

**Code references:**

- `frontend/src/main.jsx:1,8-12` wraps the app in `StrictMode` and `GoogleOAuthProvider`.
- `frontend/src/pages/LoginPage.jsx:5,56` mounts `GoogleLogin`.
- `frontend/src/pages/RegisterPage.jsx:5,68` mounts a second `GoogleLogin` route instance.

### 2. Repeated auth-check requests (medium)

The browser request log showed multiple requests to:

```text
GET https://chat-app-backend-production-c2e8.up.railway.app/api/auth/check
```

This occurred while entering auth routes and navigating to `/chat`. Duplicate calls are consistent with both route guards invoking `checkAuth` and React Strict Mode effect replay.

**Code references:**

- `frontend/src/components/AuthGuard.jsx:8-10`
- `frontend/src/components/ChatGuard.jsx:7-9`
- `frontend/src/store/authStore.js:8-13`
- `frontend/src/main.jsx:1,8-12`

### 3. Login CORS/preflight failures (high integration risk)

For invalid login attempts, the network log captured:

```text
POST https://chat-app-backend-production-c2e8.up.railway.app/api/auth/login
OPTIONS https://chat-app-backend-production-c2e8.up.railway.app/api/auth/login 404
```

The `OPTIONS` request returned HTTP 404. The UI still showed `Login failed`, but this can prevent real credentials from working from the local origin. The same 404 preflight pattern occurred for all three rapid login submissions.

**Code references:**

- `frontend/src/utils/axios.js:3-6` uses the Railway backend by default with `withCredentials: true`.
- `frontend/src/store/authStore.js:17-19` posts to `/api/auth/login`.

### 4. Non-error development messages

These messages were present and are informational rather than defects:

```text
[vite] connecting...
[vite] connected.
Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
```

Observed successful requests included the Vite modules, Inter font, Google client scripts, favicon, and the local document. No failed local static-asset request was observed.

## Functional findings

### F-01 - Rapid Sign In is not guarded against duplicate submission (medium)

**Steps to reproduce:**

1. Open `http://localhost:5173/login`.
2. Enter `qa-invalid@example.com` and `wrong-password`.
3. Click **Sign In** three times rapidly.

**Expected:** One request is sent; the button is disabled while the request is pending; one error message is shown.

**Actual:** Three `POST /api/auth/login` requests were emitted and three `Login failed` toast statuses were rendered.

**Likely root cause:** `frontend/src/pages/LoginPage.jsx:12-21` has no submitting state, and the submit button at line 50 is never disabled during `login()`.

**Recommended fix:** Add an `isSubmitting` state with `try/finally`; disable the submit button while pending and ignore subsequent submits. Apply the same pattern to registration and Google callbacks.

### F-02 - Login integration is blocked by a failing preflight (high)

**Steps to reproduce:**

1. Open the login page.
2. Submit any non-empty credentials.
3. Inspect network requests.

**Expected:** The backend accepts the CORS preflight and the login request returns a meaningful authentication response.

**Actual:** The browser reports `OPTIONS .../api/auth/login 404`; the UI falls back to a generic `Login failed` toast.

**Recommended fix:** Configure the backend to respond to `OPTIONS` for `/api/auth/*`, allow `http://localhost:5173`, allow credentials, and allow the required headers/methods. Verify the deployed API URL matches the local environment configuration.

### F-03 - Generic error feedback obscures transport/configuration failures (low/medium)

**Steps to reproduce:** Submit invalid credentials while the preflight is failing.

**Expected:** The user receives a specific but safe message distinguishing invalid credentials from service/network failure.

**Actual:** The toast only says `Login failed`.

**Code reference:** `frontend/src/pages/LoginPage.jsx:20`.

**Recommended fix:** Map authentication status separately from network/CORS errors and expose a retry-oriented message for connectivity failures without leaking backend details.

## Edge-case results

| Scenario | Result |
|---|---|
| Empty login submit | Pass. Browser alert: `Please fill out this field.` |
| Empty registration submit | Pass. Browser alert: `Please fill out this field.` |
| Invalid email (`not-an-email`) | Pass. Browser alert: `Please include an '@' in the email address. 'not-an-email' is missing an '@'.` |
| Short password | Client-side submission was blocked first by invalid email; no custom password rule was observed. |
| Rapid login clicks | Fail/needs fix: 3 requests and 3 toasts. |
| Direct `/chat` while unauthenticated | Pass: redirected to `/login`. |
| Unknown route | Route fallback is wired to `/chat`, then auth guarding resolves unauthenticated users to `/login`; no broken-page state observed. |

## UI/UX observations

- The dark theme is visually coherent, with a clear primary action and readable contrast for the form controls.
- At 1440px, the card is centered with generous whitespace; at 768px and 375px it remains within the viewport and the controls stay tappable.
- The Google button displays mixed English/Arabic text from the external Google Identity Services iframe. This is not controlled by the app and may look inconsistent with the English UI; explicitly set the Google locale if consistent localization is required.
- The page has no visible loading indicator during login submission, so users can click repeatedly and receive duplicate toasts (also related to F-01).
- Accessibility audit (`axe-core 4.12.1`) reported two violations:
  - **serious:** `link-in-text-block` for the Register link not being distinguishable without color alone.
  - **moderate:** `region`; headings, form inputs, divider, and paragraph are not contained in landmark regions.
- The auth form uses placeholder text as the visible field label. Inputs have accessible names in the browser tree, but persistent `<label>` elements would improve usability and error association.
- No broken local links were observed in the tested auth surface.

## Responsive evidence

Captured artifacts:

- `qa-initial.png`
- `qa-login-1440.png`
- `qa-login-768.png`
- `qa-login-375.png`
- `qa-register.png`

Observed at all requested widths: centered card, no visible clipping, no horizontal overflow, usable inputs/buttons, and intact Register navigation.

## Root-cause analysis

1. **Duplicate side effects:** Auth guards independently call the same store action on mount, while `StrictMode` intentionally replays effects in development. This explains the repeated `/api/auth/check` traffic and likely contributes to repeated Google initialization warnings.
2. **Missing request lifecycle state:** Login/register handlers await the store action but expose no pending state to the UI, so the submit controls remain active during in-flight requests.
3. **Backend/CORS mismatch:** The frontend defaults to a Railway API URL and sends credentialed cross-origin requests. The API is returning 404 for the login preflight, so browser policy can block the actual auth flow before application-level authentication is reached.
4. **Accessibility structure:** The auth page is composed primarily of a `div.auth-page`/`div.auth-card` hierarchy without semantic landmark wrappers; link styling relies mainly on accent color.

## Recommended fix priority

1. **P0/P1:** Fix backend CORS/preflight handling for local development and deployed frontend origins; verify a real login with valid test credentials.
2. **P1:** Add submit-pending state and button disabling to login/register; prevent duplicate Google callback submission.
3. **P1:** Centralize auth initialization/checking so each page load performs one check and Google is initialized once.
4. **P2:** Improve error classification and retry messaging for network versus invalid-credential failures.
5. **P2:** Add semantic landmarks and persistent labels; add a non-color distinction for inline links (underline or equivalent).

## Test limitations

A valid account was not available in the test session, so authenticated chat messaging, sidebar navigation, profile editing, media upload/viewing, logout, and socket behavior could not be exercised end-to-end. These areas remain unverified rather than marked as passing.
