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

export async function findOrCreateEmployee(
  entraId: string,
  displayName: string,
  email: string
): Promise<Employee> {
  const existing = await db.query<Employee>(
    `SELECT id, entra_id AS "entraId", display_name AS "displayName",
            phone, discord_id AS "discordId", department, is_active AS "isActive"
     FROM employees WHERE entra_id = $1`,
    [entraId]
  );
  if (existing.rows[0]) return existing.rows[0];

  const created = await db.query<Employee>(
    `INSERT INTO employees (entra_id, display_name)
     VALUES ($1, $2)
     RETURNING id, entra_id AS "entraId", display_name AS "displayName",
               phone, discord_id AS "discordId", department, is_active AS "isActive"`,
    [entraId, displayName]
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
