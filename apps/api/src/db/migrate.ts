import fs from 'fs';
import path from 'path';
import { db } from './connection';

export async function runMigrations() {
  const sql = fs.readFileSync(
    path.join(__dirname, 'migrations/001_initial.sql'),
    'utf-8'
  );
  await db.query(sql);
  console.log('[DB] Migrations applied');
}
