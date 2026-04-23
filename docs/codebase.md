# Foothill Park — Codebase Reference

> Quick-start guide for any developer (or AI) picking up this repo cold.

---

## Monorepo Structure

```
foothill-park/
├── apps/mobile/          React Native (Expo SDK 54, expo-router)
├── apps/api/             Node.js + Express + TypeScript backend
├── docs/                 Design doc, codebase reference, API reference
└── package.json          npm workspaces root (run `npm run mobile` or `npm run api`)
```

---

## Mobile App (`apps/mobile/`)

### Screens & Routes (`app/`)

| File | Route | Who sees it |
|------|-------|-------------|
| `_layout.tsx` | root | Auth gate — redirects based on auth state |
| `index.tsx` | `/` | Immediate redirect to `/login` |
| `login.tsx` | `/login` | Unauthenticated users |
| `auth.tsx` | `/auth` | OAuth callback deep-link handler (Android) |
| `onboarding.tsx` | `/onboarding` | Authenticated users who haven't registered a plate yet |
| `(auth)/_layout.tsx` | — | Tab bar shell (scan / employees / profile) |
| `(auth)/scan.tsx` | `/scan` | **Primary screen** — camera OCR → lookup → contact |
| `(auth)/employees.tsx` | `/employees` | Team directory with search |
| `(auth)/profile.tsx` | `/profile` | User profile, plate editing, sign out |
| `(auth)/admin.tsx` | `/admin` | Admin only — manual BambooHR sync trigger |

### Auth & Routing Logic

```
App start
  └─ AuthContext loads stored session from SecureStore
       ├─ no session       → /login
       ├─ hasPlate = false → /onboarding   (plate registration gate)
       └─ hasPlate = true  → /(auth)/scan  (main app)
```

**OAuth PKCE flow:**
1. `signIn()` generates 32-byte random verifier + SHA256 challenge
2. Opens `expo-web-browser` to Microsoft Entra ID OAuth endpoint
3. iOS: result returned directly from WebBrowser
4. Android: deep link fires → `app/auth.tsx` receives the code
5. `exchangeCodeForTokens()` POSTs code + verifier to Microsoft token endpoint
6. Tokens stored in SecureStore (`fp_id_token`, `fp_refresh_token`, `fp_token_expires_at`, `fp_user_info`)
7. Auto-refreshes 60 seconds before expiry using `fp_refresh_token`

**Credentials** (`constants/auth.ts`):
- `tenantId`: `eda60734-6629-4439-b419-266a437d6773`
- `clientId`: `b20532c8-b3fb-41d3-9cb4-8947c5384030`

### Key Components

**`components/CameraScanner.tsx`** — Full-screen camera with plate frame overlay
- 78% width frame, 42% aspect ratio (licence-plate shape)
- 4-panel dark overlay + corner brackets + animated scan line
- OCR pipeline:
  1. `takePictureAsync({ quality: 0.92 })`
  2. Crop photo to frame region + 15% margin via `expo-image-manipulator`
     (falls back to full photo if native module not in build)
  3. `TextRecognition.recognize(uri)` — on-device ML Kit
  4. Sort OCR blocks by area (largest first — plate digits dominate)
  5. If full photo used: filter blocks to frame bounding box
  6. `extractPlateFromOcr(textChunks)` → plate string or null
  7. Calls `onPlateDetected(plate)` on success
  8. Shows actual error in hint pill on failure (not generic "Scan failed")

**`components/PlateDisplay.tsx`** — Renders a realistic Palestinian licence plate
- Sizes: `sm` / `md` / `lg` / `xl`
- Green strip on right with Arabic 'ف' and 'P' badge
- Monospace font, inset highlight for glass effect

### OCR Parser (`utils/ocrParser.ts`) — 6-pass extraction

Palestinian plate formats:
- **Format A**: `1–2 digits · 3–4 digits · 2 digits` (all digits, 7–8 chars total)  e.g. `7-0339-96`
- **Format B**: `1–2 digits · 3–4 digits · letter` (digit + letter)  e.g. `3-9956-D`

Pass order (highest to lowest confidence):
1. Full-block exact pattern match
2. Format A with separators
3. Format B with separators
4. Fused 7–8 digit run
5. Fused digit + letter run
6. Token join (OCR split the plate across blocks)
7. Partial 5–6 digit run
8. Scored fallback (score threshold > 14)

Noise removed: Arabic Unicode, P/ف badges, Palestinian phone numbers (059X, 056X, 02/04/08/09 prefix).

