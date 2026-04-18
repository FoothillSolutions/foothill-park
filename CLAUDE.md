# Foothill Park

Internal employee parking resolution app for **Foothill Technology Solutions**.

## What it does

A mobile app that lets employees scan a car's licence plate, look up the owner in the company directory, and contact them immediately — via phone call (Phase 1) or Discord message (Phase 2). The full flow is designed to take under 60 seconds.

## Monorepo structure

```
apps/mobile/    React Native (Expo SDK 54, expo-router)
apps/api/       Node.js + Express + TypeScript backend
docs/           Design doc and architecture notes
```

Root uses **npm workspaces**. Run `npm run mobile` or `npm run api` from the root.

## Tech stack

| Concern | Choice |
|---------|--------|
| Mobile | React Native, Expo SDK 54, expo-router |
| Auth | Microsoft Entra ID (MSAL) — SSO for all employees |
| OCR | Google ML Kit (on-device) — plates never leave the device |
| Backend | Express + TypeScript |
| Database | PostgreSQL (Azure Flexible Server) |
| Secrets | Azure Key Vault |
| Contact | Phone call (Phase 1), Discord deep link (Phase 2) |

## Brand colours

| Token | Hex | Usage |
|-------|-----|-------|
| primary | `#2D6DB5` | Buttons, headers, active states |
| dark | `#1A1A2E` | Text, navigation background |
| accent | `#5BA4E6` | Highlights, secondary actions |
| white | `#FFFFFF` | Backgrounds, card surfaces |

All colours are centralised in `apps/mobile/constants/theme.ts`. Always import from there — never hard-code hex values.

## Key design decisions

- **Mandatory plate registration gate.** After SSO login the backend `GET /api/me` returns `hasPlate: boolean`. If `false`, the app shows only the `onboarding` screen. No other screen is reachable until the user registers a plate. This is the primary adoption mechanism.
- **On-device OCR.** ML Kit runs on the device. No vehicle images are sent to any server.
- **Nightly BambooHR sync.** Employee data is copied to Postgres overnight. The plate-lookup endpoint never calls BambooHR at request time — this keeps the critical path fast and removes the BambooHR API from the P0 dependency chain.
- **Audit every lookup.** `POST /api/plates/lookup` always writes a row to `audit_logs`. Rate limit: 10 lookups/hour per user.
- **PII discipline.** The lookup response returns only `displayName`, `phone`, and `discordId`. Full HR data never leaves the backend.

## API endpoints (Phase 1)

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/health` | Public |
| POST | `/api/auth/token` | Public |
| GET | `/api/me` | Employee JWT |
| POST | `/api/plates/register` | Employee JWT |
| GET | `/api/plates/my` | Employee JWT |
| PUT | `/api/plates/:id` | Employee JWT (own) |
| DELETE | `/api/plates/:id` | Employee JWT (own) |
| POST | `/api/plates/lookup` | Employee JWT + hasPlate |
| GET | `/api/admin/audit-logs` | Admin JWT |

## Database

Schema lives in `apps/api/src/db/migrations/001_initial.sql`.  
Tables: `employees`, `plates`, `audit_logs`.  
Key invariant: `plate_normalized` + `country_code` is unique across all active plates.

## Environment

Copy `apps/api/.env.example` to `apps/api/.env` and fill in values before starting the API.  
**Never commit `.env` or any real secrets.**

## Build sessions (roadmap)

| Session | Focus |
|---------|-------|
| 1 ✅ | Monorepo, Expo scaffold, Express scaffold, brand theme, CLAUDE.md |
| 2 | MSAL login screen, SecureStore token storage |
| 3 | Mandatory plate registration / onboarding gate |
| 4 | Express JWT middleware, `/api/health`, `/api/me`, `/api/plates/register` |
| 5 | `POST /api/plates/lookup` with audit logging and plate-gate middleware |
| 6 | react-native-vision-camera + ML Kit OCR integration |
| 7 | Full scan flow: camera → confirm → lookup → result + call button |
| 8 | Azure deployment, GitHub Actions CI/CD |
