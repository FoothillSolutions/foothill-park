import { db } from '../db/connection';

export interface Employee {
  id: string;
  entraId: string;
  displayName: string;
  email: string;
  phone: string | null;
  discordId: string | null;
  department: string | null;
  isActive: boolean;
}

const SELECT_COLS = `
  id,
  entra_id      AS "entraId",
  display_name  AS "displayName",
  email,
  phone,
  discord_id    AS "discordId",
  department,
  is_active     AS "isActive"
`;

export async function findOrCreateEmployee(
  entraId: string,
  displayName: string,
  email: string
): Promise<Employee> {
  const normalizedEmail = email.toLowerCase();

  // 1. Existing SSO employee — always update name + fill in email if missing.
  // Pre-emptively merge any BambooHR orphan FIRST so the email slot is free
  // before we try to set it on the SSO row (avoids unique-constraint violation).
  await mergeBambooRow(entraId, normalizedEmail);

  const byEntraId = await db.query<Employee>(
    `UPDATE employees
     SET display_name = $2, email = COALESCE(email, $3), updated_at = NOW()
     WHERE entra_id = $1
     RETURNING ${SELECT_COLS}`,
    [entraId, displayName, normalizedEmail]
  );
  if (byEntraId.rows[0]) {
    return byEntraId.rows[0];
  }

  // 2. Pre-populated BambooHR row — link their Entra ID on first login
  const byEmail = await db.query<Employee>(
    `UPDATE employees
     SET entra_id = $1, display_name = $2, updated_at = NOW()
     WHERE email = $3 AND entra_id IS NULL
     RETURNING ${SELECT_COLS}`,
    [entraId, displayName, normalizedEmail]
  );
  if (byEmail.rows[0]) return byEmail.rows[0];

  // 3. Seed placeholder — upgrade it to a real SSO employee on first login.
  //    Match by exact display name first, then by individual name words so
  //    "Mahmoud Abdelkareem" links to the seed row "Mahmoud Abd Al Kareem".
  const seedRow = await mergeSeedPlaceholder(entraId, displayName, normalizedEmail);
  if (seedRow) {
    console.log(`[employeeService] upgraded seed placeholder → ${displayName} (${entraId})`);
    return seedRow;
  }

  // 4. Brand-new employee — create from SSO data
  const created = await db.query<Employee>(
    `INSERT INTO employees (entra_id, display_name, email)
     VALUES ($1, $2, $3)
     RETURNING ${SELECT_COLS}`,
    [entraId, displayName, normalizedEmail]
  );
  return created.rows[0];
}

/**
 * Tries to find a seed placeholder (entra_id LIKE 'seed_%') whose display_name
 * is a close enough match to the SSO employee's display_name.
 *
 * Matching rules (tried in order):
 *   a) Exact case-insensitive match
 *   b) At least 2 name words (>3 chars each) appear in both names
 *
 * When matched, the placeholder row is upgraded in-place:
 *   - entra_id  ← real SSO id
 *   - email     ← SSO email
 *   - display_name ← SSO display name (official spelling)
 * The employee's existing plates remain attached and are immediately visible.
 */
async function mergeSeedPlaceholder(
  entraId: string,
  displayName: string,
  email: string
): Promise<Employee | null> {
  // Fetch all active seed placeholders
  const seeds = await db.query<{ id: string; display_name: string }>(
    `SELECT id, display_name FROM employees
     WHERE entra_id LIKE 'seed_%' AND is_active = true`
  );
  if (!seeds.rows.length) return null;

  const ssoWords = displayName.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  let bestId: string | null = null;

  for (const row of seeds.rows) {
    const seedName = row.display_name.toLowerCase();

    // Rule a: exact
    if (seedName === displayName.toLowerCase()) {
      bestId = row.id;
      break;
    }

    // Rule b: 2+ significant words in common
    const seedWords = seedName.split(/\s+/).filter(w => w.length > 3);
    const common = ssoWords.filter(w => seedWords.includes(w));
    if (common.length >= 2) {
      bestId = row.id;
      break;
    }
  }

  if (!bestId) return null;

  const upgraded = await db.query<Employee>(
    `UPDATE employees
     SET entra_id     = $1,
         display_name = $2,
         email        = COALESCE(email, $3),
         updated_at   = NOW()
     WHERE id = $4
     RETURNING ${SELECT_COLS}`,
    [entraId, displayName, email, bestId]
  );
  return upgraded.rows[0] ?? null;
}

async function mergeBambooRow(entraId: string, email: string): Promise<void> {
  if (!email) return;
  const bamboo = await db.query(
    `SELECT bamboo_id, phone, department, discord_id FROM employees
     WHERE email = $1 AND entra_id IS NULL AND bamboo_id IS NOT NULL LIMIT 1`,
    [email]
  );
  if (!bamboo.rows[0]) return;

  const { bamboo_id, phone, department, discord_id } = bamboo.rows[0];
  await db.query(
    `UPDATE employees
     SET bamboo_id = $2,
         phone = COALESCE(phone, $3),
         department = COALESCE(department, $4),
         discord_id = COALESCE(discord_id, $5),
         updated_at = NOW()
     WHERE entra_id = $1`,
    [entraId, bamboo_id, phone, department, discord_id]
  );
  // Clear email on the orphan so the unique index no longer blocks the SSO row
  await db.query(
    `UPDATE employees SET is_active = false, email = NULL, updated_at = NOW()
     WHERE email = $1 AND entra_id IS NULL`,
    [email]
  );
  console.log(`[employeeService] merged BambooHR row (bamboo_id:${bamboo_id}) into SSO row for ${email}`);
}

export async function hasActivePlate(employeeId: string): Promise<boolean> {
  const result = await db.query(
    `SELECT 1 FROM plates WHERE employee_id = $1 AND is_active = true LIMIT 1`,
    [employeeId]
  );
  return result.rowCount! > 0;
}
