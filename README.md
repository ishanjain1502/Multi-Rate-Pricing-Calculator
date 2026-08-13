# crossVal — Multi-Rate Pricing Calculator

A full-stack web app for creating documents with line items, applying per-line discounts and tax, computing totals server-side, and managing a **draft → finalized** document lifecycle. Built as the CrossVal take-home assignment

## Live deployment

> **Not deployed yet.** Add the public URL here before submission.

## What’s implemented

| Area | Status |
|------|--------|
| Sign up / log in (email + password) | Done |
| Per-user data isolation | Done |
| Documents + line items CRUD | Done |
| Server-side calculations (single pure module) | Done |
| Integer-cent money handling | Done |
| Draft / finalized lifecycle + API immutability | Done |
| REST API with Zod validation | Done |
| Calculation unit tests (server + client mirror) | Done |
| Next.js UI (list, editor, read-only view) | Done |
| **Summary report** (date-range aggregates + FX conversion) | Done |
| Stretch: duplicate finalized → draft | Not implemented |
| Stretch: finalize validation | Not implemented |
| Stretch: printable HTML/PDF view | Not implemented |

## Tech stack

| Layer | Choice |
|-------|--------|
| API | Node.js, Express, TypeScript |
| Database | MongoDB via Mongoose |
| Auth | JWT (`Authorization: Bearer`), bcrypt passwords |
| Validation | Zod (request schemas + shared types) |
| Client | Next.js 16, React 19, Tailwind CSS 4 |
| Tests | Vitest (server integration + calculation tests; client lib tests) |

## Project structure

```
crossVal/
├── client/                 # Next.js app (port 3000)
│   ├── app/                # App Router pages
│   ├── components/         # Auth + document UI
│   └── lib/                # API client, money helpers, lineCalc mirror
├── server/                 # Express API (port 3001)
│   ├── src/
│   │   ├── calculations/   # Pure pricing logic (no HTTP/DB)
│   │   ├── services/       # documentService, authService
│   │   ├── routes/         # REST endpoints
│   │   ├── schemas/        # Zod validation
│   │   └── models/         # Mongoose models
│   └── scripts/
│       └── devMemoryMongo.mjs  # Local dev without external Mongo
├── docs/
│   └── multi-rate-pricing-calculator.pdf
└── start-dev.sh            # Boots API + client together
```

Design notes and API details live in `docs/superpowers/specs/` (document lifecycle and UI design).

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm**
- **MongoDB** with a replica set (required for Mongoose transactions), **or** use the in-memory dev script below

## Setup

### Quick start (API + client)

From the repo root:

```bash
./start-dev.sh
```

This installs dependencies if needed, starts the API, waits for `/api/health`, then starts the Next.js dev server.

- Client: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:3001](http://localhost:3001)

### API only (no external Mongo)

For local development without Docker or Atlas, use an ephemeral in-memory replica set:

```bash
cd server
npm install
node scripts/devMemoryMongo.mjs
```

### API with your own MongoDB

1. Copy env template and edit values:

   ```bash
   cd server
   cp .env.example .env
   ```

2. Ensure `MONGO_URI` points at a replica set (see comment in `.env.example`).

3. Start the API:

   ```bash
   npm run dev
   ```

### Client only

```bash
cd client
npm install
npm run dev
```

Optional: set `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3001`).

### Environment variables (server)

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3001` | API listen port |
| `MONGO_URI` | — | MongoDB connection string (replica set) |
| `JWT_SECRET` | `dev-secret-change-me` | JWT signing key |
| `JWT_EXPIRES_IN` | `15d` | Token lifetime |
| `BCRYPT_ROUNDS` | `10` | Password hashing cost |

## Running tests

```bash
cd server && npm test    # 69 tests — calculations, reports, services, routes
cd client && npm test    # money + lineCalc mirror tests
```

## Calculation and rounding policy

### Money representation

All monetary amounts are **integer cents** end-to-end (API, database, calculation module). Example: `$100.00` → `10000` cents. The UI accepts dollar strings (`100.00`) and converts before sending to the API.

**No floating-point dollars** are used in calculations or persistence.

### Per-line algorithm

The single source of truth is `server/src/calculations/`:

```
quantity × unitPrice  →  subtotal
        ↓
   discount (percent OR fixed — never both)
        ↓
   discounted amount
        ↓
   tax on discounted amount
        ↓
   line total
