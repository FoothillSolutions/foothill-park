import cron from 'node-cron';
import { runBambooSync } from '../services/bambooSync';

export function startNightlyBambooSync(): void {
  // Every Sunday at 02:00
  cron.schedule('0 2 * * 0', async () => {
    console.log('[scheduler] weekly BambooHR sync starting…');
    try {
      await runBambooSync();
    } catch (err) {
      console.error('[scheduler] BambooHR sync failed:', err);
    }
  });

  console.log('[scheduler] BambooHR sync scheduled — every Sunday at 02:00');
}
