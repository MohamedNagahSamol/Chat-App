# Project: OBJ Chat MERN Application Stabilization & Polish

## Architecture
- **Backend**: Node.js + Express 5 (`"type": "module"`), Socket.io, Mongoose/MongoDB, Cloudinary.
  - Server entry: `backend/src/app.js` & `backend/src/Config/socket.js`.
  - Auth: JWT in httpOnly cookie + `Authorization: Bearer <token>` header support.
  - Database: `backend/src/Config/db.js` with resilient retry logic.
- **Frontend**: React 19 + Vite 8, Zustand, Axios, React Router 7, `@react-oauth/google`, Lucide icons.
  - Client API helper: `frontend/src/utils/axios.js`.
  - Deployment Gateway: `frontend/vercel.json` with reverse proxy rewrites for `/api` and `/uploads`.
  - Auth state: `frontend/src/store/authStore.js` storing JWT token and setting Axios Authorization headers.
- **Data Flow**:
  - Browser -> (Vercel Proxy / direct backend) -> Express CORS & Auth Middleware -> Controllers -> MongoDB / Socket.io.
  - Authentication tokens transmitted via both `Authorization: Bearer <token>` and `Cookie: jwt=<token>`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Backend CORS Preflight HTTP 200 | Return HTTP 200 on OPTIONS preflight with origin matching configured frontend, preview domains, and localhost | M1 | Survey Exp 1 (AC 1) |
| 2 | Backend Dual-Token Auth Support | Support both `req.cookies.jwt` and `Authorization: Bearer <token>` in authMiddleware; return 401 on malformed/expired token | M1 | Survey Exp 1 (AC 2) |
| 3 | Backend Database Resilience | Exponential backoff retry loop in db.js on connection failure; handle connection events; avoid process.exit(1) | M1 | Survey Exp 1 (R1) |
| 4 | Backend Cookie Hygiene | Add sameSite, secure, and path:"/" when clearing JWT cookie in deleteAccount controller | M1 | Survey Exp 1 (R1) |
| 5 | Vercel API Gateway Rewrites | Configure vercel.json rewrites for /api/(.*) and /uploads/(.*) to active backend instance with SPA fallback | M2 | Survey Exp 2 (AC 3) |
| 6 | Frontend Dynamic Axios Client | Refactor axios.js to support relative routing and configurable environment baseURL without falsy fallback trapping | M2 | Survey Exp 2 (R2) |
| 7 | Frontend Dual-Token Persistence | Store JWT token in localStorage in authStore; attach Authorization Bearer header via Axios request interceptor | M2 | Survey Exp 2 (AC 2) |
| 8 | Server Unreachable Error Handling | Detect network errors and offline backend in LoginPage and RegisterPage; display clear user-friendly notifications | M2 | Survey Exp 2 (AC 9) |
| 9 | Frontend ESLint Cleanup | Resolve React Hook useEffect missing dependencies warning in ProfilePage.jsx for 0-warning lint clean pass | M3 | Survey Exp 3 (AC 5) |
| 10 | Submit Button Loading States | Display visual spinners and disable form inputs/buttons during pending requests across auth, chat, and profile modal | M3 | Survey Exp 3 (AC 7) |
| 11 | Responsive Mobile 375px Polish | Eliminate Google button and layout overflow at 375px; ensure flawless rendering at 375px, 768px, and 1440px | M3 | Survey Exp 3 (AC 8) |
| 12 | Dark Mode, Contrast & A11y | Standardize CSS variables in ProfilePage; fix #64748b contrast; dark theme Google button; English locale; semantic landmarks & form labels | M3 | Survey Exp 3 (R3) |
| 13 | Backend API Test Suite Modernization | Fix conversation query logic in test_apis.js; add strict assertions; test Bearer tokens, CORS preflight, and profile routes; add npm test script | M4 | Survey Exp 1 & 3 (AC 6) |
| 14 | Full Stack Verification & Audit | Verify 0-error npm run build, 0-warning npm run lint, 100% test_apis.js pass, and all Acceptance Criteria satisfaction | M4 | Survey Exp 1, 2, 3 (AC 1-9) |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Backend Stability & CORS | CORS optionsSuccessStatus: 200, dynamic origin check, dual-token auth, db retry loop, cookie clear fix | none | DONE (Gate Iteration 2 Passed) |
| 2 | M2: Frontend Gateway & Auth Token | vercel.json rewrites, axios baseURL, authStore token persistence & Authorization header, offline error handling | M1 | DONE (Gate Iteration 3 Passed) |
| 3 | M3: UI/UX & Visual Styling Polish | Submit spinners/loading states, 375px/768px/1440px responsive fix, dark mode tokens & contrast, a11y labels/landmarks, ProfilePage lint fix | M2 | DONE (Gate Iteration 4 Passed) |
| 4 | M4: Automated Testing & Verification | Modernize backend/test_apis.js, backend npm test script, full verification of AC 1-9, build, lint, and forensic audit | M1, M2, M3 | DONE (Gate Iteration 5 Passed) |

## Interface Contracts
### Frontend ↔ Backend API
- **Endpoint**: `/api/auth/login`, `/api/auth/register`, `/api/auth/google`
  - Response: `{ success: true, message: string, token: string, user: object }`
  - Cookie: `jwt` set with `httpOnly: true, secure: true, sameSite: 'none', path: '/'`
- **Endpoint**: `/api/auth/check`
  - Request: Header `Authorization: Bearer <token>` OR Cookie `jwt=<token>`
  - Response (Success): `{ success: true, user: object }` (HTTP 200)
  - Response (Unauthorized / Expired): `{ success: false, message: string }` (HTTP 401)
- **CORS Preflight**:
  - Request: `OPTIONS /api/*` with `Origin` and `Access-Control-Request-Method`
  - Response: HTTP 200 OK, `Access-Control-Allow-Origin: <origin>`, `Access-Control-Allow-Credentials: true`, `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH,OPTIONS`, `Access-Control-Allow-Headers: Content-Type, Authorization`

## Code Layout
- Backend Source: `backend/src/`
  - Entry: `backend/src/app.js`, `backend/src/Config/socket.js`
  - Database: `backend/src/Config/db.js`
  - Middleware: `backend/src/middleware/authMiddleware.js`
  - Controllers: `backend/src/Controller/authController.js`, `backend/src/Controller/messageController.js`
  - Tests: `backend/test_apis.js`
- Frontend Source: `frontend/src/`
  - Routing & Config: `frontend/vercel.json`, `frontend/src/utils/axios.js`
  - State: `frontend/src/store/authStore.js`, `frontend/src/store/chatStore.js`
  - Pages: `frontend/src/pages/LoginPage.jsx`, `frontend/src/pages/RegisterPage.jsx`, `frontend/src/pages/ProfilePage.jsx`, `frontend/src/pages/ChatPage.jsx`
  - Components: `frontend/src/components/MessageInput.jsx`, `frontend/src/components/Sidebar.jsx`
  - Styles: `frontend/src/index.css`
