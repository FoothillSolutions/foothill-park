/**
 * Seed script — imports existing plate registrations into the database.
 *
 * Strategy (BambooHR is source of truth — run sync FIRST):
 *   1. Match by discord_id        → exact, best case
 *   2. Match by display_name      → case-insensitive, for employees BambooHR synced
 *      When matched by name, also writes the discord_id onto the BambooHR row so
 *      future syncs and lookups work correctly.
 *   3. No match → create a seed_<discordId> placeholder so the plate is still
 *      searchable. The placeholder is absorbed automatically the first time the
 *      real employee registers their plate in the app.
 *
 * Run with:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' src/db/seed-plates.ts
 */

import { db } from './connection';

interface Row {
  plate: string;          // original format  e.g. "3-8439-D"
  normalized: string;     // stripped + upper  e.g. "38439D"
  name: string;
  discordId: string;
}

const rows: Row[] = [
  { plate: '123123',    normalized: '123123',   name: 'faisal',                    discordId: '483883708709994497'  },
  { plate: '7-2992-95', normalized: '7299295',  name: 'Mohammad Omar',             discordId: '710184069643763784'  },
  { plate: '3-8439-D',  normalized: '38439D',   name: 'Omar Abdullah',             discordId: '483881991238975489'  },
  { plate: '3-5604-D',  normalized: '35604D',   name: 'Mahmoud Abd Al Kareem',     discordId: '351628004843061250'  },
  { plate: '3-2372-D',  normalized: '32372D',   name: 'Yousef Najem',              discordId: '1069171223071821844' },
  { plate: '1-0403-D',  normalized: '10403D',   name: 'Omar Dere',                 discordId: '941983102987825152'  },
  { plate: '4-4383-D',  normalized: '44383D',   name: 'Discord 414421498699186196',discordId: '414421498699186196'  },
  { plate: '3-8865-D',  normalized: '38865D',   name: 'Tamer H. Naana',            discordId: '483905369106808867'  },
  { plate: '1-4121-B',  normalized: '14121B',   name: 'Murad Dweikat',             discordId: '927121490812502056'  },
  { plate: '6-8623-96', normalized: '6862396',  name: 'Hamdan',                    discordId: '930833927109750834'  },
  { plate: '3023',      normalized: '3023',     name: 'Discord 488744230244712478',discordId: '488744230244712478'  },
  { plate: '6-6248-96', normalized: '6624896',  name: 'Mohammad Dweikat',          discordId: '792314439444725780'  },
  { plate: '7302394',   normalized: '7302394',  name: 'Arabic User',               discordId: '488744230244712478'  },
  { plate: '1-9484-D',  normalized: '19484D',   name: 'tharwat',                   discordId: '1172114774306340959' },
  { plate: '7-0751-96', normalized: '7075196',  name: 'AbuWard',                   discordId: '631410949487591427'  },
  { plate: '2-2729-A',  normalized: '22729A',   name: 'abu ibrahim',               discordId: '1122424731572908032' },
  { plate: '6-9487-92', normalized: '6948792',  name: 'Omar Abbadi',               discordId: '326777761643364362'  },
  { plate: '1-5126-D',  normalized: '15126D',   name: 'Anas Khraim',               discordId: '1028590144342724629' },
  { plate: '3-3195-D',  normalized: '33195D',   name: 'Abdullah Ahmad',            discordId: '483608265280716811'  },
  { plate: '6-3476-94', normalized: '6347694',  name: 'hanan tbaileh',             discordId: '1383171849000718487' },
  { plate: '1-2949-B',  normalized: '12949B',   name: 'Osaed Yahya',               discordId: '560909384659605094'  },
  { plate: '6-7306-92', normalized: '6730692',  name: 'Basel Alsayed',             discordId: '838342207316033546'  },
  { plate: '1-3913-K',  normalized: '13913K',   name: 'Bashar Qassis',             discordId: '1078270861569703947' },
  { plate: '4-5403-I',  normalized: '45403I',   name: 'Sohaib Najar',              discordId: '977852503070740490'  },
  { plate: '2-7143-A',  normalized: '27143A',   name: 'Mohammad Amarneh',          discordId: '595187030753935370'  },
  { plate: '1-8215-D',  normalized: '18215D',   name: 'Osama Sarwan',              discordId: '1057251839915085854' },
  { plate: '7-0339-96', normalized: '7033996',  name: 'Discord 316226221186875392',discordId: '316226221186875392'  },
  { plate: '30288a',    normalized: '30288A',   name: 'Abdallatif',                discordId: '486202081133330433'  },
  { plate: '115',       normalized: '115',      name: 'AbuSamaha',                 discordId: '1239144996104437813' },
  { plate: '24180A',    normalized: '24180A',   name: 'Ahmed Shubita',             discordId: '1400230192580001954' },
  { plate: '18673d',    normalized: '18673D',   name: 'Discord 950765230978400256',discordId: '950765230978400256'  },
  { plate: '37307D',    normalized: '37307D',   name: 'Wadee Sami',                discordId: '944675938950582272'  },
  { plate: '43409d',    normalized: '43409D',   name: 'Mohammad Jaradat',          discordId: '640510908128559125'  },
  { plate: '66840E',    normalized: '66840E',   name: 'Zaid Direya',               discordId: '591229550600388609'  },
  { plate: '19951a',    normalized: '19951A',   name: 'Ahmad Rabaya',              discordId: '653330831087239178'  },
  { plate: '7-4229-H',  normalized: '74229H',   name: 'Amir Alkam',                discordId: '962294511827054642'  },
  { plate: '3-9956-D',  normalized: '39956D',   name: 'Abdulrahman Mahammdeh',     discordId: '1325385733783031849' },
  { plate: '7-0424-96', normalized: '7042496',  name: 'Zain Abubaker',             discordId: '867849351786659860'  },
  { plate: '301151D',   normalized: '301151D',  name: 'Abu Samaha',                discordId: '1239144996104437813' },
  { plate: '1579D',     normalized: '1579D',    name: 'Shouli',                    discordId: '763134509594968086'  },
  { plate: '21139a',    normalized: '21139A',   name: 'AbuAwad',                   discordId: '484256699209875457'  },
];

