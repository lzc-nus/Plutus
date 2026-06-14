# Plutus

Plutus is an AI financial intelligence product by Two Sicilies. The project combines a Next.js frontend, a FastAPI backend, and a PostgreSQL database to support private wealth tracking, portfolio visibility, transaction workflows, and future AI-assisted financial insight.

The current foundation focuses on authentication, local development workflow, database migrations, and a scalable structure for future product features.

## Product Direction

Plutus is being built as a dashboard for personal financial intelligence. The system is expected to grow around these core domains:

- Authentication and user accounts
- Assets and holdings
- Transactions and cash movement
- Portfolio summary and allocation views
- Calendar-based financial events
- Community features
- AI insights, risk explanations, and strategy recommendations

The product should treat user financial data as sensitive by default. Frontend validation improves user experience, backend validation protects the API boundary, and database constraints preserve long-term data integrity.

## Technology

- Frontend: Next.js, React, TypeScript, Tailwind CSS, Zod
- Backend: FastAPI, SQLModel, Pydantic Settings, PyJWT, Alembic
- Database: PostgreSQL
- Local infrastructure: Docker for PostgreSQL
- Database inspection: DBeaver or `psql`
- API client generation: FastAPI OpenAPI schema and `@hey-api/openapi-ts`

## Branching Workflow

Use `main` as the stable branch and `dev` as the integration branch.

For new features or refactors:

```text
dev -> feature-or-refactor-branch -> dev -> main
```

Create new work branches from `dev`. Merge completed work back into `dev`, run checks there, and only merge `dev` into `main` after the integrated branch is clean.

## Local Development

A fresh machine needs these tools installed before project commands will work:

- Docker Desktop or Docker Engine, with Docker running
- Python 3.14, matching `backend/pyproject.toml`
- Poetry
- Node.js 22.13 or newer, with npm

On Windows PowerShell, install the missing base tools first:

```powershell
winget install --id Docker.DockerDesktop -e
winget install --id Python.Python.3.14 -e
winget install --id OpenJS.NodeJS.LTS -e
```

Close and reopen PowerShell after those installers finish, then install Poetry:

```powershell
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | py -

$poetryBin = "$env:APPDATA\Python\Scripts"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$poetryBin*") {
  [Environment]::SetEnvironmentVariable("Path", "$userPath;$poetryBin", "User")
}
$env:Path += ";$poetryBin"
```

Start Docker Desktop before creating or starting the database container.

Check the tools before continuing:

```powershell
docker --version
docker info
py -3.14 --version
poetry --version
node --version
npm --version
```

Do not continue until those commands work. On macOS or Linux, use `python3.14 --version` instead of `py -3.14 --version`. If Python is installed as `python3` instead of `python3.14`, confirm `python3 --version` reports Python 3.14.x and use `python3` in the Poetry command below.

Install backend dependencies:

```powershell
cd backend
$python314 = py -3.14 -c "import sys; print(sys.executable)"
poetry env use $python314
poetry install
```

On macOS or Linux, use `poetry env use python3.14`.

Create `backend/.env`. Generate a local development secret:

```powershell
py -3.14 -c "import secrets; print(secrets.token_hex(32))"
```

Use the generated value for `SECRET_KEY`:

```env
APP_NAME=Plutus API
APP_VERSION=0.1.0
ENVIRONMENT=development

DATABASE_URL=postgresql+psycopg2://plutus:plutus@localhost:5432/plutus
SECRET_KEY=paste_generated_secret_here

ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SQL_ECHO=false

AUTH_COOKIE_NAME=plutus_access_token
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAMESITE=lax

ALLOWED_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000","http://localhost:3001","http://127.0.0.1:3001"]
```

Create `frontend/.env` only when you need to override the backend URL:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

If this variable is missing, frontend API helpers fall back to `http://127.0.0.1:8000`. Only use `NEXT_PUBLIC_` variables for values that are safe to expose in browser code.

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

Create the local PostgreSQL container:

```bash
docker run --name plutus-postgres -e POSTGRES_USER=plutus -e POSTGRES_PASSWORD=plutus -e POSTGRES_DB=plutus -p 5432:5432 -v plutus_pgdata:/var/lib/postgresql/data -d postgres:16
```

If Docker says the container name is already in use, the container already exists. Start it instead:

```bash
docker start plutus-postgres
```

Apply database migrations:

```bash
cd ../backend
poetry run alembic upgrade head
```

On later development sessions, start the existing PostgreSQL container:

```bash
docker start plutus-postgres
```

Start the backend API from `backend/`:

