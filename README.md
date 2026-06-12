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

  

This section provides a comprehensive guide to setting up and running Plutus locally from absolute scratch. Follow these sequential steps to configure your local operating environment.

  

### 1. Prerequisite Environment Setup (The Basics)

  

Before pulling the project dependencies, your local system needs a foundation for executing Python (Backend) and Next.js (Frontend) applications.

  

#### Step 1: Install Python and pip

  

`pip` is the default package installer for Python, and it comes bundled by default with modern Python installations.

  

* **Windows/macOS:** Download and run the official installer for **Python 3.11+** from [python.org](https://www.python.org/).

* **Crucial Step (Windows):** During installation, ensure you check the box that says **"Add python.exe to PATH"** before clicking install. If skipped, your system will not recognize terminal commands.

* **Verification:** Open a new terminal (Command Prompt, PowerShell, or macOS Terminal) and verify installation by running:

Bash

```
python --version
pip --version
```

  

#### Step 2: Install Poetry

  

Plutus utilizes `poetry` instead of standard `pip` files to handle advanced backend dependency structures and isolation tracking.

  

1. With Python and `pip` successfully running, execute this command in your terminal to install Poetry globally across your operating system:

Bash

```
pip install poetry
```

  

2. Verify that your system registers the Poetry binary path by running:

Bash

```
poetry --version
```

  

#### Step 3: Install Node.js and npm

  

The frontend dashboard requires Node.js runtime to compile UI components.

  

* Download and run the recommended **LTS Installer** from [nodejs.org](https://www.nodejs.org/). This will install both `node` and its companion package manager `npm` automatically.

* Verify your installation by running:

Bash

```
node --version
npm --version
```

  

### 2. Environment Configurations (`.env` Setup)

  

The application requires localized environment files containing core parameters to connect components together securely.

  

#### Backend Configuration

  

1. Navigate into the backend root folder and create a brand new file named exactly `.env`.

2. Open it with any text editor (like Notepad or VS Code) and paste the following parameters, modifying credentials to match your local setup:

  

```env
APP_NAME=Plutus API
APP_VERSION=0.1.0
ENVIRONMENT=development

DATABASE_URL=postgresql+psycopg2://plutus:plutus@localhost:5432/plutus
SECRET_KEY=YOUR_GENERATED_32_BYTE_HEX_SECRET

ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

ALLOWED_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```


> 🕒 **Session Lifecycle Management:** The `ACCESS_TOKEN_EXPIRE_MINUTES=30` parameter enforces a strict 30-minute idle system security boundary. After 30 minutes, token signatures stale out natively, causing the backend boundary to drop traffic with an HTTP 401 response and triggering an automatic frontend user logout layer.

  

3. Generate a Secure Cryptographic SECRET_KEY. Choose **one** of the methods below based on what you have installed to generate your token, then copy the output text into your backend `.env` file.

  

* **Method A: Using Python (Recommended / No Setup Required)**

Since you already have Python installed, open your terminal and run this single command. It will instantly print a secure, random 32-byte hexadecimal string:

Bash

```
python -c "import secrets; print(secrets.token_hex(32))"
```

  

* **Method B: Using OpenSSL (Alternative)**

If you have Git Bash, macOS, or Linux where OpenSSL is available out of the box, you can run this command instead:

Bash

```
openssl rand -hex 32
```

  

> ⚠️ **Configuration Action Item:** Copy the random string of characters generated by either command above, open your backend `.env` file, and replace `YOUR_GENERATED_32_BYTE_HEX_TOKEN` with that exact value. Do not share this token with anyone.

  

### 3. Database Infrastructure Setup (Choose Method A or B)

  

#### Method A: Using Docker (Isolated Container Environment)

  

This method keeps your database fully isolated inside a Docker container without mutating your local system configuration.

  

**Prerequisites:** Ensure `Docker` is installed and running on your machine.

  

**Initialization Command:**

  

Run the following command in your terminal to pull the official PostgreSQL 16 image, establish credentials, mount a persistent volume, and spin up the database container:

  

Bash

  

```
docker run --name plutus-postgres \
  -e POSTGRES_USER=plutus \
  -e POSTGRES_PASSWORD=plutus \
  -e POSTGRES_DB=plutus \
  -p 5432:5432 \
  -v plutus_pgdata:/var/lib/postgresql/data \
  -d postgres:16
```

  

#### Method B: Native System Installation (No Docker Required)

  

This method utilizes a traditional local database installation running natively as a system service.

  

**Prerequisites:** Ensure `PostgreSQL` (v16 or higher) is installed natively on your machine (via Homebrew on macOS, apt on Linux, or the official MSI installer on Windows).

  

**Service Activation:**

  

Verify or start your background PostgreSQL system service:

  

- _macOS (Homebrew):_ `brew services start postgresql@16`

- _Linux (systemd):_ `sudo systemctl start postgresql`

- _Windows:_
1. **Open the Windows Services Manager:** Press the **Windows Key + R** on your keyboard to open the Run dialog box. Type `services.msc` into the box and press **Enter**.

  

2. **Locate the PostgreSQL Service:** Scroll down through the alphabetical list until you find the service named **`postgresql-x64-<version>`** (for example, *postgresql-x64-15* or *postgresql-x64-16*).

  

3. **Verify and Start the Service:** * Look at the **Status** column for that row. If it is blank or says "Stopped", right-click on the PostgreSQL service name and click **Start**.

* Look at the **Startup Type** column. Ensure it says **Automatic**. If it doesn't, right-click, select *Properties*, change the Startup Type dropdown to *Automatic*, and click *Apply*. This ensures the database starts up by itself every time you turn on your computer.

  

4. **Confirm the Network Port:** By default, PostgreSQL opens network port `5432` to receive incoming ledger data from your FastAPI application. If you changed this port to something else during your initial PostgreSQL installation wizard, you must update the `5432` portion of your `DATABASE_URL` string inside your backend `.env` file to match it perfectly.

  

**Database Provisioning:**

  

Open your terminal and access your native interactive PostgreSQL shell (`psql`) as an administrative user:

  

Bash

  

```
psql postgres
```

  

Inside the `psql` prompt, execute the following SQL statements to construct the role and database instance required by the Plutus configuration matrix:

  

SQL

  

```
CREATE USER plutus WITH PASSWORD 'plutus';
CREATE DATABASE plutus OWNER plutus;
GRANT ALL PRIVILEGES ON DATABASE plutus TO plutus;
\q
```

  

### 4. Core Backend Deployment & Migrations

  

With your preferred database infrastructure active and listening on port `5432`, synchronize the Python package ecosystem and execute your structural database migrations.

  

Bash

  

```
# 1. Navigate to the backend directory
cd backend

# 2. Install dependencies via Poetry
poetry install

# 3. Apply structural Alembic migrations to construct database tables
poetry run alembic upgrade head

# 4. Fire up the hot-reloading Uvicorn development server
poetry run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

  

- **Active Swagger Docs URL:** `http://127.0.0.1:8000/docs`

- **System Health Status Pulse:** `http://127.0.0.1:8000/health` (Returns HTTP 200 when database handshakes succeed)  

  

### 5. Frontend Client Deployment & SDK Sync

  

Open a new, separate terminal window to launch the Next.js user interface.

  

Bash

  

```
# 1. Navigate to the frontend workspace
cd frontend

# 2. Install NPM packages
npm install

# 3. Compile the TypeScript client SDK from the live backend OpenAPI spec contract
npm run api:generate

# 4. Ignite the local React development network node
npm run dev
```

  

- **Active User Interface Client URL:** `http://localhost:3000`

  
  

### 6. Development Session Shutdown

  

When pausing your active development session, systematically spin down services to prevent file lockups or orphan process states:

  

1. Terminate the Next.js and FastAPI runtime nodes by entering `Ctrl + C` in their respective terminal panes.

2. Stop your database framework according to your chosen installation method:

    - **If using Method A (Docker):** `docker stop plutus-postgres` (Preserves data within the Docker volume).

    - **If using Method B (Native):** Leave it running, or gracefully stop the service (_macOS:_ `brew services stop postgresql@16` / _Linux:_ `sudo systemctl stop postgresql`).

  

### Sidenote: Strategic Security & Data Isolation Protocols

  

Because Plutus governs highly sensitive personal financial data, developers must strictly adhere to the following zero-trust engineering principles across all environments:

  

- **Cryptographic Secret Isolation:** Never commit localized configuration boundaries (`.env`, `.env.local`, or `.env.production`) to version control tracking. All production environment variables must be injected at the infrastructure orchestrator layer.

  

* **Strict Database Environment Partitioning:** Local development databases, staging sandboxes, and production data tables must operate on entirely isolated server clusters and separate network VPCs to prevent cross-contamination or accidental drift operations.

  

* **Authoritative API Boundary Verification:** Frontend route guards (such as Next.js middleware blocks) function exclusively as **User Experience Protection** to smoothly redirect clients; they do not constitute a true perimeter defense layer. The **Final Security Layer** must be explicitly enforced at the FastAPI boundary by injecting secure authentication dependencies (`get_current_user`) into *every single route* that queries or modifies private user information.

  

## Credits

  

Special recognition is given to **Ilmah Code Hub** for providing the foundational, interactive workspace lamp concept that inspired the aesthetic direction of our authentication gate. The architecture has been completely rewritten, custom-tailored, and re-branded to comply with Plutus private wealth design rules and operational business validation workflows.