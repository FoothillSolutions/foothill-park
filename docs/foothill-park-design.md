# Foothill Park — Technical Design Document

## Internal Employee Parking Resolution App
### Foothill Technology Solutions

---

## 1. Executive Recommendation

**Build a React Native mobile app backed by a Node.js/Express API on Azure, using Microsoft Entra ID for SSO, on-device OCR for plate scanning, and a lightweight Postgres database as the source of truth for plate-to-employee mappings.**

Do not over-engineer this. The core user journey is 60 seconds long: scan a plate → see a name and phone number → tap to call. Every architectural decision should serve that speed.

Key opinions up front:

- **React Native is a strong fit.** Cross-platform, large ecosystem, mature camera/OCR libraries. No reason to look elsewhere.
- **Skip BambooHR as a real-time data source.** Sync employee data nightly into your own database. Calling BambooHR on every plate scan adds latency, fragility, and a vendor dependency on the critical path.
- **Discord is the company's communication platform.** Discord IDs are already stored in BambooHR. Use phone calls for Phase 1 (fastest for urgent blocking) and Discord messaging for Phase 2.
- **On-device OCR is the right default.** Faster, works offline, and avoids sending images of employee vehicles to cloud services.
- **No AI needed.** The entire app is a straightforward lookup tool. A database query solves the core problem.

### Brand

The app follows the Foothill Technology Solutions brand identity:

- **Primary blue:** `#2D6DB5` (buttons, headers, active states)
- **Dark:** `#1A1A2E` (text, navigation)
- **Accent light blue:** `#5BA4E6` (highlights, secondary actions)
- **White:** `#FFFFFF` (backgrounds, card surfaces)

---

## 2. Best Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Mobile | React Native (Expo SDK 52+) | Cross-platform, mature camera/OCR libs, Expo simplifies builds and OTA updates |
| Backend | Node.js + Express (TypeScript) | Same language as frontend, minimal for ~8 endpoints, TypeScript catches bugs early |
| Database | PostgreSQL (Azure Flexible Server) | Relational data fits naturally, battle-tested, excellent Azure integration |
| Auth | Microsoft Entra ID via MSAL | You already use Microsoft SSO. Gives you token-based auth, conditional access, and group-based RBAC for free |
| OCR | Google ML Kit (on-device) | Free, fast (~200ms), works offline, no images leave the device |
| Hosting | Azure (App Service + PostgreSQL + Key Vault + Monitor) | Already in the Microsoft ecosystem. All data stays on Azure. |
| Contact | Phone call (Phase 1), Discord message (Phase 2) | Call is fastest for urgency. Discord is the company's primary communication platform. |

### Estimated Azure Cost

| Service | Tier | Monthly Cost |
|---------|------|-------------|
| App Service | B1 | ~$13 |
| PostgreSQL Flexible Server | Burstable B1ms | ~$12–15 |
| Key Vault | Low usage | ~$0.03 |
| Monitor | Free tier | $0 |
| **Total** | | **~$25–30/month** |

---

## 3. System Architecture

### Data Flow: Core Journey

1. User opens app → MSAL authenticates via Entra ID → receives JWT
2. **Backend checks: does this user have a plate registered?**
3. **If NO → mandatory plate registration screen. User cannot proceed until they register at least one plate.**
4. If YES → user sees the main screen
5. User taps "Scan Plate" → Camera opens → ML Kit OCR runs on device
6. OCR extracts text → App parses plate number using regex (local)
7. User confirms or edits the recognized plate
8. App sends plate number + JWT to backend: `POST /api/plates/lookup`
9. Backend validates JWT → checks user has 'employee' role
10. Backend queries PostgreSQL for matching plate
11. Backend returns minimal contact info: name, phone, Discord ID
12. Backend logs the lookup in audit_log table
13. User taps "Call" → native phone dialer opens
14. *(Phase 2)* User taps "Discord" → deep link opens Discord DM

### Mandatory Plate Registration

This is the most important design decision for adoption. The app is useless if employees don't register their plates. Every user must register at least one plate before they can use any other feature. This is enforced by:

- Backend: `GET /api/me` returns `hasPlate: true/false`
- Frontend: if `hasPlate` is false, the app shows only the registration screen — no scan, no lookup, no navigation to other screens
- Users can add multiple plates (if they have more than one car) or update their plate at any time from their profile

### What Lives Where

| Concern | Location | Why |
|---------|----------|-----|
| OCR processing | Mobile (on-device) | Speed, privacy, offline capability |
| Plate text parsing | Mobile | Simple regex, no server needed |
| Plate registration gate | Backend + Frontend | Backend is source of truth, frontend enforces the gate |
| Plate-to-employee lookup | Backend only | Access control, audit logging |
| Employee contact data | Backend database only | Never cache PII on device |
| BambooHR sync | Backend scheduled job | API keys must stay server-side |
| Auth tokens | Mobile secure storage (Expo SecureStore) | Never AsyncStorage |
| API keys and secrets | Azure Key Vault | Never in code or mobile app |

