import { db } from '../db/connection';

export interface Plate {
  id: string;
  plateNumber: string;
  plateNormalized: string;
  countryCode: string;
  isActive: boolean;
}

function normalizePlate(raw: string): string {
  return raw.replace(/[\s\-]/g, '').toUpperCase();
}

export async function registerPlate(
  employeeId: string,
  plateNumber: string,
  countryCode = 'PS'
): Promise<Plate> {
  const plateNormalized = normalizePlate(plateNumber);

  // Deactivate any existing plates for this employee first
  await db.query(
    `UPDATE plates SET is_active = false WHERE employee_id = $1`,
    [employeeId]
  );

  const result = await db.query<Plate>(
    `INSERT INTO plates (employee_id, plate_number, plate_normalized, country_code, registered_by)
     VALUES ($1, $2, $3, $4, $1)
     ON CONFLICT (plate_normalized, country_code)
     DO UPDATE SET employee_id = $1, is_active = true, updated_at = NOW()
     RETURNING id, plate_number AS "plateNumber", plate_normalized AS "plateNormalized",
               country_code AS "countryCode", is_active AS "isActive"`,
    [employeeId, plateNumber.toUpperCase(), plateNormalized, countryCode]
  );
  return result.rows[0];
}

export async function getMyPlates(employeeId: string): Promise<Plate[]> {
  const result = await db.query<Plate>(
    `SELECT id, plate_number AS "plateNumber", plate_normalized AS "plateNormalized",
            country_code AS "countryCode", is_active AS "isActive"
     FROM plates WHERE employee_id = $1 ORDER BY created_at DESC`,
    [employeeId]
  );
  return result.rows;
}

export async function lookupPlate(plateNumber: string): Promise<{
  found: boolean;
  owner?: { displayName: string; phone: string | null; discordId: string | null; department: string | null };
}> {
  const plateNormalized = normalizePlate(plateNumber);
  const result = await db.query(
    `SELECT e.display_name AS "displayName", e.phone, e.discord_id AS "discordId", e.department
     FROM plates p
     JOIN employees e ON e.id = p.employee_id
     WHERE p.plate_normalized = $1 AND p.is_active = true AND e.is_active = true`,
    [plateNormalized]
  );
  if (!result.rows[0]) return { found: false };
  return { found: true, owner: result.rows[0] };
}
