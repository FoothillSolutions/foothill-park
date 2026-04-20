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

  // 1. Existing SSO employee
  const byEntraId = await db.query<Employee>(
    `SELECT ${SELECT_COLS} FROM employees WHERE entra_id = $1`,
    [entraId]
  );
  if (byEntraId.rows[0]) return byEntraId.rows[0];

  // 2. Pre-populated BambooHR row — link their Entra ID on first login
  const byEmail = await db.query<Employee>(
    `UPDATE employees
     SET entra_id = $1, display_name = $2, email = $3, updated_at = NOW()
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

export async function hasActivePlate(employeeId: string): Promise<boolean> {
  const result = await db.query(
    `SELECT 1 FROM plates WHERE employee_id = $1 AND is_active = true LIMIT 1`,
    [employeeId]
  );
  return result.rowCount! > 0;
}