---

## 4. MVP Scope

**The MVP answers one question: "Whose car is this and how do I call them?"**

| Feature | Priority |
|---------|----------|
| Microsoft SSO login | Must |
| **Mandatory plate registration on first use** | Must |
| Camera-based plate scan (ML Kit) | Must |
| Manual plate entry fallback | Must |
| Plate confirmation before lookup | Must |
| Plate lookup → name + phone | Must |
| Tap to call | Must |
| Audit logging on every lookup | Must |

**That's it for Phase 1.** Then in Phase 2: Discord messaging, push notifications, rate limiting, admin log viewer, BambooHR auto-sync, lookup history.

---

## 5. Security and Privacy

| Risk | Severity | Mitigation |
|------|----------|------------|
| PII exposure | High | API returns only name + phone + Discord ID. Never full HR data. Enforced server-side. |
| Stalking via lookups | High | Audit log every lookup. Rate limit 10/hour. Alert on unusual patterns. |
| Stolen JWT | High | Short-lived tokens (1h). Entra ID group membership required. HTTPS everywhere. |
| Wrong OCR read | Medium | Show plate to user for confirmation before lookup. Manual edit option. |
| BambooHR key compromise | High | Azure Key Vault. Rotate quarterly. IP-restrict. |
| Stale plate data | Medium | Nightly sync. Users can update their plate from profile. |
| Misuse for harassment | High | Usage policy in app. Audit logs. Admin review process. |

---

## 6. Database Schema

```sql
CREATE TABLE employees (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entra_id        VARCHAR(255) UNIQUE NOT NULL,
    bamboo_id       VARCHAR(100) UNIQUE,
    display_name    VARCHAR(255) NOT NULL,
    phone           VARCHAR(50),
    discord_id      VARCHAR(100),
    department      VARCHAR(255),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE plates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    plate_number    VARCHAR(20) NOT NULL,
    plate_normalized VARCHAR(20) NOT NULL,
    country_code    VARCHAR(5) DEFAULT 'PS',
    is_active       BOOLEAN DEFAULT true,
    registered_by   UUID REFERENCES employees(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(plate_normalized, country_code)
);

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id        UUID NOT NULL REFERENCES employees(id),
    action          VARCHAR(50) NOT NULL,
    target_plate    VARCHAR(20),
    target_employee UUID REFERENCES employees(id),
    metadata        JSONB DEFAULT '{}',
    ip_address      INET,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plates_normalized ON plates(plate_normalized) WHERE is_active = true;
CREATE INDEX idx_audit_actor ON audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_employees_entra ON employees(entra_id);
```

---

## 7. API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/token` | Public | Exchange MSAL auth code for app session |
| GET | `/api/me` | Employee | Current user's profile (includes `hasPlate` flag) |
| POST | `/api/plates/lookup` | Employee | Plate → owner contact info (blocked if user has no plate) |
| GET | `/api/plates/my` | Employee | List user's registered plates |
| POST | `/api/plates/register` | Employee | Register a plate |
| PUT | `/api/plates/:id` | Employee (own) | Update a plate |
| DELETE | `/api/plates/:id` | Employee (own) | Remove a plate |
| POST | `/api/contact/log` | Employee | Log a call/message action |
| GET | `/api/admin/audit-logs` | Admin | Query audit logs |
| POST | `/api/admin/sync-bamboo` | Admin | Trigger manual BambooHR sync |
| GET | `/api/health` | Public | Health check |

### Lookup Response

```json
// POST /api/plates/lookup
// Request:
{ "plateNumber": "12-345-67" }

// Response:
{
  "found": true,
  "owner": {
    "displayName": "Ahmad K.",
    "phone": "+970-599-XXX-XXX",
    "discordId": "123456789012345678",
    "department": "Engineering"
  }
}
```

---

## 8. Implementation Roadmap

**Phase 1 — MVP (Weeks 1–4):** Auth + mandatory plate registration + OCR + lookup + call. Deploy to internal testing.

**Phase 2 — Beta (Weeks 5–8):** Rate limiting, Discord deep link messaging, push notifications, BambooHR auto-sync, admin log viewer, lookup history. Roll out to 20–50 users.

**Phase 3 — Production (Weeks 9–12):** Azure Monitor dashboards, anomaly alerting (SQL thresholds), data retention automation, offboarding automation, pen test, RBAC, admin dashboard, bulk plate import.

---

## 9. Repo Structure

