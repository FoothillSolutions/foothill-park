/**
 * One-time migration: links every seed placeholder to its real BambooHR employee.
 * Transfers plates, sets discord_id on the BambooHR row, deactivates the placeholder.
 *
 * Run with:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' src/db/merge-seed-to-bamboo.ts
 */

import { db } from './connection';

// discord_id (seed) → work email (BambooHR)
const MAPPING: { discordId: string; seedName: string; bambooEmail: string }[] = [
  { discordId: '351628004843061250',  seedName: 'Mahmoud Abd Al Kareem',   bambooEmail: 'm.abdalkareem@foothillsolutions.com'       },
  { discordId: '710184069643763784',  seedName: 'Mohammad Omar',            bambooEmail: 'mohammad.omar@foothillsolutions.com'        },
  { discordId: '483881991238975489',  seedName: 'Omar Abdullah',            bambooEmail: 'omar@foothillsolutions.com'                 }, // BambooHR: Omar Jamal
  { discordId: '1069171223071821844', seedName: 'Yousef Najem',             bambooEmail: 'yousef.najem@foothillsolutions.com'         },
  { discordId: '941983102987825152',  seedName: 'Omar Dere',                bambooEmail: 'omar.dere@foothillsolutions.com'            },
  { discordId: '483905369106808867',  seedName: 'Tamer H. Naana',          bambooEmail: 'tamer@foothillsolutions.com'                },
  { discordId: '927121490812502056',  seedName: 'Murad Dweikat',            bambooEmail: 'murad.dwikat@foothillsolutions.com'         },
  { discordId: '792314439444725780',  seedName: 'Mohammad Dweikat',         bambooEmail: 'mohammad.dwaikat@foothillsolutions.com'     },
  { discordId: '326777761643364362',  seedName: 'Omar Abbadi',              bambooEmail: 'omar.abbadi@foothillsolutions.com'          },
  { discordId: '1028590144342724629', seedName: 'Anas Khraim',              bambooEmail: 'anas.khraim@foothillsolutions.com'          },
  { discordId: '483608265280716811',  seedName: 'Abdullah Ahmad',           bambooEmail: 'abdullah@foothillsolutions.com'             },
  { discordId: '1383171849000718487', seedName: 'hanan tbaileh',            bambooEmail: 'hanan.tbaileh@foothillsolutions.com'        },
  { discordId: '560909384659605094',  seedName: 'Osaed Yahya',              bambooEmail: 'osaed.yahya@foothillsolutions.com'          },
  { discordId: '838342207316033546',  seedName: 'Basel Alsayed',            bambooEmail: 'b.alsayed@foothillsolutions.com'            },
  { discordId: '1078270861569703947', seedName: 'Bashar Qassis',            bambooEmail: 'bashar.qassis@foothillsolutions.com'        },
  { discordId: '977852503070740490',  seedName: 'Sohaib Najar',             bambooEmail: 'sohaib.najar@foothillsolutions.com'         },
  { discordId: '595187030753935370',  seedName: 'Mohammad Amarneh',         bambooEmail: 'm.amarneh@foothillsolutions.com'            },
  { discordId: '1057251839915085854', seedName: 'Osama Sarwan',             bambooEmail: 'osama.sarawan@foothillsolutions.com'        },
  { discordId: '486202081133330433',  seedName: 'Abdallatif',               bambooEmail: 'asulaiman@foothillsolutions.com'            },
  { discordId: '653330831087239178',  seedName: 'Ahmad Rabaya',             bambooEmail: 'a.rabaya@foothillsolutions.com'             },
  { discordId: '1400230192580001954', seedName: 'Ahmed Shubita',            bambooEmail: 'ahmad.shubita@foothillsolutions.com'        },
  { discordId: '962294511827054642',  seedName: 'Amir Alkam',               bambooEmail: 'ameer.alqam@foothillsolutions.com'          },
  { discordId: '1325385733783031849', seedName: 'Abdulrahman Mahammdeh',    bambooEmail: 'abdulrahman.mahamdah@foothillsolutions.com' },
  { discordId: '867849351786659860',  seedName: 'Zain Abubaker',            bambooEmail: 'zain.abubaker@foothillsolutions.com'        },
  { discordId: '640510908128559125',  seedName: 'Mohammad Jaradat',         bambooEmail: 'm.jaradat@foothillsolutions.com'            },
  { discordId: '591229550600388609',  seedName: 'Zaid Direya',              bambooEmail: 'z.direya@foothillsolutions.com'             },
  { discordId: '944675938950582272',  seedName: 'Wadee Sami',               bambooEmail: 'wadee.abuzant@foothillsolutions.com'        }, // BambooHR: Wadee Abuzant
  { discordId: '1172114774306340959', seedName: 'tharwat',                  bambooEmail: 'tharwat.azizi@foothillsolutions.com'        },
  { discordId: '1239144996104437813', seedName: 'AbuSamaha',                bambooEmail: 'mahmood.abusamaha@foothillsolutions.com'    },
  { discordId: '763134509594968086',  seedName: 'Shouli',                   bambooEmail: 'mahmoud.shouli@foothillsolutions.com'       },
  { discordId: '930833927109750834',  seedName: 'Hamdan',                   bambooEmail: 'abdalrahman.hamdan@foothillsolutions.com'   },
  { discordId: '631410949487591427',  seedName: 'AbuWard',                  bambooEmail: 'o.mansour@foothillsolutions.com'            }, // Osama Abu Mansour
  { discordId: '1122424731572908032', seedName: 'abu ibrahim',              bambooEmail: 'ibrahim.hamshari@foothillsolutions.com'     }, // Bilal Hamada - using closest match
  { discordId: '484256699209875457',  seedName: 'AbuAwad',                 bambooEmail: 'mohammad@foothillsolutions.com'              }, // Mohammad Awad — merged manually
];

