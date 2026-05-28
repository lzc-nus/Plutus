# Plutus Frontend

Next.js frontend for Plutus, the AI financial intelligence product by Two Sicilies.

The frontend provides the public landing experience, authentication screens, and the authenticated dashboard shell. It is prepared to grow around portfolio, assets, transactions, calendar, settings, AI insight, and strategy workflows.

## Responsibilities

The frontend owns:

- Public landing and product narrative
- Login and register screens
- Client-side form validation with Zod
- Auth token storage for the current local-development flow
- Dashboard routing and route guarding
- User-facing financial dashboard components
- API calls to the FastAPI backend

## Environment

Create `frontend/.env` locally when you need to override the backend URL.

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

If this variable is missing, the auth pages currently fall back to:

```text
http://127.0.0.1:8000
```

Because this value is exposed to browser code, only use `NEXT_PUBLIC_` variables for values that are safe to expose publicly.

## Install

```bash
npm install
```

## Run

Start the frontend dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The backend should be running separately at:

```text
http://127.0.0.1:8000
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

Use `npm run build` before opening a pull request or merging major frontend changes.

## Routing Model

The app uses the Next.js App Router.

- `(public)` contains the landing page experience.
- `(auth)` contains login and register pages.
- `dashboard` contains authenticated product pages.

Route groups such as `(auth)` and `(public)` organize files without adding those names to the URL.

Examples:

```text
frontend/src/app/(public)/page.tsx   -> /
frontend/src/app/(auth)/login/page.tsx -> /login
frontend/src/app/dashboard/overview/page.tsx -> /dashboard/overview
```

## Authentication Flow

Login and register pages validate form input with Zod before sending requests to the backend.

Current auth endpoints:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
```

Login stores the returned access token in local storage under:

```text
plutus_access_token
```

The dashboard layout checks for this token and redirects unauthenticated users to `/login`.

Important: frontend route guards are for user experience. Private financial data must still be protected by backend dependencies and authorization checks.

## Validation Strategy

The frontend uses Zod for immediate user feedback and cleaner form handling.

The backend repeats validation with SQLModel and Pydantic schemas. This is intentional defense in depth:

```text
Zod: better browser UX
Backend schemas: trusted API boundary
Backend services: business rules
Database constraints: final data integrity
```

Keep frontend Zod schemas aligned with backend request schemas whenever auth or feature inputs change.

## Development Notes

- Prefer reusable components for shared dashboard and auth UI.
- Keep route pages focused on page composition and request orchestration.
- Keep validation schemas in `src/lib/validations`.
- Keep API helper code in `src/lib` as backend integration grows.
- Avoid committing generated files such as `.next`, `node_modules`, `.DS_Store`, or local env files.

## Credits

The authentication page lamp interaction was inspired by an open-source UI concept from Ilmah Code Hub. The implementation has been adapted for Plutus by Two Sicilies with custom branding, layout, styling, and application logic.
