# Plutus Backend

FastAPI backend for Plutus, the AI financial intelligence product by Two Sicilies.

## Architecture

The backend uses feature-based structure. Shared infrastructure lives in `core/`,
database connection code lives in `db/`, API version wiring lives in `api/`, and
business domains live in `features/`.

```text
app/
  main.py
  core/
    config.py
    security.py
  db/
    session.py
    init_db.py
  api/
    deps.py
    v1/
      router.py
  features/
    auth/
      exceptions.py
      router.py
      schemas.py
      service.py
    users/
      models.py
      schemas.py
      service.py
```

## Auth Boundaries

`features/users/models.py` is the database world. It owns the `User` SQLModel
table and stores internal fields such as `hashed_password`.

`features/users/schemas.py` is the public user network world. `UserRead` is safe
to return to clients and excludes password hashes.

`features/auth/schemas.py` contains auth request/response contracts:

```text
RegisterRequest  inbound account creation body
LoginRequest     inbound login body
TokenResponse    outbound bearer token body
```

`features/auth/service.py` contains auth business logic: duplicate checks,
password hashing, password verification, and token creation.

`features/auth/exceptions.py` contains auth-domain failures. The service raises
these exceptions, and the router translates them into HTTP status codes. This
keeps the business layer independent from FastAPI's network layer.

`features/auth/router.py` exposes HTTP endpoints:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
```

Common auth status codes:

```text
201 register success
200 login success
401 invalid login credentials
403 inactive account
409 duplicate email or username
422 invalid request body
```

## Local Setup

Install dependencies:

```bash
poetry install
```

Required environment variables:

```bash
DATABASE_URL=postgresql+psycopg2://orbital:orbital@localhost:5432/orbital
SECRET_KEY=dev-secret-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Run the API:

```bash
poetry run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open API docs:

```text
http://127.0.0.1:8000/docs
```

## Database Migrations

This project uses SQLModel for table models and Alembic for migrations.

Generate a migration after changing table models:

```bash
poetry run alembic revision --autogenerate -m "describe change"
```

Apply migrations:

```bash
poetry run alembic upgrade head
```

`app/db/init_db.py` imports SQLModel table classes so Alembic can discover
metadata. Do not use `SQLModel.metadata.create_all()` as the production schema
management path.

## Tests

Run tests:

```bash
poetry run pytest
```

The auth tests use an in-memory SQLite database and override FastAPI's database
dependency, so they do not mutate your local PostgreSQL database.