async function merge() {
  console.log('\n🔗 Merging seed placeholders → BambooHR employees...\n');

  let merged = 0;
  let skipped = 0;

  for (const row of MAPPING) {
    // Find the seed placeholder
    const seed = await db.query<{ id: string }>(
      `SELECT id FROM employees WHERE discord_id = $1 AND entra_id LIKE 'seed_%' AND is_active = true LIMIT 1`,
      [row.discordId]
    );
    if (!seed.rows[0]) {
      console.log(`  ⏭️  ${row.seedName.padEnd(30)} — seed placeholder not found (already merged?)`);
      skipped++;
      continue;
    }
    const seedId = seed.rows[0].id;

    // Find the BambooHR employee
    const bamboo = await db.query<{ id: string; display_name: string }>(
      `SELECT id, display_name FROM employees WHERE email = $1 AND bamboo_id IS NOT NULL AND is_active = true LIMIT 1`,
      [row.bambooEmail]
    );
    if (!bamboo.rows[0]) {
      console.log(`  ⚠️  ${row.seedName.padEnd(30)} — BambooHR employee not found (${row.bambooEmail})`);
      skipped++;
      continue;
    }
    const bambooId   = bamboo.rows[0].id;
    const bambooName = bamboo.rows[0].display_name;

    // Transfer plates from seed → BambooHR employee
    const transferred = await db.query(
      `UPDATE plates SET employee_id = $1, updated_at = NOW() WHERE employee_id = $2`,
      [bambooId, seedId]
    );

    // Write discord_id onto the BambooHR row
    await db.query(
      `UPDATE employees SET discord_id = $1, updated_at = NOW() WHERE id = $2`,
      [row.discordId, bambooId]
    );

    // Deactivate seed placeholder
    await db.query(
      `UPDATE employees SET is_active = false, updated_at = NOW() WHERE id = $1`,
      [seedId]
    );

    console.log(`  ✅ ${row.seedName.padEnd(30)} → ${bambooName} (${transferred.rowCount} plate(s) transferred)`);
    merged++;
  }

  console.log(`\n✅ Done — ${merged} merged, ${skipped} skipped.\n`);
  await db.end?.();
  process.exit(0);
}

merge().catch(err => {
  console.error('Merge failed:', err);
  process.exit(1);
});
