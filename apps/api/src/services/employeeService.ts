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

  // 1. Existing SSO employee — always update name + fill in email if missing
  const byEntraId = await db.query<Employee>(
    `UPDATE employees
     SET display_name = $2, email = COALESCE(email, $3), updated_at = NOW()
     WHERE entra_id = $1
     RETURNING ${SELECT_COLS}`,
    [entraId, displayName, normalizedEmail]
  );
  if (byEntraId.rows[0]) {
    // Merge orphan BambooHR row for same email (covers the case where SSO row
    // was created before sync and a separate BambooHR row now exists)
    await mergeBambooRow(entraId, normalizedEmail);
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

  // 3. Brand-new employee — create from SSO data
  const created = await db.query<Employee>(
    `INSERT INTO employees (entra_id, display_name, email)
     VALUES ($1, $2, $3)
     RETURNING ${SELECT_COLS}`,
    [entraId, displayName, normalizedEmail]
  );
  return created.rows[0];
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
  await db.query(
    `UPDATE employees SET is_active = false, updated_at = NOW()
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