### Services (`services/`)

**`api.ts`** — Typed HTTP client
- Base URL: `https://foothill-park.foothilltech.net`
- All requests: `Authorization: Bearer {idToken}`
- Methods: `me()`, `getEmployees()`, `getMyPlates()`, `registerPlate()`, `lookupPlate()`, `syncBamboo()`, `sendDiscordDm()`

**`auth.ts`** — Token management
- `exchangeCodeForTokens(code, codeVerifier, redirectUri)` → UserInfo
- `getStoredSession()` → `{ accessToken, user }` | null (auto-refreshes if expiring)
- `refreshSession()` → silent renewal using refresh token
- `clearSession()` → wipes all stored tokens

### Constants (`constants/`)

| File | Key values |
|------|-----------|
| `auth.ts` | tenantId, clientId, OAuth scopes |
| `config.ts` | `GATE_PHONE = '0592605413'`, `ADMIN_EMAILS = ['m.abdalkareem@foothillsolutions.com']` |
| `theme.ts` | **All colour tokens — always import from here, never hardcode hex** |

### Colour Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#2D6DB5` | Buttons, headers, active states |
| `accent` | `#5BA4E6` | Highlights, secondary actions |
| `dark` | `#1A1A2E` | Text, navigation background |
| `white` | `#FFFFFF` | Backgrounds, card surfaces |
| `success` | `#28A745` | Scan success, active indicators |
| `surface` | `#F5F8FC` | Screen backgrounds |
| `discord` | `#5865F2` | Discord action buttons |

### Mobile Dependencies

| Package | Version | Notes |
|---------|---------|-------|
| `expo` | ~54.0.33 | SDK version — pin carefully |
| `react-native` | 0.81.5 | |
| `@react-native-ml-kit/text-recognition` | ^2.0.0 | **Native — requires dev/production build, not Expo Go** |
| `expo-image-manipulator` | ~14.0.8 | **Native — crop before OCR; graceful fallback if missing** |
| `expo-camera` | ~17.0.10 | CameraX on Android |
| `expo-router` | ~6.0.23 | File-based routing |
| `expo-secure-store` | ~15.0.8 | Token storage |
| `expo-auth-session` | ~7.0.10 | PKCE helpers |
| `expo-crypto` | ~15.0.8 | PKCE verifier generation |
| `expo-blur` | ~15.0.8 | UI overlays |
| `expo-linear-gradient` | ~15.0.8 | Gradient backgrounds |

**iOS minimum deployment target: 15.5** (required by ML Kit — set in `ios/Podfile.properties.json`).

### Building

```bash
# Development (hot-reload, needs dev client installed on device)
npx expo start --dev-client

# iOS (local build — requires Xcode + Apple Developer account)
npx expo run:ios --device

# Android (local build)
npx expo run:android --device

# EAS cloud builds
eas build --profile development --platform android   # dev client APK
eas build --profile preview --platform android       # preview APK
eas build --profile production --platform all        # production
```

EAS project ID: `929252d4-3a69-4848-b76e-a75ead5adf03`
iOS bundle ID: `com.anonymous.foothill-park`
Android package: `com.anonymous.foothillpark`

---

## API Server (`apps/api/`)

### Directory Layout

```
apps/api/src/
├── app.ts                    Express app setup + route mounting
├── config/index.ts           Environment variable loading with defaults
├── middleware/
│   ├── authenticate.ts       Validate Microsoft Entra JWT via JWKS
│   └── requirePlate.ts       Gate: user must have an active registered plate
├── routes/
│   ├── health.ts             GET /api/health
│   ├── me.ts                 GET /api/me
│   ├── plates.ts             GET + POST /api/plates/*
│   ├── employees.ts          GET /api/employees
│   ├── admin.ts              GET + POST /api/admin/*
│   └── discord.ts            POST /api/discord/dm
├── services/
│   ├── employeeService.ts    Multi-source employee reconciliation
│   ├── plateService.ts       Plate registration & lookup
│   └── bambooSync.ts         BambooHR API integration
├── jobs/scheduler.ts         Cron: nightly BambooHR sync (Sun 02:00)
└── db/
    ├── connection.ts         PostgreSQL client (pg)
    ├── migrate.ts            Runs migrations on startup
    └── migrations/
        ├── 001_initial.sql               employees, plates, audit_logs
        ├── 002_add_email_nullable_entra.sql
        └── 003_add_discord_username.sql
```

See [`api-reference.md`](./api-reference.md) for full endpoint documentation.

