# Foothill Park — API Reference

Base URL: `https://foothill-park.foothilltech.net`

All protected endpoints require `Authorization: Bearer <idToken>` (Microsoft Entra ID JWT).

---

## Public

### `GET /api/health`

Health check. Tests database connectivity.

**Response**
```json
{
  "status": "ok",
  "db": "connected",
  "version": "1.1.0"
}
```

---

## Employee

### `GET /api/me`

Returns the authenticated user's profile and whether they have a registered plate.
Creates the employee row on first login (find-or-create with multi-source reconciliation).

**Auth**: JWT

**Response**
```json
{
  "entraId": "abc-123",
  "displayName": "Mahmoud Abd AlKareem",
  "email": "m.abdalkareem@foothillsolutions.com",
  "department": "Engineering",
  "hasPlate": true
}
```

---

### `GET /api/employees`

Returns all active employees. Used by the mobile directory screen.

**Auth**: JWT

**Response**
```json
[
  {
    "id": "uuid",
    "displayName": "Jane Smith",
    "department": "HR",
    "phone": "+970591234567",
    "discordId": "123456789",
    "discordUsername": "janesmith"
  }
]
```

---

## Plates

### `GET /api/plates/my`

Returns the authenticated user's active plates.

**Auth**: JWT

**Response**
```json
[
  {
    "id": "uuid",
    "plateNumber": "7-0339-96",
    "plateNormalized": "7033996",
    "countryCode": "PS",
    "isActive": true
  }
]
```

---

### `POST /api/plates/register`

Register a licence plate for the authenticated user.
Deactivates any existing active plates. Transfers seed placeholder plates if applicable.

**Auth**: JWT

**Request**
```json
{ "plateNumber": "7-0339-96" }
```

**Response** `201`
```json
{
  "id": "uuid",
  "plateNumber": "7-0339-96",
  "plateNormalized": "7033996",
  "countryCode": "PS",
  "isActive": true
}
```

**Errors**
- `400` — Missing or invalid plate number
- `409` — Plate already registered to another employee

---

### `POST /api/plates/lookup`

Look up who owns a given plate. Writes an audit log entry on every call.

**Auth**: JWT + must have an active registered plate (`requirePlate` middleware)

**Rate limit**: 10 lookups per hour per user

**Request**
```json
{ "plateNumber": "7-0339-96" }
```

**Response — found**
```json
{
  "found": true,
  "owner": {
    "displayName": "Jane Smith",
    "phone": "+970591234567",
    "discordId": "123456789",
    "discordUsername": "janesmith",
    "department": "Engineering"
  }
}
```

**Response — not found**
```json
{ "found": false }
```

**Errors**
- `400` — Missing plate number
- `403` — Caller has no registered plate

---

## Discord

### `POST /api/discord/dm`

Send a Discord DM to a plate owner notifying them their car is blocking.

**Auth**: JWT + must have an active registered plate

**Request**
```json
{
  "discordUsername": "janesmith",
  "ownerName": "Jane Smith"
}
```

**Response**
```json
{ "ok": true }
```

**Errors**
- `404` — Discord member not found in server
- `503` — Discord bot not configured (missing `DISCORD_BOT_TOKEN` or `DISCORD_GUILD_ID`)

---

## Admin

### `GET /api/admin/audit-logs`

Paginated audit log. Admin use only.

**Auth**: JWT (admin check enforced in mobile — not a separate role at API level)

**Query params**
| Param | Default | Max |
|-------|---------|-----|
| `limit` | 50 | 200 |
| `offset` | 0 | — |

**Response**
```json
{
  "logs": [
    {
      "id": "uuid",
      "actorId": "uuid",
      "actorName": "Mahmoud Abd AlKareem",
      "action": "PLATE_LOOKUP",
      "targetPlate": "7033996",
      "targetEmployeeId": "uuid",
      "metadata": {},
      "ipAddress": "192.168.1.1",
      "createdAt": "2026-04-23T10:00:00Z"
    }
  ],
  "limit": 50,
  "offset": 0
}
```

---

### `POST /api/admin/sync-bamboo`

Manually trigger a BambooHR employee sync. Normally runs automatically every Sunday at 02:00.

**Auth**: JWT

**Response**
```json
{
  "ok": true,
  "result": {
    "inserted": 3,
    "updated": 12,
    "linked": 1,
    "deactivated": 0
  }
}
```

**Notes**
- Timeout: 120 seconds
- Requires `BAMBOOHR_API_KEY` and `BAMBOOHR_SUBDOMAIN` environment variables
- Fetches BambooHR report 314 (all active employees)
