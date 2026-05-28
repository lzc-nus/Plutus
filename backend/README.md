# Plutus Backend

FastAPI backend for Plutus, the AI financial intelligence product by Two Sicilies.

The backend is designed around feature ownership, explicit API contracts, database migrations, and defense-in-depth validation. The current implemented domain is authentication; the structure is prepared for assets, transactions, portfolio views, calendar events, and AI insights.

## Responsibilities

The backend owns:

- API routing and versioning
- Request and response validation
- Authentication and JWT issuing
- Password hashing and verification
- Database sessions and persistence
- SQLModel table definitions
- Alembic schema migrations
- OpenAPI contract generation for frontend clients
- Health checks for API and database availability
- Protected-route dependencies for private user data

## Architecture Principles

The backend uses a feature-based structure.

- `app/main.py` creates the FastAPI application, middleware, lifespan startup behavior, and top-level router registration.
- `app/api/` contains shared API dependencies and versioned API router composition.
- `app/core/` contains infrastructure concerns such as settings and security helpers.
- `app/db/` contains runtime database session setup and SQLModel metadata registration.
- `app/features/` contains product domains. Each feature owns its router, schemas, service logic, and models when needed.
- `migrations/` contains Alembic migration history. It stays outside application runtime code.

## Authentication Boundary

The auth flow intentionally separates database models, network schemas, and business logic.

- `features/users/models.py` defines the `User` database table and internal fields such as `hashed_password`.
- `features/users/schemas.py` defines safe outbound user shapes such as `UserRead`.
- `features/auth/schemas.py` defines inbound auth request bodies and auth response contracts.
- `features/auth/service.py` performs duplicate checks, password hashing, password verification, and token creation.
- `features/auth/exceptions.py` defines auth-domain failures.
- `features/auth/router.py` translates domain results and exceptions into HTTP responses.

Implemented endpoints:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
```

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

## API Contract

FastAPI automatically publishes the API contract while the backend is running:

```text
http://127.0.0.1:8000/openapi.json
```

The frontend uses this contract to generate typed API functions and request/response types. Whenever an endpoint path, request schema, response model, status code, or `operation_id` changes, regenerate the frontend client:

```bash
cd ../frontend
npm run api:generate
```

When adding routes, document expected error responses in the FastAPI route metadata where practical. That keeps the generated frontend error types closer to real backend behavior.

## Environment

Create `backend/.env` locally. Do not commit it.

```env
APP_NAME=Plutus API
APP_VERSION=0.1.0
ENVIRONMENT=development

DATABASE_URL=postgresql+psycopg2://plutus:plutus@localhost:5432/plutus
SECRET_KEY=replace_with_a_32_byte_or_longer_secret

ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

ALLOWED_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000","http://localhost:3001","http://127.0.0.1:3001"]
```

Generate a local development secret:

```bash
openssl rand -hex 32
```

## Install

```bash
poetry install
```

## Local Database

The local backend expects PostgreSQL on `localhost:5432`.

Create the local Docker database if it does not exist:

```bash
docker run --name plutus-postgres \
  -e POSTGRES_USER=plutus \
  -e POSTGRES_PASSWORD=plutus \
  -e POSTGRES_DB=plutus \
  -p 5432:5432 \
  -v plutus_pgdata:/var/lib/postgresql/data \
  -d postgres:16
```

Start the database on later development sessions:

```bash
docker start plutus-postgres
```

Stop it when finished:

```bash
docker stop plutus-postgres
```

## Migrations

Apply migrations:

```bash
poetry run alembic upgrade head
```

Create a new migration after changing SQLModel table models:

```bash
poetry run alembic revision --autogenerate -m "describe schema change"
poetry run alembic upgrade head
```

Review generated migration files before committing them. SQLModel migrations may require `import sqlmodel` when generated columns reference `sqlmodel.sql.sqltypes.AutoString`.

`app/db/init_db.py` must import every SQLModel table class that Alembic should detect. Add new table models there when new feature tables are created.

## Run

```bash
poetry run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API docs:

```text
http://127.0.0.1:8000/docs
http://127.0.0.1:8000/redoc
http://127.0.0.1:8000/openapi.json
```

Health check:

```text
http://127.0.0.1:8000/health
```

The health endpoint runs a lightweight database query. It returns `200` when the API and PostgreSQL are reachable, and `503` when the database is unavailable.

Database errors raised during normal request handling are converted to `503 Service Unavailable` responses by the global SQLAlchemy exception handler in `app/main.py`.

## Tests

```bash
poetry run pytest
```

The auth tests use an in-memory SQLite database and override FastAPI's database dependency. They do not mutate the local PostgreSQL database.

## Future Feature Pattern

For each new backend feature, prefer this pattern:

- `models.py` for database tables owned by the feature
- `schemas.py` for request and response contracts
- `service.py` for business logic
- `exceptions.py` when the feature has domain-specific failure cases
- `router.py` for HTTP endpoints and status-code translation
- tests covering router behavior and service rules

For financial data, prefer precise numeric types such as `Decimal` for money values. Avoid `float` for persisted monetary amounts.

## Security Notes

- Never store raw passwords.
- Never return `hashed_password` in API responses.
- Never commit `.env` files or production credentials.
- Use `CurrentUser` from `app/api/deps.py` for protected user-owned resources.
- Keep authentication, authorization, and data ownership checks on the backend.
- Use separate databases for local development, staging, and production.
