# AI Interview Simulator

An AI-powered interview preparation platform: upload your resume, get personalized mock
interviews, rubric-based answer evaluation, weakness detection, and a prioritized improvement
plan after every session.

**The loop:** analyze → generate → simulate → evaluate → improve.

## Tech stack

| Layer      | Technology                                                              |
| ---------- | ----------------------------------------------------------------------- |
| Frontend   | Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · shadcn-style UI · Framer Motion · TanStack Query · Zustand |
| Backend    | Node.js · Express · TypeScript · Zod · Pino                              |
| Database   | MongoDB Atlas (Mongoose 8)                                               |
| Auth       | JWT access tokens + rotating refresh tokens (httpOnly cookie, reuse detection) |
| AI         | Google Gemini (JSON mode, schema-validated, model tiering, retry/repair) |
| Testing    | Vitest · Supertest · mongodb-memory-server · deterministic mock AI provider |
| Deployment | Vercel (web) · Render (API) · Docker / docker-compose (local & anywhere) |

## Monorepo layout

```
ai-interview-simulator/
├─ apps/
│  ├─ api/          # Express REST API  (src/modules/* per domain, src/ai/* orchestration)
│  └─ web/          # Next.js 15 frontend (app router, route groups)
├─ packages/
│  └─ types/        # Shared TypeScript DTOs (single source of truth for the wire format)
├─ docker-compose.yml
├─ render.yaml      # Render blueprint for the API
└─ .github/workflows/ci.yml
```

## Quick start (local)

Prerequisites: Node 20+, and either a local MongoDB or Docker.

```bash
# 1. Install
npm install

# 2. Start MongoDB — any ONE of these:
#    a) you already run MongoDB as a service (check: it listens on 27017) → nothing to do
#    b) docker compose up -d mongo          (requires Docker Desktop running)
#    c) a free MongoDB Atlas cluster → put its URI in MONGODB_URI below

# 3. Configure the API   (Windows cmd: use `copy` and backslashes; PowerShell/bash: `cp`)
copy apps\api\.env.example apps\api\.env
#    - set MONGODB_URI (mongodb://localhost:27017/ai_interview_simulator for local)
#    - set JWT_ACCESS_SECRET / JWT_REFRESH_SECRET (32+ chars each):
#        node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
#    - set AI_PROVIDER=gemini + GEMINI_API_KEY, or AI_PROVIDER=mock to run without a key

# 4. Configure the web app (defaults are fine for local dev)
copy apps\web\.env.example apps\web\.env.local

# 5. (optional) Seed an admin account — prints the credentials
npm run seed:admin -w apps/api

# 6. Run both apps
npm run dev
# web → http://localhost:3000   api → http://localhost:4000
```

> **No Gemini key?** Set `AI_PROVIDER=mock`. The entire product loop (resume analysis,
> question generation, evaluation, summaries, plans) runs on a deterministic in-process
> provider — the same one the test suite uses.

### Full stack via Docker

```bash
docker compose up --build
```

## Testing

```bash
npm test            # API integration + unit tests (in-memory MongoDB, mock AI)
npm run typecheck   # all workspaces
```

Coverage includes: register/login, refresh-token rotation **and reuse detection**, ownership
scoping, the full interview loop (create → answer → adaptive follow-up → complete → summary +
plan), free-tier quota enforcement, resume analysis pipeline, and AI prompt↔schema contracts.

## Architecture notes (decisions worth knowing)

- **Stateless API** — JWT access tokens (15 min) carry `sub/role/plan`; horizontal scaling on
  Render needs no session store.
- **Refresh-token security** — 384-bit random tokens stored only as HMAC hashes, rotated on
  every use; presenting a revoked token revokes the whole token *family* (replay defense).
  The cookie is httpOnly, `Secure`, and path-scoped to `/api/v1/auth` only.
- **AI orchestration layer** — services depend on an `AIService` interface. `GeminiProvider`
  adds JSON mode, zod validation with a one-shot repair re-ask, exponential backoff on 429/5xx,
  and model tiering (fast model for generation, smart model for evaluation/summaries).
  `MockAIProvider` is a real, input-sensitive test double.
- **Prompt-injection guardrails** — resume/JD/answer text is wrapped in `<data>` delimiters and
  system prompts instruct the model to treat it as data, never instructions.
- **Server-side quota** — free-tier limits are enforced from `usageEvents` in the DB, not the
  client; every AI call is token-metered.
- **Deterministic math** — rubric averages and aggregate scores are computed in code; the model
  only writes narratives, never arithmetic the dashboard depends on.
- **Cookie-friendly deploys** — the web app proxies `/api/v1/*` to the API via a Next.js
  rewrite, so the refresh cookie is always same-origin (no third-party-cookie issues).

## API surface (v1)

Base: `/api/v1` — JSON envelope `{ success, data | error }`. Highlights:

| Area       | Endpoints |
| ---------- | --------- |
| Auth       | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`, `GET /auth/me` |
| Resumes    | `POST /resumes` (multipart), `POST /resumes/:id/analyze`, `GET /resumes`, `GET /resumes/:id`, `DELETE /resumes/:id` |
| Interviews | `POST /interviews`, `GET /interviews`, `GET /interviews/:id`, `POST /interviews/:id/start`, `GET /interviews/:id/next`, `POST /interviews/:id/answers`, `POST /interviews/:id/complete`, `GET /interviews/:id/summary`, `DELETE /interviews/:id` |
| Feedback   | `GET /answers/:id/evaluation`, `GET /improvement-plans`, `PATCH /improvement-plans/:id/items/:itemId` |
| Analytics  | `GET /dashboard/overview`, `GET /analytics/trends`, `GET /analytics/weaknesses` |
| Account    | `PATCH /account/profile`, `GET /account/usage`, `DELETE /account` (full right-to-erasure cascade) |

## Deployment

### API → Render
1. Push the repo to GitHub and create a **Blueprint** from `render.yaml` (or a Web Service with
   build `npm ci && npm run build:api`, start `node apps/api/dist/server.js`, health `/health`).
2. Set `MONGODB_URI` (Atlas), `GEMINI_API_KEY`, and `CORS_ORIGIN` (your Vercel URL).

### Web → Vercel
1. Import the repo; set **Root Directory** to `apps/web` and enable
   *“Include files outside the root directory”* (monorepo support).
2. Set env var `API_PROXY_TARGET=https://<your-render-service>.onrender.com`.

### Anywhere → Docker
Both apps ship production Dockerfiles (multi-stage, non-root, healthchecked):
`docker build -f apps/api/Dockerfile .` and `docker build -f apps/web/Dockerfile .` from the
repo root.

## Environment variables

See [apps/api/.env.example](apps/api/.env.example) and
[apps/web/.env.example](apps/web/.env.example) — every variable is documented there; none are
optional secrets hidden in code.

## Security checklist (implemented)

helmet headers · CORS allowlist · per-route rate limits (auth/AI/general) · bcrypt(12) ·
zod validation with `.strict()` schemas on every route · ownership scoping on every query ·
hashed refresh tokens + rotation + family revocation · file-type/size validation with
path-traversal-safe storage · structured logs with secret redaction · quota + token metering ·
no AI keys in the client · account deletion cascades all PII.

## License

MIT
