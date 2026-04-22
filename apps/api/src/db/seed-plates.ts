/**
 * Seed script — seeds the plates table using BambooHR as the sole source of truth.
 *
 * Strategy:
 *   1. For each plate, look up the confirmed discordId → bambooEmail mapping.
 *   2. Find the BambooHR employee in the DB by email.
 *   3. Insert the plate linked to that employee.
 *   4. If no mapping exists (unknown Discord user), skip with a warning.
 *
 * Run AFTER a fresh BambooHR sync:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' src/db/seed-plates.ts
 */

import { db } from './connection';

// ── Plate data ────────────────────────────────────────────────────────────────
// plate: original format, normalized: stripped+upper, discordId: Discord user ID
const PLATES: { plate: string; normalized: string; discordId: string }[] = [
  { plate: '7-2992-95', normalized: '7299295',  discordId: '710184069643763784'  }, // Mohammad Omar
  { plate: '3-8439-D',  normalized: '38439D',   discordId: '483881991238975489'  }, // Omar Jamal
  { plate: '3-5604-D',  normalized: '35604D',   discordId: '351628004843061250'  }, // Mahmoud Abd-Alkareem
  { plate: '3-2372-D',  normalized: '32372D',   discordId: '1069171223071821844' }, // Yousef Najem
  { plate: '1-0403-D',  normalized: '10403D',   discordId: '941983102987825152'  }, // Omar Dere
  { plate: '3-8865-D',  normalized: '38865D',   discordId: '483905369106808867'  }, // Tamer Naana
  { plate: '1-4121-B',  normalized: '14121B',   discordId: '927121490812502056'  }, // Murad Dwikat
  { plate: '6-8623-96', normalized: '6862396',  discordId: '930833927109750834'  }, // Abd Alrahman Hamdan
  { plate: '6-6248-96', normalized: '6624896',  discordId: '792314439444725780'  }, // Mohammad Dwikat
  { plate: '1-9484-D',  normalized: '19484D',   discordId: '1172114774306340959' }, // Tharwat Azizi
  { plate: '7-0751-96', normalized: '7075196',  discordId: '631410949487591427'  }, // Osama Abu Mansour (AbuWard)
  { plate: '2-2729-A',  normalized: '22729A',   discordId: '1122424731572908032' }, // Ibrahim Hamshari (abu ibrahim)
  { plate: '6-9487-92', normalized: '6948792',  discordId: '326777761643364362'  }, // Omar Abbadi
  { plate: '1-5126-D',  normalized: '15126D',   discordId: '1028590144342724629' }, // Anas Khraim
  { plate: '3-3195-D',  normalized: '33195D',   discordId: '483608265280716811'  }, // Abdullah Ahmad
  { plate: '6-3476-94', normalized: '6347694',  discordId: '1383171849000718487' }, // Hanan Tbaileh
  { plate: '1-2949-B',  normalized: '12949B',   discordId: '560903846596050949'  }, // Osaed Yahya
  { plate: '6-7306-92', normalized: '6730692',  discordId: '838342207316033546'  }, // Basel Alsayed
  { plate: '1-3913-K',  normalized: '13913K',   discordId: '1078270861569703947' }, // Bashar Qassis
  { plate: '4-5403-L',  normalized: '45403L',   discordId: '977852503070740490'  }, // Sohaib Najjar
  { plate: '2-7143-A',  normalized: '27143A',   discordId: '595187030753935370'  }, // Mohammad Amarneh
  { plate: '1-8215-D',  normalized: '18215D',   discordId: '1057251839915085854' }, // Osama Sarawan
  { plate: '30288a',    normalized: '30288A',   discordId: '486202081133330433'  }, // Abdallatif Sulaiman
  { plate: '301151D',   normalized: '301151D',  discordId: '1239144996104437813' }, // Mahmood Abu Samaha
  { plate: '24180A',    normalized: '24180A',   discordId: '1400230192580001954' }, // Ahmad Shubita
  { plate: '37307D',    normalized: '37307D',   discordId: '944675938950582272'  }, // Wadee Abuzant
  { plate: '43409d',    normalized: '43409D',   discordId: '640510908128559125'  }, // Mohamad Jaradat
  { plate: '66840E',    normalized: '66840E',   discordId: '591229550600388609'  }, // Zaid Deriya
  { plate: '19951a',    normalized: '19951A',   discordId: '653330831087239178'  }, // Ahmad Rabaya
  { plate: '7-4229-H',  normalized: '74229H',   discordId: '962294511827054642'  }, // Amir Alkam
  { plate: '3-9956-D',  normalized: '39956D',   discordId: '1325385733783031849' }, // Abdulrahman Mahamdah
  { plate: '7-0424-96', normalized: '7042496',  discordId: '867849351786659860'  }, // Zain Abubaker
  { plate: '1579D',     normalized: '1579D',    discordId: '763134509594968086'  }, // Mahmoud Shouli
  { plate: '21139a',    normalized: '21139A',   discordId: '484256699209875457'  }, // Mohammad Awad (AbuAwad)
  { plate: '7302394',   normalized: '7302394',  discordId: '488744230244712478'  }, // Abdulrahman Hab Ruman
];

