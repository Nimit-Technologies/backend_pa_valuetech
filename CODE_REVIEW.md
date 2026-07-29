# Code Review — `backend_pa_valuetech`

Reviewed: 2026-07-20 · Branch: `development`

Scope: project structure, database/ORM, API layer, and cross-cutting concerns. This is a snapshot for reference — re-verify against current code before acting on it, especially the "empty stub" list as those modules are actively being built.

---

## 1. Project Structure

```
backend_pa_valuetech/
├── server.js                 # entry point
├── prisma/
│   ├── schema/                # multi-file Prisma schema (base, user, address, branch, department, role)
│   ├── migrations/
│   └── SCHEMA.md              # hand-maintained ERD doc
├── prisma.config.ts           # Prisma 7 config (schema folder, migrate/generate datasource)
├── src/
│   ├── app.js                 # Express app setup
│   ├── index.js                # central router (mounts feature routes under /api/v1)
│   ├── constant/credentials.js # env var access point
│   ├── middlewares/            # isAuthenticated.js, authorize.js
│   ├── prisma/client.js        # Prisma client singleton (pg Pool + adapter)
│   ├── generated/prisma/       # generated Prisma client (gitignored)
│   ├── config/, utils/         # scaffolded, currently empty (.gitkeep only)
│   └── features/               # one folder per domain module (see §5)
└── .env.example
```

- **Runtime**: Node.js, ESM (`"type": "module"`), `engines: "22.12.0 || >=24"` (note the gap excluding Node 23.x — no `.nvmrc` to reinforce it).
- **Framework**: Express 5.
- **Stack**: Prisma 7 + PostgreSQL (Supabase), Zod for validation, JWT (`jsonwebtoken`) + `bcrypt` for auth, `cookie-parser`.
- **Scripts**: `start`, `dev` (nodemon), `postinstall` → `prisma generate`, `migrate` → `prisma migrate dev`.
- **Missing tooling**: no ESLint, no Prettier, no Dockerfile, no CI workflow, **no tests anywhere**. This is worth prioritizing once the core CRUD surface stabilizes — right now every module hand-repeats the same patterns with no automated check that they stay consistent.

---

## 2. Database & ORM

