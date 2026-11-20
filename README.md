# WiseCare HMIS — Laravel + React

WiseCare is a hospital management system for Kenyan facilities. This project rebuilds it with a **Laravel API backend** and a
**React frontend**. It uses the **same MySQL tables** as the original PHP version, so a copy of an existing hospital database works
here unchanged.

The code base has **no comments**. Everything a developer needs to understand a flow is written in this README, flow by flow.

---

## Contents

1. [What is built so far](#1-what-is-built-so-far)
2. [Project layout](#2-project-layout)
3. [Requirements](#3-requirements)
4. [First-time setup](#4-first-time-setup)
5. [Running the app](#5-running-the-app)
6. [How a request travels](#6-how-a-request-travels)
7. [Flow: signing in and out](#7-flow-signing-in-and-out)
8. [Flow: roles and rights](#8-flow-roles-and-rights)
9. [Flow: the records API (System Setup registers)](#9-flow-the-records-api-system-setup-registers)
10. [Flow: registering and editing a patient](#10-flow-registering-and-editing-a-patient)
11. [Flow: Queue & Encounters](#11-flow-queue--encounters)
12. [Flow: Dashboard](#12-flow-dashboard)
13. [API reference](#13-api-reference)
14. [Adding a new register to the records API](#14-adding-a-new-register-to-the-records-api)
15. [Coding standards](#15-coding-standards)
16. [Debugging guide](#16-debugging-guide)
17. [Roadmap (phases)](#17-roadmap-phases)

---

## 1. What is built so far

Phase 1 (about 30% of WiseCare):

| Area | Status |
|---|---|
| Sign-in, sign-out, password change, account lock-out | Built |
| Roles and rights (Users & Security rights decide what each role opens and changes) | Built |
| Layout: sidebar, header, mobile menu | Built (same UI as the PHP version) |
| Dashboard | Built (patients and queue figures; bills, lab and wards arrive with their modules) |
| Patients: register, search, edit, child guardian rule, P-numbers, visit opening | Built |
| Queue & Encounters: queue a patient with a consultation, call, move station, priority, complete & next | Built |
| System Setup: patient categories, sub-categories, schemes, departments, consultation services, lab tests, radiology, nursing procedures, pharmacy drugs, ICD-11, wards, beds, inpatient packages, SHA rebates, cancer registers, hospital profile | Built |
| Every other module (Triage, Consultation, Billing, Laboratory, Pharmacy, Radiology, Inpatient, SHA e-Claims, Theatre, Oncology, Dental, Maternity, Stores, Finance, Reports) | Shows "Coming in a later phase" |

---

## 2. Project layout

```
wisecare-laravel/
├── README.md                     this file
├── backend/                      Laravel 13 API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   │   ├── AuthController.php      sign in, sign out, me, change password
│   │   │   │   ├── PatientController.php   patient search, show, register, edit
│   │   │   │   ├── RecordController.php    list / save / delete any register in config/records.php
│   │   │   │   └── CatalogController.php   consultation catalogue with prices, branches
│   │   │   └── Middleware/
│   │   │       └── EnsureSignedIn.php      401 unless a signed-in, active user
│   │   ├── Models/User.php                 the existing users table (password in password_hash)
│   │   ├── Services/
│   │   │   ├── LoginService.php            password check, lock-out, sign-in log, password rules
│   │   │   ├── RightsService.php           a role's rights from security_roles
│   │   │   ├── RecordService.php           field mapping, saving, price tables, compatibility copy
│   │   │   ├── PatientService.php          patient rules and the client shape of a patient
│   │   │   ├── VisitService.php            opens or reuses the patient's visit (24-hour rule)
│   │   │   ├── SequenceService.php         P-1001, V-1001 numbering (system_sequences)
│   │   │   ├── BranchService.php           the active branch for a record
│   │   │   └── AuditService.php            audit_log entries with secrets hidden
│   │   └── Support/Casing.php              camelCase ↔ snake_case
│   ├── config/records.php                  every register the records API serves
│   ├── routes/api.php                      all API routes
│   └── scripts/strip-comments.php          removes comments from PHP files
└── frontend/                     React 19 + TypeScript + Tailwind 4 (Vite)
    ├── src/
    │   ├── App.tsx                         the shell: session, roles, data, which screen shows
    │   ├── main.tsx                        entry point
    │   ├── hooks/
    │   │   ├── useSession.ts               who is signed in; reacts to 401 anywhere
    │   │   └── useQueue.ts                 the queue: load, add, call, move, priority
    │   ├── services/
    │   │   ├── apiClient.ts                the only place that talks to the backend
    │   │   └── moduleAccess.ts             which modules and forms a role may open
    │   ├── components/                     the screens (same as the PHP version's UI)
    │   ├── types/                          TypeScript types
    │   └── utils/                          small helpers
    └── scripts/strip-comments.mjs          removes comments from TS/TSX/JS/CSS files
```

---

## 3. Requirements

| Tool | Version |
|---|---|
| PHP | 8.3 or newer (with pdo_mysql, mbstring, openssl, tokenizer). XAMPP 8.2 is too old: use the system PHP or upgrade |
| Composer | 2.x |
| MySQL / MariaDB | 5.7+ / 10.4+ (XAMPP's MariaDB works) |
| Node.js | 20 or newer |

---

## 4. First-time setup

### 4.1 Database

The backend expects the WiseCare tables. Use a copy of an existing WiseCare database (recommended for development):

```bash
mysqldump -u root --single-transaction joyparkm_hms > /tmp/wisecare.sql
mysql -u root -e "CREATE DATABASE wisecare_laravel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -u root wisecare_laravel < /tmp/wisecare.sql
```

With XAMPP the tools are in `/opt/lampp/bin/` (`/opt/lampp/bin/mysqldump`, `/opt/lampp/bin/mysql`).

For a brand-new hospital, load the table structure from `backend/database/schema/mysql-schema.sql` instead:

```bash
cd backend
php artisan migrate
```

`php artisan migrate` loads `database/schema/mysql-schema.sql` (all WiseCare tables) into an empty database, then runs any newer
migrations.

### 4.2 Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Set the database in `backend/.env`:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=wisecare_laravel
DB_USERNAME=root
DB_PASSWORD=
SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173,localhost:8000,127.0.0.1:8000
```

### 4.3 Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

`frontend/.env` has one setting: `VITE_BACKEND_URL` (default `http://localhost:8000`).

---

## 5. Running the app

Two terminals:

```bash
cd backend && php artisan serve --port=8000
cd frontend && npm run dev
```

Open **http://localhost:5173** and sign in with a WiseCare user of that database.

The Vite dev server forwards `/api/*` and `/sanctum/*` to Laravel, so the browser sees one address. That is what lets the session
cookie work without any CORS setup.

### Production build

```bash
cd frontend && npm run build
```

The built files are in `frontend/dist/`. Serve them from the same domain as the Laravel `public/` folder (for example the React
files at `/` and Laravel at `/api`), so cookies stay first-party.

---

## 6. How a request travels

```
Screen (components/*.tsx)
  → apiClient (services/apiClient.ts)            adds X-XSRF-TOKEN, sends the session cookie
    → Vite proxy (dev) / same domain (prod)
      → Laravel routes/api.php
        → middleware: statefulApi (Sanctum session + CSRF), wisecare.auth (EnsureSignedIn)
          → Controller (app/Http/Controllers/Api)
            → Service (app/Services)               business rules
              → MySQL (same tables as the PHP version)
        ← JSON: { "success": true, ... } or { "success": false, "error": "…" }
  ← apiClient throws ApiError on any non-2xx or success:false; a 401 fires "wisecare:signed-out"
```

Every API answer has `success`. Errors carry a human-readable `error` that screens show as they are.

---

## 7. Flow: signing in and out

**Screens:** `components/LoginPage.tsx`, `hooks/useSession.ts`
**Backend:** `AuthController`, `LoginService`, `EnsureSignedIn`

1. On load, `useSession` calls `GET /api/auth/me`.
   - 200 → the user is signed in (session cookie still valid) and the app opens.
   - 401 → the sign-in page shows.
2. The user submits the form. `apiClient.login()` first calls `GET /sanctum/csrf-cookie` (sets `XSRF-TOKEN`), then
   `POST /api/auth/login` with `{ username, password }`.
3. `LoginService::attempt()`:
   1. Refuses (429) when the computer's IP had 20 failed sign-ins in the last 15 minutes.
   2. Finds the user by username **or** email (case-insensitive).
   3. Checks the password with `password_verify` against `users.password_hash` (the same bcrypt hashes as the PHP version).
   4. Refuses (423) a locked account (`locked_until` in the future).
   5. On a wrong password: adds 1 to `failed_logins`; at 5 it locks the account for 15 minutes and writes `LOCK` to `audit_log`.
   6. Refuses (403) a user whose `status` is not `Active`.
   7. On success: clears the failure count, sets `last_login`, upgrades the hash if PHP's default got stronger, and sets
      `must_change_password` when the password is weak (see 7.1).
   8. Every attempt is written to `auth_login_attempts` with its reason (`bad_password`, `unknown_user`, `locked`, `inactive`, `ip_blocked`).
4. `AuthController::login` signs the user into Laravel's `web` guard and regenerates the session id.
5. The answer is `{ user, rights }`. If `user.mustChangePassword` is true the login page asks for a new password
   (`POST /api/auth/change-password`) before the app opens.
6. **Sign out:** `POST /api/auth/logout` writes `LOGOUT` to `audit_log`, ends the session and rotates the CSRF token.
7. **Session expiry:** any API call that gets 401 makes `apiClient` fire `wisecare:signed-out`; `useSession` then shows the
   sign-in page.

### 7.1 Password rules (`LoginService::passwordProblem`)

- At least 4 characters.
- Not one of the shipped / common passwords (`wisecare`, `password`, `admin123`, `12345678`, …).
- Must not contain the username, or any word of 4+ letters from the user's name.

---

## 8. Flow: roles and rights

**Frontend:** `services/moduleAccess.ts` (`accessFor`), used in `App.tsx`
**Backend:** `RightsService`, `config/records.php` (`write` lists)

1. A user has one `role` (`users.role`). The role's rights are a JSON list in `security_roles.rights_json`
   (for example `["patients:read","queue:manage"]`).
2. The **System Administrator** role has every right.
3. **What a role can open:** `App.tsx` loads `GET /api/records/security-roles` and builds `access = accessFor(role, roles)`.
   `access.canOpen(module)` is true when the role has any right listed for that module in `MODULE_RIGHTS`. The sidebar only shows
   modules the role can open.
4. **What a role can change:** the server decides. Before saving or deleting a record, `RecordController` asks
   `RightsService::canWrite(user, resource)`. The rights needed are the `write` list of that resource in `config/records.php`
   (for example lab tests need `system:setup`, `system:tariffs` or `setup:lab-tests`). Resources without a `write` list
   (clinical records such as `queue`) can be changed by every signed-in user, because one visit moves across departments.
5. A refused change answers 403 with "Your role cannot change these records. Ask the System Administrator."

---

## 9. Flow: the records API (System Setup registers)

**Screens:** `components/SystemSetupModule.tsx` and `components/setup/*`
**Backend:** `RecordController`, `RecordService`, `config/records.php`

The System Setup registers all work the same way, so one controller serves them all. Each register (a "resource") is listed in
`config/records.php` with its table, its field-name exceptions (`aliases`), its sub-category price table (`prices`) and the rights
needed to change it (`write`).

### 9.1 Listing a register

1. The screen calls `apiClient.getSetupEntity('setup-lab-tests')` → `GET /api/records/setup-lab-tests`.
2. `RecordService::list()` reads the table (newest first; up to 50,000 rows for `setup-*` registers, 2,000 for others).
3. If the register has a price table, each row's `sub_category_prices_json` is rebuilt from it, so prices always come from the
   price table (`{ "SHA": 300, "CASH": 500 }`, keyed by sub-category code).
4. Rows are returned with their database column names (snake_case).
5. `apiClient.getSetupEntity` converts them for the screen: keys to camelCase, `*_json` fields parsed into objects, flags
   (`is_cash`, `preauth_required`, …) to booleans, prices and durations to numbers.

### 9.2 Saving a record

1. The screen calls `apiClient.persistEntity('setup-lab-tests', item)` → `POST /api/records/setup-lab-tests` with the item in
   camelCase.
2. `RecordController::store` checks the role's right (section 8).
3. `RecordService::save()`:
   1. Maps each field to a column: the resource's `aliases` first (for example `subCategoryPrices` → `sub_category_prices_json`),
      otherwise camelCase → snake_case (`cashPrice` → `cash_price`). Fields with no column are ignored.
   2. Normalises values: arrays/objects to JSON text, `true/false` to `1/0`, empty strings to `NULL`, dates to the column's format
      in the hospital's time zone (`Africa/Nairobi`).
   3. Sets `branch_id` to the active branch when the table has one.
   4. For patient records (`patient_record` in the config) it links `visit_id` to the patient's current visit (section 10.3).
   5. Inserts or updates the row by `id`, inside a transaction.
   6. If the register has a price table and the item has `subCategoryPrices`, it replaces that item's rows in the price table
      (one row per sub-category code that exists in `setup_patient_subcategories`).
   7. Keeps a copy of the exact payload in `entity_store` (the PHP version reads it, so both versions can share the database).
4. The controller writes `CREATE`/`UPDATE` to `audit_log` (passwords, secrets and tokens are replaced by `[hidden]`).
5. The answer is `{ success, id }`; the screen shows "saved".

### 9.3 Deleting a record

`apiClient.deleteEntity(resource, id)` → `DELETE /api/records/{resource}/{id}`. The right is checked, then the row, its price rows
and its `entity_store` copy are removed in one transaction, and `DELETE` is written to `audit_log`.

### 9.4 Hospital profile

`hospital-config` is a single-row register (`single_row_id: 1`): every save updates row 1. `App.tsx` loads it at sign-in and passes it
to the header (hospital name) and System Setup.

---

## 10. Flow: registering and editing a patient

**Screen:** `components/PatientsModule.tsx` (handlers in `App.tsx`: `addPatient`, `updatePatient`)
**Backend:** `PatientController`, `PatientService`, `VisitService`, `SequenceService`

### 10.1 Searching

`GET /api/patients?search=…` matches name, patient number, phone or national ID (500 newest). Each patient is returned in the
screen's shape (camelCase) with its age worked out from the date of birth and its open visit (`visitId`, `visitNumber`).

### 10.2 Registering

1. The receptionist fills the form; `addPatient` calls `apiClient.persistPatient(data)` → `POST /api/patients`.
2. `PatientService::save()` checks:
   - name and phone are required (422 otherwise);
   - **a child (under 18) needs a guardian**: next-of-kin name, phone and relationship, or 422 with the message the screen shows.
3. The patient number comes from `SequenceService::next('PATIENT', 'P-')`: it locks the `system_sequences` row for `PATIENT`,
   takes `next_value` (starting at 1001) and adds 1. Two receptionists saving at once never get the same number.
4. Category, sub-category and scheme names are turned into their IDs (`setup_patient_categories`,
   `setup_patient_subcategories`, `setup_patient_schemes`) so reports can join on them.
5. The patient row is saved, plus the `entity_store` copy.
6. A new patient gets a visit (section 10.3).
7. The answer has `id`, `visitId` and the saved patient; the list updates at once.

### 10.3 Visits (`VisitService::currentOrNew`)

1. If a `visitId` is given and belongs to the patient, it is used.
2. Otherwise an **open visit from the last 24 hours** is reused (or any open visit while the patient is admitted).
3. Otherwise a new visit is created: id `VISIT-<date-time>-<random>`, number `V-<n>` from the `VISIT` sequence, today's date and
   time, the patient's category / sub-category / scheme, status `Open`.

### 10.4 Editing

`apiClient.persistPatient(patient)` sends `PUT /api/patients/{id}` when the id is a `P-` number. The same rules apply, except the
child-guardian rule (it is checked when a patient is first registered).

---

## 11. Flow: Queue & Encounters

**Screen:** `components/QueueModule.tsx`
**Logic:** `hooks/useQueue.ts` (state and rules), `App.tsx` (`queuePatient`, `selectConsultation`)
**Backend:** records API, resource `queue` (table `patient_queue`), `CatalogController::consultations`

### 11.1 Loading

At sign-in `useQueue.load()` reads `GET /api/records/queue` and keeps the entries that arrived in the **last 24 hours**
(`isWithin24Hours`). Each row is turned into a `QueueItem` by `toQueueItem`.

### 11.2 Queueing a registered patient

1. The user searches a patient and picks a consultation service. Services and their prices come from
   `GET /api/catalog/consultations`: every active service with `subCategoryPriceRows` (one price per category / sub-category).
   The screen picks the price for the patient's category and sub-category.
2. `useQueue.enqueue(patient, service, fee, subCategory)`:
   1. Refuses if the patient is already in today's queue and not discharged.
   2. Decides the route from the patient's payment method:
      - **free** (fee 0) → Triage, note "Free consultation";
      - **cash / M-Pesa** with a fee → **Billing** first (ticket `B-5xx`), `consultationFeePaid = false`;
      - **insurance / SHA** → **Triage** (ticket `T-1xx`), fee recorded against the sub-category.
   3. Saves the new entry (`POST /api/records/queue`). The backend links it to the patient's current visit.
3. The patient's status becomes "In Triage".

### 11.3 Working the queue

| Action | What happens (`useQueue`) |
|---|---|
| Call / Recall | status `Calling`, `callCount + 1`, `lastCalledAt` = now |
| Move station | sets the station, status `Waiting` (or `Completed` when Discharged) and the staff role for that station |
| Complete & next | moves to the next station: Registration → Triage → Consultation → Pharmacy → Billing → Discharged; Laboratory and Radiology go back to Consultation |
| Priority | Normal / Urgent / Emergency |
| Change consultation | updates the service, fee and payment flag of the entry |

**Billing guard:** a cash patient at Billing cannot be moved on until a consultation is chosen and paid.

Every change is saved at once with `POST /api/records/queue` (same id = update).

> The cash consultation **invoice** is created by the Billing module, which arrives in Phase 2. Until then cash patients wait at
> the Billing station with their consultation and fee recorded.

---

## 12. Flow: Dashboard

**Screen:** `components/Dashboard.tsx`. It shows today's patients and queue figures from the data `App.tsx` already loaded
(patients, queue). Bills, laboratory, wards and stock figures fill in as those modules are added.

---

## 13. API reference

All routes are under `/api`. All except `POST /auth/login` need a signed-in user (session cookie). Every request that changes data
needs the `X-XSRF-TOKEN` header (`apiClient` adds it).

| Method | Path | Body / query | Answer |
|---|---|---|---|
| POST | `/auth/login` | `{ username, password }` | `{ user, rights }` |
| GET | `/auth/me` | | `{ user, rights }` or 401 |
| POST | `/auth/logout` | | `{ success }` |
| POST | `/auth/change-password` | `{ currentPassword, newPassword }` | `{ user }` |
| GET | `/patients` | `?search=` | `{ data: Patient[] }` |
| GET | `/patients/{id}` | | `{ data: Patient }` |
| POST | `/patients` | Patient (camelCase) | `{ id, visitId, data }` |
| PUT | `/patients/{id}` | Patient (camelCase) | `{ id, data }` |
| GET | `/catalog/consultations` | | `{ data: ConsultationService[] }` with `subCategoryPriceRows` |
| GET | `/branches` | | `{ currentBranchId, data }` |
| GET | `/records/{resource}` | | `{ data: rows[] }` (snake_case) |
| POST | `/records/{resource}` | record (camelCase) | `{ id }` |
| DELETE | `/records/{resource}/{id}` | | `{ id }` |

`{resource}` is any key of `config/records.php` → `resources`.

Error answers: `{ "success": false, "error": "…" }` with 400 (bad input), 401 (not signed in), 403 (role not allowed),
404 (unknown resource / record), 422 (rule broken), 423 (account locked), 429 (too many attempts).

---

## 14. Adding a new register to the records API

1. Add an entry to `backend/config/records.php`:

   ```php
   'setup-blood-groups' => [
       'table' => 'setup_blood_groups',
       'aliases' => ['shortCode' => 'short_code_text'],
       'write' => ['system:setup'],
   ],
   ```

   - `aliases` is only for fields whose column is **not** the snake_case of the field name.
   - Add `'prices' => ['table' => '…', 'foreign_key' => '…']` when the item has per-sub-category prices.
   - Add `'patient_record' => true` when rows belong to a patient visit.
2. The frontend can now use `apiClient.getSetupEntity('setup-blood-groups')` and
   `apiClient.persistEntity('setup-blood-groups', item)`. No new route or controller is needed.
3. A register with real business rules (like patients) gets its own Service and Controller instead.

---

## 15. Coding standards

- **No comments** anywhere in the code base. Explanations live in this README. To check or clean:
  - backend: `php scripts/strip-comments.php`
  - frontend: `npm run strip-comments`
- **Formatting:** backend with Laravel Pint (`./vendor/bin/pint`), frontend with Prettier (`npm run format`).
- **Types:** the frontend must pass `npm run typecheck` with no errors.
- **Backend layering:** routes → controller (HTTP only: input, rights, status codes) → service (rules, database). Controllers never
  hold business rules; services never read the request.
- **Frontend layering:** screens never call `fetch` for the WiseCare API; they go through `services/apiClient.ts`.
- **Names:** API fields are camelCase in requests; database columns are snake_case; the mapping is in `config/records.php` or a
  service.

---

## 16. Debugging guide

| Symptom | Where to look |
|---|---|
| Sign-in always says "Invalid username or password" | `auth_login_attempts` (reason column), `users.status`, `users.locked_until` |
| 419 "CSRF token mismatch" | The app must be opened through the Vite address (5173) or the same domain as Laravel; check `SANCTUM_STATEFUL_DOMAINS` |
| Every call returns 401 | Session cookie not sent: same-origin issue (see above) or `SESSION_DOMAIN` set wrongly |
| A save says "Your role cannot change these records" | The resource's `write` list in `config/records.php` and the role's `security_roles.rights_json` |
| A field is not saved | Its column name: is it the snake_case of the field, or does it need an `aliases` entry? |
| Prices do not show per sub-category | The price table rows and `setup_patient_subcategories.sub_category_code` |
| Server error (500) | `backend/storage/logs/laravel.log` |
| Browser side | DevTools → Network: every API call is `/api/...`; the answer's `error` is the message shown |

Useful commands:

```bash
php artisan route:list --path=api
tail -f storage/logs/laravel.log
php artisan tinker
```

---

## 17. Roadmap (phases)

| Phase | Modules |
|---|---|
| 1 (done) | Foundation, sign-in, roles, layout, Dashboard, Patients, Queue & Encounters, System Setup |
| 2 | Vitals & Triage, Consultation, Billing & Cashier (invoices, payments, the cash consultation invoice) |
| 3 | Laboratory, Pharmacy & Prescriptions, Radiology, Walk-in cash services, Appointments |
| 4 | Inpatient (IPD) with Maternity & Labour Care Guide, Theatre, Oncology, Dental, Dialysis, Blood Bank, Mortuary |
| 5 | SHA e-Claims (Mwavuli Connector), M-Pesa |
| 6 | Stores & Inventory, Finance & Payroll, Accounts, Fixed Assets, Reports, Users & Security screens, Document reprints |
