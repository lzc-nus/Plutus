# Plutus Deployment

Plutus uses three managed services:

- Vercel hosts the Next.js frontend from `frontend/`.
- Render hosts the FastAPI backend from `backend/`.
- Neon provides the production PostgreSQL database.

Production credentials belong in the providers' encrypted environment settings. Never commit service tokens, database passwords, API keys, or production `.env` files.

## Release Flow

Promote tested work through the repository branches:

```text
feature or refactor branch -> dev -> main
```

Pull requests into `dev` and `main` must pass the repository CI workflow. Deploy production from `main` after reviewing migrations and environment changes.

Use this release order when a change includes a migration:

1. Create a Neon backup or restore point.
2. Run `poetry run alembic upgrade head` against the production database.
3. Deploy the Render backend and verify `/health` and `/openapi.json`.
4. Deploy the Vercel frontend and verify authentication and changed user flows.

The current financial-profile sharing migration is additive. Older application versions ignore its table, so the application can be rolled back without immediately downgrading the database.

## Neon

Create or select the production database and copy its PostgreSQL connection string into Render as `DATABASE_URL`. Use the SQLAlchemy driver prefix and require TLS:

```text
postgresql+psycopg2://USER:PASSWORD@HOST/DATABASE?sslmode=require
```

Use separate Neon branches or databases for production, previews, and local development. Do not point tests or preview deployments at production.

## Render Backend

Configure the Render web service with:

```text
Root directory: backend
Build command: pip install poetry && poetry install --only main --no-root
Start command: poetry run uvicorn app.main:app --host 0.0.0.0 --port $PORT
Health check path: /health
```

Configure a Render pre-deploy command when the service plan supports it:

```text
poetry run alembic upgrade head
```

Required production environment variables:

```text
ENVIRONMENT=production
DATABASE_URL=<Neon connection string>
SECRET_KEY=<random value with at least 32 bytes>
FRONTEND_ORIGIN=https://<production frontend host>
ALLOWED_ORIGINS=https://<production frontend host>
AUTH_COOKIE_NAME=plutus_access_token
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAMESITE=lax
ACCESS_TOKEN_EXPIRE_MINUTES=30
SQL_ECHO=false
```

Configure the optional OpenAI variables listed in `backend/.env.example` when AI features are enabled. Keep secrets in Render's encrypted environment settings.

After deployment, verify:

```text
GET /health             returns 200 with database=ok
GET /openapi.json       returns the current API contract
POST /api/v1/auth/login sets the secure HttpOnly cookie
```

## Vercel Frontend

Import the repository into Vercel and configure:

```text
Root directory: frontend
Framework preset: Next.js
Install command: npm ci
Build command: npm run build
```

Set the browser-safe environment variable for Production and the relevant Preview environments:

```text
NEXT_PUBLIC_API_URL=https://<production Render backend host>
```

The backend's `FRONTEND_ORIGIN` and `ALLOWED_ORIGINS` must exactly match the deployed frontend origin. Do not include a trailing slash.

## Post-deployment Checks

Verify these flows against the deployed frontend:

1. Register, sign in, refresh the page, and sign out.
2. Create and edit an asset, liability, and transaction.
3. Open Settings, create a financial-profile link, and view it in a signed-out browser.
4. Replace the link and confirm the old URL returns the unavailable state.
5. Turn off sharing and confirm the current URL is revoked.

Review Render and Vercel logs for unexpected `5xx` responses. If the backend cannot reach Neon, verify `DATABASE_URL`, Neon network availability, and migration state before retrying the release.
