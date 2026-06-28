# Deployment Guide

This app deploys as three separate pieces:

- PostgreSQL database
- FastAPI backend
- Next.js frontend

The frontend talks to the backend through `NEXT_PUBLIC_API_URL`. The backend talks to PostgreSQL through `DATABASE_URL` and to OpenAI through `OPENAI_API_KEY`.

## Preflight Checks

Run these before deploying:

```bash
cd backend
poetry check
poetry run pytest
poetry run alembic check

cd ../frontend
npm run lint
npm run typecheck
npm run build
```

Do not run `npm run typecheck` at the same time as `npm run build`; both commands can touch `.next/types`.

## Backend Environment

Set these in the backend hosting service, not in the frontend:

```env
ENVIRONMENT=production
DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@HOST:PORT/DATABASE
SECRET_KEY=<at-least-32-random-bytes>

FRONTEND_ORIGIN=https://app.your-domain.com
ALLOWED_ORIGINS=https://app.your-domain.com

ACCESS_TOKEN_EXPIRE_MINUTES=30
AUTH_COOKIE_NAME=plutus_access_token
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAMESITE=lax

OPENAI_API_KEY=<your-openai-key>
OPENAI_MODEL=gpt-5.4-mini
OPENAI_REASONING_EFFORT=low
OPENAI_MAX_OUTPUT_TOKENS=1200
OPENAI_REQUEST_TIMEOUT_SECONDS=30
OPENAI_STORE_RESPONSES=false
```

If the frontend and backend are on completely different sites, for example unrelated provider domains, use:

```env
AUTH_COOKIE_SAMESITE=none
AUTH_COOKIE_SECURE=true
```

Production config rejects insecure origins, localhost origins, wildcard CORS origins, short secrets, and insecure cookies.

## Backend Commands

Use Python 3.14, matching `backend/pyproject.toml`.

Install:

```bash
poetry install --only main
```

Run migrations before starting the app:

```bash
poetry run alembic upgrade head
```

Start:

```bash
poetry run uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

On Windows PowerShell locally, use `$env:PORT` instead of `$PORT`. Many hosting platforms inject `PORT` automatically.

## Frontend Environment

Set this in the frontend hosting service:

```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

Only put browser-safe values in frontend variables. Anything named `NEXT_PUBLIC_` is exposed to users in browser code.

## Frontend Commands

Use the Node version supported by the hosting platform and compatible with this repo's `package-lock.json`.

Install:

```bash
npm ci
```

Build:

```bash
npm run build
```

Start, if not using a managed Next.js platform:

```bash
npm run start
```

## API Client Generation

When backend routes or schemas change:

1. Start the backend.
2. Set `frontend/.env.local` so `NEXT_PUBLIC_API_URL` points to that backend.
3. Run:

```bash
cd frontend
npm run api:generate
```

The generated runtime client does not commit a local backend base URL. Runtime requests must go through `configureApiClient()`, which reads `NEXT_PUBLIC_API_URL`.

## Smoke Test

After deployment:

1. Open `https://api.your-domain.com/health`; expect `{"status":"ok","database":"ok"}`.
2. Open `https://api.your-domain.com/openapi.json`; expect JSON.
3. Open the frontend URL.
4. Register or log in.
5. Confirm `/api/v1/users/me` succeeds in the browser network tab.
6. Create or load portfolio data.
7. Generate an insight and confirm the overview page shows the saved risk score.
8. Generate a strategy memo.

If login succeeds but authenticated requests fail, check `FRONTEND_ORIGIN`, `ALLOWED_ORIGINS`, `AUTH_COOKIE_SECURE`, and `AUTH_COOKIE_SAMESITE`.

## Database Rule

The app imports SQLModel metadata on startup, but it does not create tables automatically. Alembic migrations are the source of truth. Always run:

```bash
poetry run alembic upgrade head
```

before serving production traffic.
