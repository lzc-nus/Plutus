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
- AI insights, risk explanations, and strategy recommendations

The product should treat user financial data as sensitive by default. Frontend validation improves user experience, backend validation protects the API boundary, and database constraints preserve long-term data integrity.

## Technology

- Frontend: Next.js, React, TypeScript, Tailwind CSS, Zod
- Backend: FastAPI, SQLModel, Pydantic Settings, PyJWT, Alembic
- Database: PostgreSQL
- Local infrastructure: Docker for PostgreSQL
- Database inspection: DBeaver or `psql`
- API client generation: FastAPI OpenAPI schema and `@hey-api/openapi-ts`

## Local Development

Start the local PostgreSQL container:

```bash
docker start plutus-postgres
```

Start the backend API:

```bash
cd backend
poetry run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Start the frontend app in a separate terminal:

```bash
cd frontend
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
- Use a strong `SECRET_KEY`, generated with `openssl rand -hex 32`.
- Keep production, staging, and local databases separate.
- Use backend authentication dependencies for every route that returns private user data.
- Treat frontend route guards as user experience protection, not as the final security layer.

## Credits

The authentication page lamp interaction was inspired by an open-source UI concept from Ilmah Code Hub. The implementation has been adapted for Plutus by Two Sicilies with custom branding, layout, styling, and application logic.