```

Document totals sum the stored per-line results:

- **Subtotal** — sum of line subtotals (before discounts)
- **Total discount** — sum of line discount amounts
- **Total tax** — sum of line tax amounts
- **Grand total** — sum of line totals

### Rounding

Rounding happens **per line**, to the nearest cent (`Math.round`), at two steps:

1. **Percent discount** — `round(subtotal × percent / 100)`
2. **Tax** — `round(discountedAmount × taxPercent / 100)`

Line total is `discountedAmount + taxAmount` (no extra rounding on the sum).

Document aggregates are **simple integer sums** of line fields (no second rounding pass).

### Discount rules

1. Discount is applied **before** tax.
2. Tax is computed on the **discounted** amount (not the pre-discount subtotal).
3. Each line has **at most one** discount: percent **or** fixed, not both (`discounts` array max length 1).
4. **Fixed discount above subtotal** — **clamped** to the line subtotal (not rejected). A warning is recorded in the calculation result (`DISCOUNT_CLAMPED`).
5. **Percent discount above 100%** — **capped at 100%** with the same warning code.

Currency is set on the **document** only (line-level currency was removed).

### Worked example (assignment sample)

All values in cents internally; dollars shown for readability.

| Line | Qty | Unit price | Discount | Tax |
|------|-----|------------|----------|-----|
| Widget A | 2 | $100.00 | 10% | 5% |
| Widget B | 1 | $50.00 | — | 5% |
| Service fee | 1 | $200.00 | $20 fixed | — |

**Widget A**

- Subtotal: `2 × 10000 = 20000` ($200.00)
- Discount: `round(20000 × 10 / 100) = 2000` ($20.00)
- After discount: `18000` ($180.00)
- Tax: `round(18000 × 5 / 100) = 900` ($9.00)
- Line total: `18900` ($189.00)

**Widget B** — subtotal 5000, discount 0, tax `round(5000 × 5 / 100) = 250`, total 5250 ($52.50)

**Service fee** — subtotal 20000, fixed discount 2000, tax 0, total 18000 ($180.00)

**Document totals**

| Field | Cents | Dollars |
|-------|-------|---------|
| Subtotal | 45000 | $450.00 |
| Total discount | 4000 | $40.00 |
| Total tax | 1150 | $11.50 |
| Grand total | 42150 | $421.50 |

Verified by `server/src/calculations/calculate.test.ts` and `client/lib/__tests__/lineCalc.test.ts`.

The client’s `lib/lineCalc.ts` mirrors these rules for **live preview only**; after save, the server response is authoritative.

## Summary report and exchange rates

The summary report covers **finalized** documents whose **issue date** falls inclusively within the selected `from` / `to` calendar range (UTC boundaries: start of `from` through end of `to`).

Aggregates returned (all in **target currency**, integer cents):

- Document count
- Sum of grand totals
- Sum of total tax
- Sum of total discount

### Exchange rate conversion

Documents may use different currencies. At report time the user picks a **report currency** (default **USD**) and supplies exchange rates for each other currency present in the range.

**Rate meaning:** 1 unit of the source currency equals `rate` units of the target currency.

**Conversion** operates on **integer cents**:

```
targetCents = round(sourceCents × rate)
```

**Examples (target USD):**

| Source | Rate | Calculation | Result |
|--------|------|-------------|--------|
| €1.00 (100 EUR cents) | 1.08 | `round(100 × 1.08)` | 108 USD cents ($1.08) |
| €1.00 (100 EUR cents) | 1.081 | `round(100 × 1.081) = round(108.1)` | **108** USD cents (not 109) |

Fractional cent results always **round to the nearest whole cent** via `Math.round`. This applies to each document’s `grandTotal`, `totalTax`, and `totalDiscount` before summing.

Default rates ship in `server/src/config/exchangeRates.ts` (USD-per-unit factors). The report UI pre-fills editable rates from `GET /api/reports/setup`; the user can override before `POST /api/reports/summary`. Rates are **not persisted** — each report run uses the submitted values.

After generating a report, **Download PDF** exports the summary (totals, breakdown, and applied exchange rates) from the client via `jspdf`.

Missing or invalid rate for a document currency → **400** with a clear error.

## Document lifecycle and immutability

```
     ┌─────────┐
     │  draft  │  fully editable
     └────┬────┘
          │ POST /api/documents/:id/finalize
          ▼
     ┌─────────┐
     │finalized│  read-only
     └─────────┘
```

- **Allowed:** `draft` → `finalized` (via finalize endpoint only; `status` cannot be set through PATCH).
- **Not allowed:** `finalized` → `draft`, or any mutation on a finalized document.

Immutability is enforced in the **API** (`documentService`), not only in the UI. Finalized documents return **409 Conflict** for:

- `PATCH /api/documents/:id`
- `DELETE /api/documents/:id`
- `POST /api/documents/:id/lines`
- `PATCH /api/documents/:id/lines/:lineId`
- `DELETE /api/documents/:id/lines/:lineId`
- `POST /api/documents/:id/finalize` (if already finalized)

Draft documents can be deleted. Finalized documents cannot.

**Duplicate** (copy finalized → new draft) is a stretch goal and is **not** implemented.

## API overview

Base path: `/api`. All document routes require authentication.

### Auth

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/signup` | Create account → `{ user, token }` |
| `POST` | `/auth/login` | Log in → `{ user, token }` |
| `POST` | `/auth/logout` | Stateless logout → `204` |
| `GET` | `/auth/me` | Current user (Bearer token) |

### Documents

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/documents` | List own documents (`?status=draft\|finalized`) |
| `POST` | `/documents` | Create draft |
| `GET` | `/documents/:id` | Get document with lines |
| `PATCH` | `/documents/:id` | Update draft metadata |
| `DELETE` | `/documents/:id` | Delete draft |
| `POST` | `/documents/:id/finalize` | Finalize draft |

### Reports

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/reports/setup?from=&to=&targetCurrency=` | Currencies in range + default FX rates |
| `POST` | `/reports/summary` | Aggregated totals in target currency |

### Line items (draft only)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/documents/:id/lines` | Add line |
| `PATCH` | `/documents/:id/lines/:lineId` | Update line |
| `DELETE` | `/documents/:id/lines/:lineId` | Remove line |

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check |

Validation errors return **400** with Zod issue details. Ownership is enforced by scoping every document query to `userId` from the JWT.

## Assumptions and tradeoffs

| Topic | Decision |
|-------|----------|
| **Summary report** | Finalized docs only; FX conversion to user-selected currency with editable rates |
| **Discount overflow** | Clamp fixed/percent discounts rather than reject (warnings in calc module) |
| **Discount storage** | `discounts[]` on line items, but schema enforces max 1 entry |
| **Currency** | Document-level only; FX conversion at report time only (not on stored totals) |
| **Auth** | JWT in `localStorage`; no refresh tokens or server-side session store |
| **Logout** | Client discards token; no server blocklist |
| **Transactions** | Line mutations + total recompute run in a Mongoose transaction (needs replica set) |
| **Stretch goals** | Intentionally deferred to keep core scope shippable |


## License

Private / assignment submission — no public license specified.
