# BioPropose — Developer Guide

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Runtime |
| pnpm | 9+ | Package manager |
| Ollama | Latest | Local AI (optional) |
| Docker | 24+ | Production deployment |

---

## Quick Start (Local Development)

### 1. Install dependencies
```bash
# From monorepo root
pnpm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env — defaults work for SQLite dev mode
```

### 3. Start Ollama (optional, for AI drafting)
```bash
ollama serve
ollama pull gemma3:4b
```

### 4. Run development servers
```bash
# Starts API (port 3000), WebSocket (port 3001), and Web (port 5173)
pnpm dev
```

The API server auto-creates the SQLite database and seeds template data on first run.

### 5. Open the app
- **Web app**: http://localhost:5173
- **API health**: http://localhost:3000/health
- **AI health**: http://localhost:3000/api/ai/health

---

## Development Workflow

### Running individual services
```bash
# API only
pnpm --filter api dev

# Web only
pnpm --filter web dev

# Build shared packages first if needed
pnpm --filter @biopropose/shared-types build
pnpm --filter @biopropose/database build
```

### Adding a new API endpoint
1. Add Zod schema to the appropriate validator file in `apps/api/src/validators/`
2. Add business logic to the appropriate service in `apps/api/src/services/`
3. Add controller method in `apps/api/src/controllers/`
4. Register route in `apps/api/src/routes/`
5. Mount route in `apps/api/src/app.ts` if creating a new router

### Adding a new entity
1. Create entity class in `packages/database/src/entities/`
2. Export it from `packages/database/src/index.ts`
3. Add it to the `entities` array in `packages/database/src/data-source.ts`
4. For SQLite dev: `synchronize: true` auto-creates the table
5. For production: create a migration with `pnpm --filter @biopropose/database migrate`

### Adding a new frontend page
1. Create the component in `apps/web/src/pages/`
2. Register the route in `apps/web/src/App.tsx`
3. Add navigation link in `apps/web/src/components/layout/Sidebar.tsx`

---

## Database Migrations (Production)

TypeORM migrations are used for production (PostgreSQL / MSSQL):

```bash
# Generate migration after entity changes
cd packages/database
pnpm ts-node -r tsconfig-paths/register src/migrate.ts generate -n MigrationName

# Run pending migrations
pnpm migrate

# Production
NODE_ENV=production pnpm migrate:prod
```

SQLite in development uses `synchronize: true` so no migrations are needed.

---

## Production Deployment

### Option A: Vercel + Supabase (Recommended)

**Backend (Supabase + Railway/Render)**:
1. Create a Supabase project → get `DATABASE_URL`
2. Deploy API to Railway or Render:
   ```bash
   # Set environment variables on Railway:
   DB_TYPE=postgres
   DB_HOST=<supabase-host>
   DB_USER=postgres
   DB_PASS=<supabase-password>
   DB_NAME=postgres
   DB_SSL=true
   NODE_ENV=production
   ```
3. Run migrations: `NODE_ENV=production pnpm --filter @biopropose/database migrate:prod`

**Frontend (Vercel)**:
1. Import your repo to Vercel
2. Set framework preset to Vite
3. Set build command: `pnpm --filter web build`
4. Set output directory: `apps/web/dist`
5. Update `apps/web/vercel.json` to point to your deployed API URL

### Option B: Docker Compose (Self-hosted)

```bash
# Build and start all services
docker compose up -d

# Pull the AI model (first time only)
docker compose exec ollama ollama pull gemma3:4b

# Check logs
docker compose logs -f api
```

### Option C: MSSQL (Enterprise)

Change environment variable:
```env
DB_TYPE=mssql
DB_HOST=your-mssql-server
DB_PORT=1433
DB_USER=sa
DB_PASS=your-password
DB_NAME=biopropose
DB_SSL=true
```

No code changes required — the DataSource is configured to support all three.

---

## Testing

```bash
# Run API tests
pnpm --filter api test

# Type-check everything
pnpm --filter '*' type-check
```

Tests use Jest. The test suite is configured with `--passWithNoTests` so the project builds even before tests are written.

---

## Common Issues

### "Cannot find module @biopropose/shared-types"
Build the shared packages first:
```bash
pnpm --filter @biopropose/shared-types build
pnpm --filter @biopropose/database build
```

### "Ollama connection refused"
Ensure Ollama is running: `ollama serve`
Check the model is pulled: `ollama list`

### SQLite "database is locked"
Only one process can write to SQLite at a time. Stop all dev servers and restart:
```bash
pnpm dev
```

### TypeORM "Entity metadata not found"
Ensure `reflect-metadata` is imported before any TypeORM usage. The `apps/api/src/index.ts` has `import 'reflect-metadata'` as the first line.

### Puppeteer PDF fails
Install system dependencies:
```bash
# Linux/Docker
apt-get install -y chromium-browser

# macOS
brew install --cask google-chrome
```

Or run in Docker where the Dockerfile installs Chromium via puppeteer's bundled installer.

---

## Project Structure Reference

```
apps/api/src/
├── config/
│   ├── env.ts              # Zod-validated env config
│   └── logger.ts           # Pino logger
├── middleware/
│   ├── errorHandler.ts     # AppError class + global error handler
│   ├── requestLogger.ts    # HTTP request logging
│   └── validate.ts         # Zod body/query validation middleware
├── validators/
│   ├── proposal.validators.ts
│   ├── section.validators.ts
│   └── cost.validators.ts
├── utils/
│   ├── stageAdvancement.ts # Stage gating business rules
│   └── proposalDiff.ts     # Change detection for audit logs
├── services/
│   ├── proposal.service.ts # Full proposal lifecycle
│   ├── section.service.ts  # Section CRUD + lock/complete
│   ├── cost.service.ts     # Cost items + timeline
│   ├── comment.service.ts  # Comments with author-only edit
│   ├── audit.service.ts    # Immutable audit log
│   ├── ai.service.ts       # Ollama integration (stream + batch)
│   ├── export.service.ts   # PDF (Puppeteer) + DOCX export
│   ├── email.service.ts    # Nodemailer multi-transport
│   └── analytics.service.ts # Dashboard KPIs
├── controllers/            # Thin HTTP handlers calling services
├── routes/                 # Express routers
└── ws/
    └── server.ts           # Yjs WebSocket server

apps/web/src/
├── components/
│   ├── layout/             # AppLayout, Sidebar, TopBar
│   ├── editor/             # SectionEditor (TipTap+Yjs), EditorToolbar, AiDraftPanel, CommentPanel
│   ├── proposals/          # StageAdvanceBar, AuditLogPanel, ExportModal
│   ├── cost/               # CostBreakdown
│   └── timeline/           # GanttTimeline
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── ProposalListPage.tsx
│   ├── NewProposalPage.tsx
│   └── ProposalDetailPage.tsx
├── stores/
│   ├── authStore.ts        # User session (persisted to localStorage)
│   └── proposalStore.ts    # UI state
├── hooks/
│   ├── useProposals.ts     # Proposal CRUD + mutations
│   ├── useSections.ts      # Section + comment hooks
│   └── useAutoSave.ts      # Debounced auto-save
└── services/
    └── api.ts              # Axios API client (typed)
```

---

## Contributing

1. Branch naming: `feature/description`, `fix/description`, `docs/description`
2. All service methods should log with `logger.info/error` using `[ServiceName]` prefix
3. All mutations must include `updatedBy: string` (user email) for GxP audit trail
4. No hard deletes — use soft-delete patterns (status = CLOSED or similar)
5. JSON columns: use TEXT + getter/setter pattern for SQLite/PostgreSQL/MSSQL compatibility