```bash
poetry run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Start the frontend app from `frontend/` in a separate terminal:

```bash
npm run dev
```

Open the app:

```text
http://localhost:3000
```

Open the backend docs:

```text
http://127.0.0.1:8000/docs
```

Check backend and database health:

```text
http://127.0.0.1:8000/health
```

`/health` returns `200` when the API can reach PostgreSQL and `503` when the database is unavailable.

## Database Workflow

The local database is PostgreSQL running in Docker. The default local connection is:

```text
postgresql+psycopg2://plutus:plutus@localhost:5432/plutus
```

Apply existing migrations after creating the local database or pulling new migration files:

```bash
cd backend
poetry run alembic upgrade head
```

Create a new migration only after changing SQLModel table models:

```bash
poetry run alembic revision --autogenerate -m "describe schema change"
poetry run alembic upgrade head
```

Do not create migrations for frontend changes, service-only changes, validation-message changes, or README edits.

Review generated migration files before committing them. SQLModel migrations may require `import sqlmodel` when generated columns reference `sqlmodel.sql.sqltypes.AutoString`.

`backend/app/db/init_db.py` must import every SQLModel table class that Alembic should detect. Add new table models there when new feature tables are created.

## Backend Reference

The backend owns API routing, request and response validation, authentication, JWT issuing, password hashing, database sessions, SQLModel table definitions, Alembic migrations, OpenAPI contract generation, health checks, and protected-route dependencies.

The backend follows a feature-based structure:

```text
backend/app/main.py                 FastAPI app, middleware, router registration
backend/app/api/                    Shared API dependencies and versioned router composition
backend/app/core/                   Settings and security helpers
backend/app/db/                     Database engine, sessions, metadata registration
backend/app/features/<feature>/     Feature-owned router, schemas, service, models
backend/migrations/                 Alembic migration history
```

Current API areas under `/api/v1`:

```text
POST   /auth/register
POST   /auth/login
GET    /users/me
GET    /transactions
POST   /transactions
GET    /calendar/events
POST   /calendar/events
PATCH  /calendar/events/{event_id}
DELETE /calendar/events/{event_id}
GET    /portfolio/assets
POST   /portfolio/assets
PATCH  /portfolio/assets/{asset_id}
DELETE /portfolio/assets/{asset_id}
GET    /portfolio/liabilities
POST   /portfolio/liabilities
PATCH  /portfolio/liabilities/{liability_id}
DELETE /portfolio/liabilities/{liability_id}
GET    /community/feed
GET    /community/feed/global
```

Community also includes authenticated post, comment, like, save, share, repost, follow, follower, and following endpoints. Use the OpenAPI docs for the full current contract.

The auth flow intentionally separates database models, network schemas, and business logic:

- `features/users/models.py` defines the `User` database table and internal fields such as `hashed_password`.
- `features/users/schemas.py` defines safe outbound user shapes such as `UserRead`.
- `features/auth/schemas.py` defines inbound auth request bodies and auth response contracts.
- `features/auth/service.py` performs duplicate checks, password hashing, password verification, and token creation.
- `features/auth/router.py` translates domain results and exceptions into HTTP responses.

Common auth responses:

```text
201 register success
200 login success
401 invalid login credentials
403 inactive account
409 duplicate email or username
422 invalid request body
```

Each public endpoint should use a stable `operation_id`. The frontend API client generator turns those operation IDs into TypeScript function names. For example, `auth_login` becomes `authLogin` in the generated frontend SDK.

When adding a backend feature, prefer this pattern:

```text
models.py       database tables owned by the feature
schemas.py      request and response contracts
service.py      business logic
exceptions.py   domain-specific failure cases when needed
router.py       HTTP endpoints and status-code translation
tests           router behavior and service rules
```

For financial data, prefer precise numeric types such as `Decimal` for money values. Avoid `float` for persisted monetary amounts.

The health endpoint runs a lightweight database query. It returns `200` when the API and PostgreSQL are reachable, and `503` when the database is unavailable. Database errors raised during normal request handling are converted to `503 Service Unavailable` responses by the global SQLAlchemy exception handler in `backend/app/main.py`.

Backend tests run with:

```bash
cd backend
poetry run pytest
```

The auth tests use an in-memory SQLite database and override FastAPI's database dependency. They do not mutate the local PostgreSQL database.

## API Contract Workflow

FastAPI exposes the backend contract at:

```text
http://127.0.0.1:8000/openapi.json
```

The frontend uses that OpenAPI contract to generate typed API functions and types under:

```text
frontend/src/lib/api/generated
```

Regenerate the frontend API client whenever backend endpoint paths, request bodies, response models, status codes, or `operation_id` values change:

```bash
cd frontend
npm run api:generate
```

Application code should call hand-written API wrappers such as `frontend/src/lib/api/auth.ts`, not generated files directly. Generated files should be treated as build artifacts produced from the backend API contract.

When adding routes, document expected error responses in the FastAPI route metadata where practical. That keeps the generated frontend error types closer to real backend behavior.

## Frontend Reference

The frontend owns the public landing experience, login and register screens, client-side validation, dashboard routing, route guarding, and typed API calls to the FastAPI backend.

The app uses the Next.js App Router:

```text
frontend/src/app/(public)/page.tsx                 /
frontend/src/app/(auth)/login/page.tsx             /login
frontend/src/app/(auth)/register/page.tsx          /register
frontend/src/app/dashboard/overview/page.tsx       /dashboard/overview
frontend/src/app/dashboard/transactions/page.tsx   /dashboard/transactions
frontend/src/app/dashboard/calendar/page.tsx       /dashboard/calendar
frontend/src/app/dashboard/portfolio/page.tsx      /dashboard/portfolio
```

Route groups such as `(auth)` and `(public)` organize files without adding those names to the URL.

Frontend scripts:

```bash
npm run dev
npm run dev:turbo
npm run build
npm run build:turbo
npm run start
npm run lint
npm run typecheck
npm run api:generate
```

`npm run dev` and `npm run build` use Webpack because Turbopack can currently panic or hang in this project. Use `npm run dev:turbo` or `npm run build:turbo` only when intentionally testing Turbopack behavior.

Use `npm run build` before opening a pull request or merging major frontend changes. Use `npm run api:generate` after backend API contract changes; the backend must be running at the OpenAPI URL configured in `frontend/openapi-ts.config.ts`.

Login and register pages validate form input with Zod before sending requests to the backend. The auth pages call hand-written API wrappers instead of generated SDK functions directly:

```text
page.tsx -> src/lib/api/auth.ts -> src/lib/api/generated -> FastAPI backend
```

Login sets an HttpOnly auth cookie from the backend. Browser code should not persist access tokens in local storage for authenticated sessions. The current cookie name is:

```text
plutus_access_token
```

The dashboard layout verifies the session through `/api/v1/users/me` and redirects unauthenticated users to `/login`. Frontend route guards are for user experience; private financial data must still be protected by backend dependencies and authorization checks.

The frontend API client is generated from FastAPI's OpenAPI schema using `@hey-api/openapi-ts`.

```text
src/lib/api/generated             generated API client and types
src/lib/api/configureClient.ts    backend base URL and bearer-token attachment
src/lib/api/auth.ts               hand-written auth wrapper
```

Do not hand-edit files under `src/lib/api/generated`. Regenerate them with:

```bash
cd frontend
npm run api:generate
```

The frontend uses Zod for immediate user feedback and cleaner form handling. The backend repeats validation with SQLModel and Pydantic schemas. This is intentional defense in depth:

```text
Zod: better browser UX
Backend schemas: trusted API boundary
Backend services: business rules
Database constraints: final data integrity
```

Keep frontend Zod schemas aligned with backend request schemas whenever auth or feature inputs change.

Frontend development notes:

- Prefer reusable components for shared dashboard and auth UI.
- Keep route pages focused on page composition and request orchestration.
- Keep validation schemas in `src/lib/validations`.
- Keep API helper code in `src/lib/api` as backend integration grows.
- Call hand-written API wrappers from pages and components; avoid importing from `src/lib/api/generated` outside the API layer.
- Avoid committing generated files such as `.next`, `node_modules`, `.DS_Store`, or local env files.

Dashboard sidebar icons are lightweight inline SVG shapes in `frontend/src/components/dashboard/Sidebar.tsx`. Prototype custom icons in a 24 by 24 SVG canvas, then copy only the inner SVG shapes into the sidebar `paths` map.

## Quality Checks

Backend tests:

```bash
cd backend
poetry run pytest
```

Frontend checks:

```bash
cd frontend
npm run lint
npm run typecheck
npm run build
```

## Development Session Shutdown

Stop frontend and backend dev servers with `Ctrl + C` in their terminals.

Stop the local PostgreSQL container when finished:

```bash
docker stop plutus-postgres
```

Stopping the container does not delete database data. The data is stored in the Docker volume created for PostgreSQL.

## Security Notes

- Do not commit `.env` files.
- Use a strong `SECRET_KEY`, generated with Python `secrets` or `openssl rand -hex 32`.
- Keep production, staging, and local databases separate.
- Keep `SQL_ECHO=false` outside deliberate local SQL debugging sessions.
- Use secure auth cookies in production. Leave `AUTH_COOKIE_SECURE` unset in production so it resolves to `true`, or set it explicitly to `true`.
- Use backend authentication dependencies for every route that returns private user data.
- Treat frontend route guards as user experience protection, not as the final security layer.

## Credits

The authentication page lamp interaction was inspired by an open-source UI concept from Ilmah Code Hub. The implementation has been adapted for Plutus by Two Sicilies with custom branding, layout, styling, and application logic.
