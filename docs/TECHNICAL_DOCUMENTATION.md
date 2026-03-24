# BioPropose — Technical Documentation

## Overview

BioPropose is a production-ready, GxP-compliant Biologics Proposal Management Platform built as a pnpm monorepo with:

- **Backend**: Node.js + Express + TypeScript + TypeORM
- **Frontend**: React 18 + Vite + Tailwind CSS + TanStack Query
- **Database**: SQLite (dev) / PostgreSQL (prod) / MSSQL (future)
- **Real-time collaboration**: Yjs + WebSocket
- **AI drafting**: Ollama local inference (gemma3:4b)
- **Export**: Puppeteer (PDF) + docx (Word)
- **Email**: Nodemailer (SMTP / SendGrid / SES / console)

---

## Architecture

```
ProposalManagement/
├── apps/
│   ├── api/                    # Express API server
│   │   └── src/
│   │       ├── config/         # env.ts, logger.ts
│   │       ├── middleware/     # errorHandler, requestLogger, validate
│   │       ├── validators/     # Zod schemas
│   │       ├── utils/          # stageAdvancement, proposalDiff
│   │       ├── services/       # Business logic layer
│   │       ├── controllers/    # Route handlers
│   │       ├── routes/         # Express routers
│   │       ├── ws/             # Yjs WebSocket server
│   │       ├── app.ts          # Express app setup
│   │       └── index.ts        # Entry point
│   └── web/                    # React frontend
│       └── src/
│           ├── components/     # UI components
│           ├── pages/          # Route pages
│           ├── stores/         # Zustand stores
│           ├── hooks/          # React Query + custom hooks
│           └── services/       # API client (axios)
├── packages/
│   ├── shared-types/           # Shared TypeScript enums & interfaces
│   └── database/               # TypeORM entities, DataSource, seed
└── docs/                       # Documentation
```

---

## Data Model

### ProposalEntity
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | string | Proposal title |
| client | string | Client organization |
| proposalCode | string | Unique code (e.g., PROP-2025-001) |
| status | enum | DRAFT / REVIEW / SENT / CLOSED |
| currentStage | enum | 1–5 (see Stage System below) |
| pmReviewComplete | boolean | PM review gate (Stage 4) |
| managementReviewComplete | boolean | Management review gate (Stage 4) |
| completionPercentage | number | 0–100 |
| isAmendment | boolean | Whether this is an amendment |
| parentProposalId | uuid? | Points to source proposal |
| assignedStakeholders | string[] | Email list (stored as JSON text) |
| createdBy / updatedBy | string | GxP audit fields |

### ProposalSectionEntity
Content stored as TipTap ProseMirror JSON in a TEXT column (`contentJson`) with getters/setters for cross-DB compatibility.

### AuditLogEntity
**Append-only** — only `@CreateDateColumn`, no update column. All state changes are recorded with `userEmail`, `userName`, `action`, `details`, optional `changes` JSON and `snapshot` JSON.

### CostItemEntity
Supports Service / Material / Outsourcing categories. `totalCost = quantity × (serviceRate + materialRate + outsourcingRate)`.

---

## Stage System (5-Stage Gating)

| Stage | Name | Advancement Criteria |
|-------|------|---------------------|
| 1 | Draft Creation | All sections marked `isComplete` |
| 2 | Technical Review | Manual advancement by Proposal Manager |
| 3 | PM Review | Manual advancement |
| 4 | Management Review | **Parallel**: both `pmReviewComplete` AND `managementReviewComplete` → auto-advance to Stage 5 |
| 5 | Client Submission | Terminal stage |

Stage advancement is validated in `src/utils/stageAdvancement.ts::validateStageAdvancement()`.

---

## API Endpoints

### Proposals
```
GET    /api/proposals                    # List with pagination/filter/search
POST   /api/proposals                    # Create
GET    /api/proposals/:id                # Get by ID (with sections + exports)
PUT    /api/proposals/:id                # Update metadata
DELETE /api/proposals/:id                # Soft-delete (status → CLOSED)
POST   /api/proposals/:id/advance-stage  # Stage gating
POST   /api/proposals/:id/amendment      # Create amendment
POST   /api/proposals/:id/reopen         # Reopen (clone/revise/new)
```