// ── Discord ID → BambooHR work email (source of truth mapping) ───────────────
const DISCORD_TO_EMAIL: Record<string, string> = {
  '710184069643763784':  'mohammad.omar@foothillsolutions.com',
  '483881991238975489':  'omar@foothillsolutions.com',
  '351628004843061250':  'm.abdalkareem@foothillsolutions.com',
  '1069171223071821844': 'yousef.najem@foothillsolutions.com',
  '941983102987825152':  'omar.dere@foothillsolutions.com',
  '483905369106808867':  'tamer@foothillsolutions.com',
  '927121490812502056':  'murad.dwikat@foothillsolutions.com',
  '930833927109750834':  'abdalrahman.hamdan@foothillsolutions.com',
  '792314439444725780':  'mohammad.dwaikat@foothillsolutions.com',
  '1172114774306340959': 'tharwat.azizi@foothillsolutions.com',
  '631410949487591427':  'o.mansour@foothillsolutions.com',
  '1122424731572908032': 'ibrahim.hamshari@foothillsolutions.com',
  '326777761643364362':  'omar.abbadi@foothillsolutions.com',
  '1028590144342724629': 'anas.khraim@foothillsolutions.com',
  '483608265280716811':  'abdullah@foothillsolutions.com',
  '1383171849000718487': 'hanan.tbaileh@foothillsolutions.com',
  '560903846596050949':  'osaed.yahya@foothillsolutions.com',
  '838342207316033546':  'b.alsayed@foothillsolutions.com',
  '1078270861569703947': 'bashar.qassis@foothillsolutions.com',
  '977852503070740490':  'sohaib.najar@foothillsolutions.com',
  '595187030753935370':  'm.amarneh@foothillsolutions.com',
  '1057251839915085854': 'osama.sarawan@foothillsolutions.com',
  '486202081133330433':  'asulaiman@foothillsolutions.com',
  '1239144996104437813': 'mahmood.abusamaha@foothillsolutions.com',
  '1400230192580001954': 'ahmad.shubita@foothillsolutions.com',
  '944675938950582272':  'wadee.abuzant@foothillsolutions.com',
  '640510908128559125':  'm.jaradat@foothillsolutions.com',
  '591229550600388609':  'z.direya@foothillsolutions.com',
  '653330831087239178':  'a.rabaya@foothillsolutions.com',
  '962294511827054642':  'ameer.alqam@foothillsolutions.com',
  '1325385733783031849': 'abdulrahman.mahamdah@foothillsolutions.com',
  '867849351786659860':  'zain.abubaker@foothillsolutions.com',
  '763134509594968086':  'mahmoud.shouli@foothillsolutions.com',
  '484256699209875457':  'mohammad@foothillsolutions.com',
  '488744230244712478':  'h.abdalrhman@foothillsolutions.com',
};

async function seed() {
  console.log(`\n🌱 Seeding ${PLATES.length} plates (BambooHR as source of truth)...\n`);

  let inserted = 0;
  let skipped = 0;
  let noMapping = 0;

  for (const row of PLATES) {
    const email = DISCORD_TO_EMAIL[row.discordId];
    if (!email) {
      console.log(`  ⚠️  ${row.plate.padEnd(12)} — no email mapping for discord ${row.discordId}`);
      noMapping++;
      continue;
    }

    // Find the BambooHR employee by email
    const emp = await db.query<{ id: string; display_name: string }>(
      `SELECT id, display_name FROM employees WHERE email = $1 AND is_active = true LIMIT 1`,
      [email]
    );

    if (!emp.rows[0]) {
      console.log(`  ⚠️  ${row.plate.padEnd(12)} — employee not found for email: ${email}`);
      skipped++;
      continue;
    }

    const { id: empId, display_name } = emp.rows[0];

    // Also store the discord_id on the employee row
    await db.query(
      `UPDATE employees SET discord_id = $1, updated_at = NOW() WHERE id = $2 AND discord_id IS NULL`,
      [row.discordId, empId]
    );

    const result = await db.query(
      `INSERT INTO plates (employee_id, plate_number, plate_normalized, country_code)
       VALUES ($1, $2, $3, 'PS')
       ON CONFLICT (plate_normalized, country_code) DO NOTHING
       RETURNING id`,
      [empId, row.plate.toUpperCase(), row.normalized]
    );

    if (result.rows.length > 0) {
      console.log(`  ✅ ${row.plate.padEnd(12)} → ${display_name}`);
      inserted++;
    } else {
      console.log(`  ⏭️  ${row.plate.padEnd(12)} already exists — skipped`);
      skipped++;
    }
  }

  console.log(`\n✅ Done — ${inserted} inserted, ${skipped} skipped, ${noMapping} no mapping.\n`);
  await db.end?.();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
