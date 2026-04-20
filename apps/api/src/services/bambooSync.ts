import { config } from '../config';
import { db } from '../db/connection';

interface BambooEmployee {
  id: string | number;
  firstName?: string;
  lastName?: string;
  preferredName?: string;
  displayName?: string;
  fullName?: string;
  fullName1?: string;
  name?: string;
  workEmail?: string;
  department?: string;
  mobilePhone?: string;
  workPhone?: string;
  homePhone?: string;
  status?: string;
  discordName?: string;
  customDiscordName?: string;
  [key: string]: unknown;
}

interface BambooReport {
  employees: BambooEmployee[];
}

export interface SyncResult {
  inserted: number;
  updated: number;
  linked: number;
  deactivated: number;
}

function buildDisplayName(emp: BambooEmployee): string {
  if (emp.fullName1) return String(emp.fullName1);
  if (emp.fullName) return String(emp.fullName);
  if (emp.displayName) return String(emp.displayName);
  if (emp.name) return String(emp.name);
  if (emp.preferredName) return String(emp.preferredName);
  const first = emp.firstName ?? '';
  const last = emp.lastName ?? '';
  return `${first} ${last}`.trim() || `Employee ${emp.id}`;
}

function buildPhone(emp: BambooEmployee): string | null {
  return emp.mobilePhone || emp.homePhone || emp.workPhone || null;
}

function buildDiscordId(emp: BambooEmployee): string | null {
  return emp.customDiscordName || emp.discordName || null;
}

async function fetchReport(): Promise<BambooEmployee[]> {
  const { apiKey, subdomain } = config.bambooHr;
  if (!apiKey || !subdomain) throw new Error('BAMBOOHR_API_KEY and BAMBOOHR_SUBDOMAIN must be set');

  const url = `https://api.bamboohr.com/api/gateway.php/${subdomain}/v1/reports/314`;
  const credentials = Buffer.from(`${apiKey}:x`).toString('base64');

  const res = await fetch(url, {
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`BambooHR API error (${res.status}): ${body}`);
  }

  const data: BambooReport = await res.json();
  return data.employees ?? [];
}

export async function runBambooSync(): Promise<SyncResult> {
  const result: SyncResult = { inserted: 0, updated: 0, linked: 0, deactivated: 0 };

  console.log('[bambooSync] fetching report…');
  const employees = await fetchReport();
  console.log(`[bambooSync] fetched ${employees.length} employees`);
  if (employees.length > 0) {
    console.log('[bambooSync] first employee raw keys:', Object.keys(employees[0]));
    console.log('[bambooSync] first employee sample:', JSON.stringify(employees[0]));
  }

  const activeBambooIds: string[] = [];

  for (const emp of employees) {
    const isActive = !emp.status || emp.status.toLowerCase() === 'active';
    if (!isActive) continue;

    const bambooId = String(emp.id);
    const displayName = buildDisplayName(emp);
    const phone = buildPhone(emp);
    const department = emp.department ? String(emp.department) : null;
    const email = emp.workEmail ? String(emp.workEmail).toLowerCase() : null;
    const discordId = buildDiscordId(emp);

    activeBambooIds.push(bambooId);

    // 1. Update existing row matched by bamboo_id
    const byId = await db.query(
      `UPDATE employees
       SET display_name = $2, phone = $3, department = $4, email = COALESCE(email, $5),
           discord_id = $6, is_active = true, updated_at = NOW()
       WHERE bamboo_id = $1`,
      [bambooId, displayName, phone, department, email, discordId]
    );
    if ((byId.rowCount ?? 0) > 0) { result.updated++; continue; }

    // 2. Link to existing SSO employee by email (sets bamboo_id on their row)
    if (email) {
      const byEmail = await db.query(
        `UPDATE employees
         SET bamboo_id = $1, phone = COALESCE(phone, $3), department = COALESCE(department, $4),
             discord_id = $5, updated_at = NOW()
         WHERE email = $2 AND bamboo_id IS NULL`,
        [bambooId, email, phone, department, discordId]
      );
      if ((byEmail.rowCount ?? 0) > 0) { result.linked++; continue; }
    }

    // 3. Pre-populate employee — they'll link to their Entra ID on first SSO login
    await db.query(
      `INSERT INTO employees (bamboo_id, display_name, email, phone, department, discord_id, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())`,
      [bambooId, displayName, email, phone, department, discordId]
    );
    result.inserted++;
  }

  // Deactivate employees no longer in the report
  if (activeBambooIds.length > 0) {
    const activeEmails = employees
      .filter(e => e.workEmail)
      .map(e => String(e.workEmail).toLowerCase());

    // Case 1: has a bamboo_id but not in this report (left the company)
    const byBambooId = await db.query(
      `UPDATE employees SET is_active = false, updated_at = NOW()
       WHERE bamboo_id IS NOT NULL
         AND bamboo_id != ALL($1::text[])
         AND is_active = true`,
      [activeBambooIds]
    );

    // Case 2: SSO-only employee (no bamboo_id) whose email is no longer in BambooHR
    const byEmail = activeEmails.length > 0 ? await db.query(
      `UPDATE employees SET is_active = false, updated_at = NOW()
       WHERE bamboo_id IS NULL
         AND email IS NOT NULL
         AND email != ALL($1::text[])
         AND is_active = true`,
      [activeEmails]
    ) : { rowCount: 0 };

    result.deactivated = (byBambooId.rowCount ?? 0) + (byEmail.rowCount ?? 0);
  }

  console.log(
    `[bambooSync] done — inserted:${result.inserted} updated:${result.updated} ` +
    `linked:${result.linked} deactivated:${result.deactivated}`
  );

  const active = await db.query(
    `SELECT bamboo_id, display_name, email, is_active FROM employees ORDER BY is_active DESC, display_name ASC`
  );

  return result;
}
