# DevOps Lab – Student Project (Node.js + Jira/GitHub + CI/CD)

This repository is a **teaching template** for a 4-student DevOps mini-project.
It demonstrates a realistic workflow: **PLAN (Jira) → CODE (Git/VS Code) → BUILD/TEST (GitHub Actions) → REVIEW (PRs) → DEPLOY (optional)**.

> **What you get here**
> - Minimal **Express** API with auto-mounted routes
> - **Vitest + Supertest** for integration & unit tests
> - Coverage thresholds enforced in CI
> - **GitHub Actions** workflow for lint + tests + coverage artifact
> - Clear file layout for a team of 4

---

## Quickstart

```bash
npm ci
npm run dev          # http://localhost:3000
npm test -- --coverage
```

Open `coverage/index.html` for a visual coverage report (locally).

---

## Routes

- `GET /` – basic JSON greeting
- `GET /health` – health check (200 OK)
- `GET /version` – returns `{ version }` from `package.json`
- `GET /info` – returns `{ name, version, node, uptime }`
- `GET /boom` – triggers an error to test the global error handler

Routes are **auto-mounted** from `src/routes/auto/*.route.js` so each student can add a file without touching `src/app.js` (fewer merge conflicts).

---

## Tests

- **Integration tests** (Supertest) target HTTP endpoints in `test/*.test.js`.
- **Unit tests** target internal logic in `test/unit/*.test.js`.

Coverage thresholds (Lines/Functions/Statements ≥ 80%, Branches ≥ 70%) are set in `package.json`.  
If coverage drops below thresholds, CI fails and blocks the merge (quality gate).

---

## Branch & Commit Convention (Jira-friendly)

- Branch: `feature/<ISSUE-KEY>-<short-desc>` → e.g., `feature/SHMS-12-info-endpoint`
- Commit: `feat(<ISSUE-KEY>): <what>` → e.g., `feat(SHMS-12): implement /info endpoint`
- PR title: `<ISSUE-KEY> | <title>` → e.g., `SHMS-12 | Add /info endpoint`

If you install **GitHub for Jira**, issues will link automatically when the key appears in branch/commit/PR.

---

## CI (GitHub Actions)

A workflow is included at `.github/workflows/ci.yml` that runs on pushes and PRs to `main`:

- Install Node and deps
- `npm run lint`
- `npm test -- --coverage`
- Upload `coverage/` as an artifact

> Badge (enable after first run):
>
> ```md
> ![CI](https://github.com/<org>/<repo>/actions/workflows/ci.yml/badge.svg)
> ```

---

## Project layout

```
src/
  app.js          # Express app (auto-mount + global error handler)
  index.js        # server entry (not used by tests)
  routes/auto/    # students add *.route.js files here
  utils/          # small testable helpers
test/
  *.test.js       # integration (HTTP) tests
  unit/*.test.js  # pure unit tests
```

---

## Useful scripts

- `npm run dev` – start dev server with nodemon
- `npm test` – run all tests (Vitest)
- `npm test -- --coverage` – with coverage
- `npm run lint` – ESLint check

Enjoy the lab!


## Lab 6: Recruitment decisions

`PATCH /api/applications/:id/decision` updates the same in-memory applications
created by `POST /applications` and read through `GET /applications` or
`GET /applications/:id`. Existing routes and creation fields are unchanged.
Send JSON such as `{ "decision": "accepted" }`. Supported values are `accepted`,
`rejected` and `pending`. The existing application model starts at `pending`,
which also matches the BRD; the SDD's final values are `accepted` and `rejected`.
Success returns HTTP 200 with `id`, `status`, `decidedBy` and `decidedAt`.
Final decisions record the demo user ID and a server-generated ISO timestamp.
Returning to pending clears both final metadata fields to null. Presidents may
revise a decision; only the latest decision is retained in memory.
Invalid or missing decisions return 400; unknown or malformed IDs return 404.
Errors use the existing centralized error handler.

**Demonstration only, not production security:** no authentication system exists
in this project yet. This route requires `X-Demo-Role: president` and a nonempty
`X-Demo-User-Id` (for example `president-1`). Missing identity or another role
returns 403 before application lookup. These headers are client-controlled and
can be forged. Applications currently have no association ownership field, so
this demonstration checks role only and cannot restrict presidents to their own
association. Replace it with verified identity and association membership checks
before production use. Existing application GET routes remain unauthenticated.

The decision route accepts only the decision value and never stores request
notes, roles, or supplied decision metadata. Its response contains only decision
fields. There is currently no internal-notes storage feature; this change does
not add one. Full decision history, persistence and email notifications described
in the SDD remain future integrations.

To verify in Postman Desktop, run `npm start`, import
`postman/DeVinciRecruit.postman_collection.json`, and run the **Recruitment
Decisions (DEMO authentication only)** folder in order. `baseUrl` defaults to
`http://localhost:3000`. The first request creates a candidate with a unique email
and saves `applicationId`; subsequent requests exercise accepted, rejected,
pending, invalid (400), student forbidden (403), and missing application (404)
cases. The final GET checks the shared application's status. Requests include
status and response assertions. `demoPresidentId` supplies the recorded identity.
All data resets when the server restarts.


## Lab 6: Application Forms CRUD

Application forms are association-created questionnaires, separate from student
applications. The dedicated auto-mounted `forms.route.js` exposes:

| Method | Endpoint | Success |
| --- | --- | --- |
| GET | `/api/forms` | 200, array (initially empty) |
| GET | `/api/forms/:id` | 200, form |
| POST | `/api/forms` | 201, form and Location header |
| PUT | `/api/forms/:id` | 200, replacement form retaining its ID |
| DELETE | `/api/forms/:id` | 204, empty body |

Required fields are positive integer `associationId`, nonblank `title`, nonempty
`fields`, and `openDate` before `closeDate`. Optional `templateId` must be a
positive integer when supplied. Dates accept `YYYY-MM-DD` or UTC ISO timestamps
(`YYYY-MM-DDTHH:mm:ssZ`, with optional three-digit milliseconds).
The SDD does not specify the structure of individual fields; this implementation
uses unique, nonblank `name` and `type` in each field object. Supported types are
`text`, `textarea`, `email`, `number`, `date`, `select`, and `checkbox`. Optional
`label` must be nonblank and `required` must be boolean. Select fields require a
nonempty array of nonblank string `options`. Unknown properties are ignored.
PUT requires the complete model and removes an omitted optional templateId.
IDs are generated by the server and never reused during the process lifetime.
Validation failures return 400; unknown or malformed resource IDs return 404,
using the existing error handler. Data resets on restart.

No additional student submission endpoints were introduced. Recruitment
Decisions and the existing `/applications` endpoints retain their behavior.
`hasApplicationsForForm(formId)` reads the existing application array and blocks
form deletion or association reassignment with 409 when a reference exists.
The current student application creation route does not store formId, so existing
applications are unlinked. The teammate implementing Student Applications must
record formId and preserve/update this shared lookup if moving to another store.
The reference-protection test simulates that lookup contract; it does not claim
that the current submission API already supports linked applications.
Association and template IDs are validated structurally; this lab does not add
cross-entity existence checks or authentication to form routes. Field changes to
forms with applications remain possible; answer/schema versioning is future work.

In Postman Desktop, start the API with `npm start`, import the existing collection,
and run **Application Forms CRUD** in order: create, list, retrieve, update,
delete. POST saves a dedicated `formId`; Recruitment Decisions continues to use
`applicationId`. The folder includes JSON bodies and assertions, including a
404 check after deletion. Existing association and decision folders are preserved.