### Middleware

**`authenticate.ts`**
- Requires `Authorization: Bearer <token>`
- Validates against Microsoft Entra ID JWKS endpoint
- Verifies audience (clientId) and issuer (tenantId)
- Attaches `req.user = { entraId, displayName, email }`
- Returns 401 if missing or invalid

**`requirePlate.ts`**
- Calls `hasActivePlate(employeeId)`
- Returns 403 if user has no active plate

### Key Services

**`employeeService.ts`** — Multi-source reconciliation

`findOrCreateEmployee(entraId, displayName, email)` runs 4-path logic:
1. Existing SSO row (by entraId) → update name/email, merge any BambooHR orphan by email
2. Pre-populated BambooHR row (by email) → link entraId, merge plates
3. Seed placeholder (by name match) → upgrade seed_% entraId to real SSO row
4. Brand new → create from SSO data

**`plateService.ts`**
- `registerPlate(employeeId, plateNumber)` — normalizes, deactivates old plates, transfers seed plates, upserts
- `lookupPlate(plateNumber)` → `{ found, owner? }` — joins plates + employees (both is_active=true)
- `getMyPlates(employeeId)` → active plates array

**`bambooSync.ts`**
- Fetches BambooHR report 314 (all active employees)
- Upserts by bamboo_id, links by email, inserts new rows
- Deactivates employees no longer in report
- Returns `{ inserted, updated, linked, deactivated }`
- Display name priority: fullName1 → fullName → displayName → firstName + lastName
- Phone priority: mobilePhone → homePhone → workPhone
- Discord: customDiscordName → discordName

### Database Schema

**`employees`**

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `entra_id` | VARCHAR UNIQUE | Microsoft Entra object ID; seed rows use `seed_%` prefix |
| `bamboo_id` | VARCHAR UNIQUE NULL | BambooHR employee ID |
| `display_name` | VARCHAR NOT NULL | |
| `email` | VARCHAR NULL | Nullable for BambooHR-only rows before SSO login |
| `phone` | VARCHAR NULL | |
| `discord_id` | VARCHAR NULL | |
| `discord_username` | VARCHAR NULL | |
| `department` | VARCHAR NULL | |
| `is_active` | BOOLEAN DEFAULT true | |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

**`plates`**

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `employee_id` | UUID FK → employees | |
| `plate_number` | VARCHAR | User input e.g. `7-0339-96` |
| `plate_normalized` | VARCHAR | Digits only e.g. `7033996` |
| `country_code` | VARCHAR DEFAULT 'PS' | |
| `is_active` | BOOLEAN DEFAULT true | |
| `registered_by` | UUID FK → employees | |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

UNIQUE constraint: `(plate_normalized, country_code)`
Index: `plate_normalized WHERE is_active = true`

**`audit_logs`**

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `actor_id` | UUID FK → employees | Who performed the action |
| `action` | VARCHAR | `PLATE_REGISTER`, `PLATE_LOOKUP` |
| `target_plate` | VARCHAR NULL | |
| `target_employee` | UUID FK NULL | |
| `metadata` | JSONB DEFAULT '{}' | |
| `ip_address` | INET NULL | |
| `created_at` | TIMESTAMPTZ DEFAULT NOW() | |

### Environment Variables

Copy `apps/api/.env.example` to `apps/api/.env`. Required:

```
DATABASE_URL=           # or individual DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD
ENTRA_TENANT_ID=        # eda60734-6629-4439-b419-266a437d6773
ENTRA_CLIENT_ID=        # b20532c8-b3fb-41d3-9cb4-8947c5384030
BAMBOOHR_API_KEY=       # BambooHR API key
BAMBOOHR_SUBDOMAIN=     # BambooHR subdomain
DISCORD_BOT_TOKEN=      # Discord bot token (for DM feature)
DISCORD_GUILD_ID=       # Discord server ID
```

---

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| On-device OCR (ML Kit) | Faster, offline-capable, no vehicle images sent to cloud |
| PKCE OAuth flow | Secure for mobile — no client secret needed |
| Mandatory plate gate | Primary adoption mechanism — no app access until plate registered |
| Nightly BambooHR sync | Removes BambooHR from the P0 lookup path; DB query is the only critical dependency |
| Seed placeholder pattern | Pre-populate employee rows so plate linkage works before first SSO login |
| Audit every lookup | Compliance + rate limiting (10 lookups/hour per user) |
| PII discipline | Lookup returns only `displayName`, `phone`, `discordId` — full HR data never leaves backend |
