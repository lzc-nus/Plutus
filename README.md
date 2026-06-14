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

ALLOWED_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000","http://localhost:3001","http://127.0.0.1:3001"]
```

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
- Use a strong `SECRET_KEY`, generated with Python `secrets` or `openssl rand -hex 32`.
- Keep production, staging, and local databases separate.
- Use backend authentication dependencies for every route that returns private user data.
- Treat frontend route guards as user experience protection, not as the final security layer.

## Credits

The authentication page lamp interaction was inspired by an open-source UI concept from Ilmah Code Hub. The implementation has been adapted for Plutus by Two Sicilies with custom branding, layout, styling, and application logic.
