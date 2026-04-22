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

  // 1. Existing SSO row — update name + email, then absorb any BambooHR orphan
  const byEntraId = await db.query<Employee>(
    `UPDATE employees
     SET display_name = $2, email = COALESCE(email, $3), updated_at = NOW()
     WHERE entra_id = $1
     RETURNING ${SELECT_COLS}`,
    [entraId, displayName, normalizedEmail]
  );
  if (byEntraId.rows[0]) {
    // SSO row already exists — merge any separate BambooHR orphan into it
    await mergeBambooRow(byEntraId.rows[0].id, entraId, normalizedEmail);
    // Re-fetch to pick up any fields just merged in
    const refreshed = await db.query<Employee>(
      `SELECT ${SELECT_COLS} FROM employees WHERE entra_id = $1`,
      [entraId]
    );
    return refreshed.rows[0];
  }

  // 2. Pre-populated BambooHR row — link their Entra ID on first login.
  //    The plate is already on this row so it becomes immediately visible.
  const byEmail = await db.query<Employee>(
    `UPDATE employees
     SET entra_id = $1, display_name = $2, updated_at = NOW()
     WHERE email = $3 AND entra_id IS NULL
     RETURNING ${SELECT_COLS}`,
    [entraId, displayName, normalizedEmail]
  );
  if (byEmail.rows[0]) {
    console.log(`[employeeService] linked BambooHR row → ${displayName} (${entraId})`);
    return byEmail.rows[0];
  }

  // 3. Seed placeholder — upgrade it to a real SSO employee on first login
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
 * Called only when the SSO row already exists.
 * If there is a separate BambooHR orphan with the same email, absorb it:
 * copy bamboo_id/phone/department/discord onto the SSO row, transfer plates,
 * then deactivate the orphan.
 */
async function mergeBambooRow(ssoRowId: string, entraId: string, email: string): Promise<void> {
  if (!email) return;

  const bamboo = await db.query<{ id: string; bamboo_id: string; phone: string | null; department: string | null; discord_id: string | null; discord_username: string | null }>(
    `SELECT id, bamboo_id, phone, department, discord_id, discord_username
     FROM employees
     WHERE email = $1 AND entra_id IS NULL AND bamboo_id IS NOT NULL
     LIMIT 1`,
    [email]
  );
  if (!bamboo.rows[0]) return;

  const { id: bambooRowId, bamboo_id, phone, department, discord_id, discord_username } = bamboo.rows[0];

  // Transfer plates from BambooHR row → SSO row
  await db.query(
    `UPDATE plates SET employee_id = $1, updated_at = NOW() WHERE employee_id = $2`,
    [ssoRowId, bambooRowId]
  );

  // Clear bamboo_id on orphan first (unique constraint)
  await db.query(
    `UPDATE employees SET bamboo_id = NULL, updated_at = NOW() WHERE id = $1`,
    [bambooRowId]
  );

  // Copy BambooHR fields onto SSO row
  await db.query(
    `UPDATE employees
     SET bamboo_id        = $2,
         phone            = COALESCE(phone, $3),
         department       = COALESCE(department, $4),
         discord_id       = COALESCE(discord_id, $5),
         discord_username = COALESCE(discord_username, $6),
         updated_at       = NOW()
     WHERE entra_id = $1`,
    [entraId, bamboo_id, phone, department, discord_id, discord_username]
  );

  // Deactivate and clear email on the now-empty orphan
  await db.query(
    `UPDATE employees SET is_active = false, email = NULL, updated_at = NOW() WHERE id = $1`,
    [bambooRowId]
  );

  console.log(`[employeeService] merged BambooHR row (bamboo_id:${bamboo_id}) into SSO row for ${email}`);
}

/**
 * Tries to find a seed placeholder (entra_id LIKE 'seed_%') whose display_name
 * is a close enough match to the SSO employee's display_name.
 */
async function mergeSeedPlaceholder(
  entraId: string,
  displayName: string,
  email: string
): Promise<Employee | null> {
  const seeds = await db.query<{ id: string; display_name: string }>(
    `SELECT id, display_name FROM employees
     WHERE entra_id LIKE 'seed_%' AND is_active = true`
  );
  if (!seeds.rows.length) return null;

  const ssoWords = displayName.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  let bestId: string | null = null;

  for (const row of seeds.rows) {
    const seedName = row.display_name.toLowerCase();
    if (seedName === displayName.toLowerCase()) { bestId = row.id; break; }
    const seedWords = seedName.split(/\s+/).filter(w => w.length > 3);
    const common = ssoWords.filter(w => seedWords.includes(w));
    if (common.length >= 2) { bestId = row.id; break; }
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

export async function hasActivePlate(employeeId: string): Promise<boolean> {
  const result = await db.query(
    `SELECT 1 FROM plates WHERE employee_id = $1 AND is_active = true LIMIT 1`,
    [employeeId]
  );
  return result.rowCount! > 0;
}
