/**
 * Clears all data from audit_logs, plates, and employees (in FK-safe order).
 * Run before re-seeding.
 *
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' src/db/clear-tables.ts
 */

import { db } from './connection';

async function clearTables() {
  console.log('\n🗑️  Clearing tables...\n');

  // FK order: audit_logs → plates → employees
  const auditResult  = await db.query('DELETE FROM audit_logs');
  const plateResult  = await db.query('DELETE FROM plates');
  const empResult    = await db.query('DELETE FROM employees');

  console.log(`  ✅ audit_logs : ${auditResult.rowCount} rows deleted`);
  console.log(`  ✅ plates     : ${plateResult.rowCount} rows deleted`);
  console.log(`  ✅ employees  : ${empResult.rowCount} rows deleted`);
  console.log('\n✅ All tables cleared.\n');

  await db.end?.();
  process.exit(0);
}

clearTables().catch((err) => {
  console.error('Clear failed:', err);
  process.exit(1);
});
