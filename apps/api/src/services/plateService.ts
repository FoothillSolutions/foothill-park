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

  // ── Merge seed placeholder ───────────────────────────────────────────────
  // If the plate currently belongs to a seed placeholder employee
  // (entra_id starts with 'seed_'), absorb all their plates and deactivate
  // the placeholder so there are no duplicate employee rows.
  const seedCheck = await db.query<{ seedEmpId: string }>(
    `SELECT e.id AS "seedEmpId"
     FROM plates p
     JOIN employees e ON e.id = p.employee_id
     WHERE p.plate_normalized = $1
       AND p.country_code     = $2
       AND e.entra_id LIKE 'seed_%'
     LIMIT 1`,
    [plateNormalized, countryCode]
  );

  if (seedCheck.rows[0]) {
    const seedEmpId = seedCheck.rows[0].seedEmpId;
    // Transfer ALL of the seed employee's plates to the real SSO employee
    await db.query(
      `UPDATE plates SET employee_id = $1, updated_at = NOW() WHERE employee_id = $2`,
      [employeeId, seedEmpId]
    );
    // Retire the now-empty seed placeholder
    await db.query(
      `UPDATE employees SET is_active = false, updated_at = NOW() WHERE id = $1`,
      [seedEmpId]
    );
    console.log(`[plateService] merged seed placeholder ${seedEmpId} → employee ${employeeId}`);
  }

  // Deactivate any OTHER plates this employee already has
  await db.query(
    `UPDATE plates SET is_active = false WHERE employee_id = $1 AND plate_normalized != $2`,
    [employeeId, plateNormalized]
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
     FROM plates WHERE employee_id = $1 AND is_active = true ORDER BY created_at DESC`,
    [employeeId]
  );
  return result.rows;
}

export async function lookupPlate(plateNumber: string): Promise<{
  found: boolean;
  owner?: { displayName: string; phone: string | null; discordId: string | null; discordUsername: string | null; department: string | null };
}> {
  const plateNormalized = normalizePlate(plateNumber);
  const result = await db.query(
    `SELECT e.display_name AS "displayName", e.phone, e.discord_id AS "discordId",
            e.discord_username AS "discordUsername", e.department
     FROM plates p
     JOIN employees e ON e.id = p.employee_id
     WHERE p.plate_normalized = $1 AND p.is_active = true AND e.is_active = true`,
    [plateNormalized]
  );
  if (!result.rows[0]) return { found: false };
  return { found: true, owner: result.rows[0] };
}