async function resolveEmployee(row: Row): Promise<{ id: string; method: string }> {
  // 1. Exact discord_id match (works once BambooHR has discord IDs filled in)
  const byDiscord = await db.query<{ id: string }>(
    `SELECT id FROM employees WHERE discord_id = $1 AND is_active = true LIMIT 1`,
    [row.discordId]
  );
  if (byDiscord.rows[0]) return { id: byDiscord.rows[0].id, method: 'discord_id' };

  // 2. Case-insensitive name match against BambooHR employees
  //    Write discord_id back so future syncs / lookups work correctly.
  const byName = await db.query<{ id: string }>(
    `SELECT id FROM employees
     WHERE is_active = true
       AND LOWER(display_name) = LOWER($1)
       AND (discord_id IS NULL OR discord_id = $2)
     LIMIT 1`,
    [row.name, row.discordId]
  );
  if (byName.rows[0]) {
    await db.query(
      `UPDATE employees SET discord_id = $1, updated_at = NOW() WHERE id = $2`,
      [row.discordId, byName.rows[0].id]
    );
    return { id: byName.rows[0].id, method: 'name' };
  }

  // 3. Fallback — create a seed placeholder so the plate is still searchable.
  //    The placeholder is merged into the real SSO employee automatically
  //    the first time they register their plate in the app.
  const entraId = `seed_${row.discordId}`;
  const created = await db.query<{ id: string }>(
    `INSERT INTO employees (entra_id, display_name, discord_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (entra_id) DO UPDATE SET discord_id = EXCLUDED.discord_id
     RETURNING id`,
    [entraId, row.name, row.discordId]
  );
  return { id: created.rows[0].id, method: 'placeholder' };
}

async function seed() {
  console.log(`\n🌱 Seeding ${rows.length} plates...\n`);

  let inserted = 0;
  let skipped = 0;

  let placeholders = 0;

  for (const row of rows) {
    try {
      const { id: empId, method } = await resolveEmployee(row);

      const result = await db.query(
        `INSERT INTO plates (employee_id, plate_number, plate_normalized, country_code)
         VALUES ($1, $2, $3, 'PS')
         ON CONFLICT (plate_normalized, country_code) DO NOTHING
         RETURNING id`,
        [empId, row.plate, row.normalized]
      );

      if (result.rows.length > 0) {
        const tag = method === 'discord_id' ? '🔵' : method === 'name' ? '🟢' : '🟡';
        console.log(`  ${tag} ${row.plate.padEnd(12)} → ${row.name} [${method}]`);
        inserted++;
        if (method === 'placeholder') placeholders++;
      } else {
        console.log(`  ⏭️  ${row.plate.padEnd(12)} already exists — skipped`);
        skipped++;
      }
    } catch (err: any) {
      console.error(`  ❌ ${row.plate.padEnd(12)} ERROR: ${err.message}`);
    }
  }

  console.log(`\n✅ Done — ${inserted} inserted (${placeholders} placeholders), ${skipped} skipped.\n`);
  if (placeholders > 0) {
    console.log(`  🟡 Placeholder rows will auto-merge when those employees register their plate in the app.\n`);
  }
  await db.end?.();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