### Sections (nested under proposal)
```
GET    /api/proposals/:id/sections
GET    /api/proposals/:id/sections/:sectionKey
PUT    /api/proposals/:id/sections/:sectionKey
```

### Comments
```
GET    /api/proposals/:id/sections/:key/comments
POST   /api/proposals/:id/sections/:key/comments
PUT    /api/proposals/:id/sections/:key/comments/:commentId
DELETE /api/proposals/:id/sections/:key/comments/:commentId
```

### Costs
```
GET    /api/proposals/:id/costs          # Cost items
POST   /api/proposals/:id/costs          # Bulk save (delete + re-insert)
GET    /api/proposals/:id/costs/summary  # Aggregated by stage/category
GET    /api/proposals/:id/costs/timeline # Stages + activities
POST   /api/proposals/:id/costs/timeline # Bulk save timeline
```

### AI
```
GET    /api/ai/health                    # Ollama availability check
POST   /api/ai/draft                     # Non-streaming draft
POST   /api/ai/stream                    # SSE streaming draft
```

### Export
```
POST   /api/proposals/:id/exports/pdf    # Download PDF (binary)
POST   /api/proposals/:id/exports/word   # Download DOCX (binary)
```

### Analytics
```
GET    /api/analytics/kpis               # KPI summary (filterable)
GET    /api/analytics/stage-distribution
GET    /api/analytics/template-distribution
GET    /api/analytics/monthly-trends
GET    /api/analytics/cost-summary
GET    /api/analytics/recent-activity
```

---

## WebSocket Protocol (Yjs)

The WebSocket server runs on `PORT+1` (default: 3001). Clients connect to `ws://host:3001/<proposalId>-<sectionKey>`.

Binary message protocol:
- Byte 0 = `0`: Sync step 1 (send state vector)
- Byte 0 = `1`: Sync step 2 / update broadcast
- Byte 0 = `2`: Awareness update (cursor positions, user presence)

Documents are cleaned up 30 seconds after the last client disconnects.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DB_TYPE | sqlite | sqlite / postgres / mssql |
| DB_HOST | localhost | Database host (postgres/mssql) |
| DB_PORT | 5432 | Database port |
| DB_USER | - | Database username |
| DB_PASS | - | Database password |
| DB_NAME | biopropose | Database name |
| DB_SSL | false | Enable SSL for DB connection |
| PORT | 3000 | API server port |
| OLLAMA_BASE_URL | http://localhost:11434 | Ollama API endpoint |
| OLLAMA_MODEL | gemma3:4b | Model to use |
| OLLAMA_TIMEOUT | 120000 | Generation timeout (ms) |
| EMAIL_TRANSPORT | console | smtp / sendgrid / ses / console |
| EMAIL_FROM | - | Sender email address |
| SMTP_HOST | - | SMTP server host |
| SMTP_PORT | 587 | SMTP port |
| SENDGRID_API_KEY | - | SendGrid API key |
| EXPORT_DIR | ./exports | Directory for temp export files |
| CORS_ORIGIN | http://localhost:5173 | Allowed CORS origin |

---

## GxP Compliance Features

1. **Immutable audit trail**: AuditLog entity is append-only (no update timestamps), capturing every state change with user identity, timestamp, action, and diff
2. **Named user attribution**: All mutations require `createdBy`/`updatedBy` email in the request body
3. **Soft-delete only**: No hard deletes — status set to CLOSED
4. **Section locking**: Completed/reviewed sections can be locked to prevent edits
5. **Snapshot on creation**: Full proposal snapshot stored in audit log at creation
6. **Change detection**: Human-readable diff stored with every update (`proposalDiff.ts`)

---

## Frontend State Management

- **Zustand**: `authStore` (session identity), `proposalStore` (current proposal, active section, sidebar state)
- **TanStack Query**: All server state with 30-second stale time, automatic background refetch
- **Auto-save**: 2-second debounce on editor content changes (`useAutoSave` hook)
- **Real-time sync**: Yjs CRDT via WebSocket provider, conflict-free concurrent editing