**Prisma 7** with the `@prisma/adapter-pg` driver adapter (not Prisma's built-in engine) against **PostgreSQL on Supabase**. `DATABASE_URL` (pooled, port 6543) is used at runtime; `DIRECT_URL` (port 5432) is used only by `prisma migrate`/`generate` — correct pattern for Supabase's connection pooler.

### Connection (`src/prisma/client.js`)
```js
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

try {
  await prisma.$connect();
} catch (error) {
  console.error("Database connection failed:", error);
  process.exit(1);
}

export default prisma;
```
Imported once for its side effect in `app.js`; every feature service re-imports the same module path and relies on Node's module cache for a singleton. It works, but:
- `process.exit(1)` living inside a module import (rather than an explicit bootstrap function) makes the app hard to unit-test or mock without a live DB.
- There's no schema validation of required env vars at boot beyond `DATABASE_URL` — a missing `JWT_SECRET` will fail silently at `jwt.sign()`/`jwt.verify()` call time instead of at startup.

### Schema (multi-file, `prisma/schema/*.prisma`)

Five models: `User`, `Address`, `Branch`, `Department`, `Role`. All use `@id @default(cuid())`, `created_at`/`updated_at` timestamps, and `@@map()` to snake_case table names.

```prisma
model User {
  id           String  @id @default(cuid())
  employee_id  String  @unique
  email        String? @unique
  phone        String  @unique
  password     String
  adhar_number String  @unique
  is_active    Boolean @default(true)

  branch_id     String
  department_id String
  role_id       String
  address_id    String @unique

  branch     Branch     @relation(fields: [branch_id], references: [id])
  department Department @relation(fields: [department_id], references: [id])
  role       Role       @relation(fields: [role_id], references: [id])
  address    Address    @relation(fields: [address_id], references: [id])

  @@index([branch_id])
  @@index([department_id])
  @@index([role_id])
  @@map("users")
}
```

`Department` and `Role` are branch-scoped (`@@unique([name, branch_id])`); `Branch` is top-level; `Address` is a 1:1 child of `User`. One migration exists so far (`20260624075853_v_1_schema`), all FKs `ON DELETE RESTRICT ON UPDATE CASCADE`.

**Strength**: `prisma/SCHEMA.md` documents the ERD by hand — good practice, but it's a second source of truth that can drift from the actual `.prisma` files since nothing generates or checks it automatically.

**Risk**: `ON DELETE RESTRICT` everywhere means deleting a `Branch`/`Department`/`Role`/`Address` still referenced by a `User` throws a Prisma `P2003` foreign-key error — see §4, none of the delete controllers currently catch this.

No raw SQL (`$queryRaw`/`$executeRaw`) is used anywhere in application code, so there's no SQL-injection surface. No N+1 risk observed — list endpoints that need related data use Prisma `include`/`select` in a single query.

---

## 3. API Layer

### App bootstrap (`src/app.js`)
```js
const app = express();
app.use(express.json());
app.use(cookieParser());

app.get("/health", ...);
app.get("/", ...);
app.use("/api/v1", routes);
```
Minimal middleware stack: no `cors()`, no `helmet()`, no rate limiting, no request logger, **no centralized error-handling middleware**. Every controller does its own inline `try/catch` → `res.status(500).json(...)`.

- `cors` is a listed dependency and `ALLOWED_ORIGIN` is defined in `.env`/`credentials.js`, but `app.use(cors(...))` is never called — this looks like an unfinished wiring step rather than an intentional decision, and will block the frontend once it's on a different origin.

### Routing (`src/index.js`)
```js
router.use("/auth", authRoutes);
router.use("/address", addressRoutes);
router.use("/branch", branchRoutes);
router.use("/department", departmentRoutes);
router.use("/role", roleRoutes);
router.use("/user", userRoutes);
```
Only these six are mounted. `cases`, `assignments`, `banks`, `dashboard`, `engineer`, `uploads` exist as folders with correctly-named files but are **all 0 bytes** — scaffolded, not implemented, not routed. `cases.controller.js` (open in your editor) is one of these empty stubs.

### Two module layouts in use
- **Sub-folder pattern** (`address`, `branch`, `departments`, `roles`, `users`, `auth`): `*.routes.js` + `*.schema.js` at the root, `controllers/<verb>.<entity>.js` and `services/<verb>.<entity>.js` split one-file-per-operation.
- **Flat pattern** (`assignments`, `banks`, `cases`, `dashboard`, `engineer`, `uploads`): single `*.controller.js` / `*.routes.js` / `*.service.js`. All currently empty, so the pattern isn't proven yet — worth deciding whether the flat or sub-folder convention wins before these get filled in, so the codebase doesn't end up with two competing styles long-term.

### Full example — Users module
- `user.routes.js`: `GET /all-user`, `GET /:id`, `POST /create-user`, `PUT /update/:id`, `DELETE /delete/:id` — all behind `isAuthenticated, isAdmin`.
- `user.schema.js`: Zod schemas (`userSchema`, `updateUserSchema.strict()`) with password-complexity, phone/Aadhaar digit-length checks, and a nested `addressSchema`.
- `controllers/create.user.js`: validates `confirm_password` manually, then Zod; hashes with `bcrypt.hash(password, CREDENTIALS.SALT_ROUNDS)`; strips `password` from the response; maps Prisma `P2002` → 409, `P2025` → 404.
- `services/service.create.user.js`: thin Prisma wrapper using nested `connect`/`create` for relations.
- `service.getall.user.js` / `getall.user.js`: **cursor-based pagination**, `limit` clamped to 100, returns `nextCursor` — the only module with real pagination. `department`/`branch`/`role`/`address` list endpoints call `findMany()` with no `take` at all.

### Auth (`src/features/auth/`)
- `POST /login`, `POST /logout` — correctly left off `isAuthenticated`.
- `auth.login.js`: Zod-validates `{ employee_id, password }`, looks up the user (service includes `role`/`branch`/`department`), checks `is_active`, `bcrypt.compare`, signs a JWT (`expiresIn: "1d"`, payload `{ id, employee_id, role, branch_id, department }`), sets it as `httpOnly` + `secure` (prod) + `sameSite: strict` cookie — **and also returns the raw token in the JSON body**. That second part undercuts the point of `httpOnly`: if the frontend ever reads `response.token` into JS state/localStorage, the token becomes exposed to XSS the cookie was meant to protect against.
- `service.auth.login.js`: `findUnique` with no top-level `select`, so the full row (including the password hash) comes back from Prisma and relies on the controller to strip it before responding. Works today, but a future change that forwards the raw `user` object anywhere would leak the hash — safer to `select` explicitly and exclude `password` at the query.

### Auth/RBAC middleware (`src/middlewares/`)
- `isAuthenticated.js`: reads `req.cookies?.token`, `jwt.verify`, sets `req.user`, distinguishes `TokenExpiredError` / `JsonWebTokenError` / `NotBeforeError` (401) from a generic 500 fallback.
- `authorize.js`: `isSuperAdmin`, `isAdmin` (super-admin OR branch-admin), `isBranchAdmin`, `isCoordinator` (hardcoded role name `"coordinator"` + department `"coordination"`). Role/department names are magic strings scattered through this file rather than centralized constants — a rename or typo anywhere silently breaks authorization. `isBranchAdmin` and `isCoordinator` aren't referenced by any currently-mounted route yet.

### Validation
Zod is used consistently, but every controller repeats the same block:
```js
if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.issues });
```
This shows up ~15+ times with no shared `validate(schema)` middleware to remove the duplication.

---

## 4. Cross-Cutting Concerns

| Concern | State |
|---|---|
| Logging | None structured — scattered `console.error(...)` in some controllers (departments/address/users get/list/delete), absent in others (create/update, all of branch/role). No morgan/winston/pino. |
| Error handling | No custom error classes, no global Express error middleware. Every controller: inline `try/catch` → 500. |
| FK-constraint errors | **Not handled anywhere.** Every relation is `ON DELETE RESTRICT`; deleting a still-referenced Branch/Department/Role/Address throws Prisma `P2003`, which falls through to a generic unhelpful 500 instead of a 409 "still in use." |
| ID validation | `:id` route params are passed straight to Prisma with no shape check (CUID format) — malformed IDs produce a raw Prisma error via the generic catch instead of a clean 400. |
| Response shape | Consistently `{ success, data?, message?, errors? }` across nearly all endpoints — a genuine strength, though enforced only by convention, not a shared helper. |
| Config | `src/constant/credentials.js` centralizes env access; only `DATABASE_URL` is checked at startup — `JWT_SECRET` missing fails silently later at sign/verify time. |
| Style consistency | No ESLint/Prettier. `departments`/`roles`/`branch`/`address` use 4-space indent; `auth`/`users` use 2-space — visibly inconsistent file-to-file. |
| Tests | None. |
| CORS | Dependency installed, `ALLOWED_ORIGIN` defined, but never wired into `app.js`. |
| SQL injection | No raw SQL anywhere in app code — everything goes through Prisma's query builder. Low risk. |
| N+1 queries | None observed — relations fetched via `include`/`select` in single queries. |

### Suggested near-term fixes, roughly in priority order
1. Wire up `cors()` using `ALLOWED_ORIGIN` — frontend integration will break without it.
2. Add a global Express error-handling middleware + a shared `validate(schema)` middleware to remove the ~15x duplicated Zod boilerplate.
3. Catch Prisma `P2003` in all delete controllers → return 409 instead of 500.
4. Stop returning the raw JWT in the login response body if the intent is httpOnly-cookie-only auth; keep it in the cookie alone.
5. Add pagination (`take`/cursor) to `department`, `branch`, `role`, `address` list endpoints to match the `users` module.
6. Centralize role/department name constants instead of hardcoding strings in `authorize.js`.
7. Decide on one feature-module layout (sub-folder vs. flat) before filling in `cases`, `assignments`, `banks`, `dashboard`, `engineer`, `uploads`.
8. Add ESLint + Prettier to stop the indentation drift, and start a test suite before the business-logic modules (cases/assignments) land — those will be the highest-risk code once the org/identity layer is presumably "done."

---

## 5. Feature Modules (`src/features/`)

| Module | Status | Purpose (inferred) |
|---|---|---|
| `auth` | Implemented | Login (`employee_id` + `password` → JWT httpOnly cookie), logout. Only public routes. |
| `users` | Implemented | Full user CRUD, nested address creation, password hashing, cursor pagination, FK/duplicate conflict handling. `isAdmin` only. |
| `address` | Implemented | CRUD for addresses; mostly created nested under user creation, also has standalone admin CRUD. |
| `branch` | Implemented | CRUD for top-level "Branch" org entity. `isSuperAdmin` only. |
| `departments` | Implemented | CRUD for branch-scoped departments. `isAdmin` only. |
| `roles` | Implemented | CRUD for branch-scoped RBAC roles. `isAdmin` only. |
| `cases` | **Empty stub** | Core domain entity (workflow case) — not implemented, not routed. |
| `assignments` | **Empty stub** | Likely assigning cases/tasks to engineers — not implemented. |
| `banks` | **Empty stub** | Likely reference data for banks (valuation domain) — not implemented. |
| `engineer` | **Empty stub** | Likely a specialized staff role (field valuation visits) — not implemented. |
| `uploads` | **Empty stub** | Likely file/document upload handling — not implemented; no multer/S3 dependency installed yet. |
| `dashboard` | **Empty stub** | Likely aggregate/summary stats endpoints — not implemented. |

**Overall state**: the org/identity layer (branch → department/role → user → address, plus auth/RBAC) is complete and reasonably solid. The actual business/workflow layer (cases, assignments, engineer, banks, uploads, dashboard) is scaffolded by filename only, with zero implementation and nothing mounted in the router yet.