```
foothill-park/
├── apps/
│   └── mobile/                     # React Native (Expo) app
│       ├── app/                    # Expo Router screens
│       │   ├── (auth)/             # Auth-gated screens
│       │   │   ├── _layout.tsx
│       │   │   ├── scan.tsx        # Camera + OCR screen
│       │   │   ├── result.tsx      # Lookup result + contact actions
│       │   │   ├── register.tsx    # Register / update your plate
│       │   │   ├── history.tsx     # Recent lookups
│       │   │   └── profile.tsx     # User profile + settings
│       │   ├── onboarding.tsx      # Mandatory plate registration
│       │   ├── login.tsx           # MSAL sign-in screen
│       │   └── _layout.tsx         # Root layout (plate gate logic)
│       ├── components/
│       │   ├── PlateScanner.tsx
│       │   ├── PlateInput.tsx
│       │   ├── ContactCard.tsx
│       │   └── CallButton.tsx
│       ├── services/
│       │   ├── auth.ts             # MSAL configuration
│       │   ├── api.ts              # Backend API client
│       │   └── ocr.ts             # ML Kit integration
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   └── usePlateScan.ts
│       ├── constants/
│       │   └── theme.ts            # Foothill brand colors + typography
│       ├── utils/
│       │   └── plateParser.ts      # Regex plate extraction
│       ├── app.json
│       ├── tsconfig.json
│       └── package.json
│
├── apps/
│   └── api/                        # Node.js backend
│       ├── src/
│       │   ├── routes/
│       │   │   ├── auth.ts
│       │   │   ├── plates.ts
│       │   │   ├── contact.ts
│       │   │   └── admin.ts
│       │   ├── middleware/
│       │   │   ├── authenticate.ts
│       │   │   ├── authorize.ts
│       │   │   ├── requirePlate.ts   # Block lookup if user has no plate
│       │   │   ├── rateLimit.ts
│       │   │   └── auditLog.ts
│       │   ├── services/
│       │   │   ├── plateService.ts
│       │   │   ├── employeeService.ts
│       │   │   ├── bambooSync.ts
│       │   │   └── discordService.ts
│       │   ├── models/
│       │   │   ├── employee.ts
│       │   │   ├── plate.ts
│       │   │   └── auditLog.ts
│       │   ├── db/
│       │   │   ├── connection.ts
│       │   │   └── migrations/
│       │   │       └── 001_initial.sql
│       │   ├── config/
│       │   │   └── index.ts
│       │   └── app.ts
│       ├── tests/
│       │   ├── plates.test.ts
│       │   └── auth.test.ts
│       ├── tsconfig.json
│       └── package.json
│
├── infra/
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── database.tf
│   │   └── app-service.tf
│   └── scripts/
│       └── seed-db.sh
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── privacy.md
│   └── runbook.md
│
├── .github/
│   └── workflows/
│       ├── api-ci.yml
│       └── mobile-ci.yml
│
├── package.json                    # Monorepo root (workspaces)
├── turbo.json                      # Turborepo config
└── README.md
```

---

## 10. First 10 Steps

1. Create Expo project with TypeScript and expo-router, set up Foothill brand theme (colors, fonts)
2. Set up MSAL authentication with Entra ID (register app, configure redirects, build login screen)
3. Build mandatory plate registration screen (onboarding gate — user cannot proceed without a plate)
4. Build Express/TypeScript backend with JWT validation middleware and `/api/health`
5. Set up Azure PostgreSQL, run initial migration, seed test data
6. Implement `GET /api/me` (with `hasPlate` flag) and `POST /api/plates/register`
7. Implement `POST /api/plates/lookup` with audit logging and plate-gate middleware
8. Integrate react-native-vision-camera + ML Kit OCR + plate regex parser
9. Build the scan flow: camera → plate confirmation → API lookup → result screen + call button
10. Deploy via Expo EAS Build, test with 5 colleagues in the real parking lot

---

## 11. What to Build Now vs. Later

| Now (Phase 1) | Next (Phase 2) | Later (Phase 3) | Never |
|-----------|-------------|------------|-------|
| MSAL login | Discord deep link messaging | Admin dashboard | Custom ML plate model |
| **Mandatory plate registration** | Push notifications | Bulk plate import | "Find my car" feature |
| On-device OCR | Rate limiting | Employee offboarding automation | Real-time lot occupancy |
| Manual plate entry | BambooHR auto-sync | Anomaly alerting (SQL threshold) | Vehicle make/model recognition |
| Plate lookup API | Admin log viewer | Penetration test | Social features |
| Tap to call | Lookup history | RBAC roles | Any AI/chatbot features |
| Audit logging | Update/manage plates | Data retention automation | |

---

*Foothill Park — Internal planning document for Foothill Technology Solutions. Last updated: April 2026.*
