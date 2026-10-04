# Security Policy

## Supported Version

Security fixes are applied to the code deployed from `main`. Development work
is integrated through `dev` before promotion to `main`.

## Reporting a Vulnerability

Report suspected vulnerabilities privately through GitHub's private
vulnerability reporting for this repository when available. Do not open a
public issue containing exploit details, credentials, personal financial data,
or production configuration values.

Include the affected route or component, reproduction steps, expected impact,
and any suggested mitigation. Maintainers should acknowledge a report before
discussing public disclosure.

## Release Security Checks

Before a production release:

```bash
cd backend
poetry run ruff check app tests
poetry run pip-audit --local --skip-editable
poetry run pytest -q

cd ../frontend
npm audit --omit=dev --audit-level=high
npm run lint
npm run typecheck
npm run build
```

Production secrets belong in Render, Vercel, or Neon encrypted settings. Never
commit `.env` files, database credentials, signing keys, session cookies, API
keys, or exports containing user financial data.

Email verification codes are six digits, expire after 10 minutes, allow five
failed attempts, and are stored only as keyed digests. Resending is limited to
once per minute and invalidates the previous code.

Production mail on Render Free uses an HTTPS API because SMTP ports are blocked.
Prefer a dedicated transactional provider and keep its API key in Render. Gmail
API delivery must use only the `gmail.send` scope and a Production-published
OAuth app; Testing-mode refresh tokens expire after seven days. Revoke and
rotate any email credential that is exposed.
