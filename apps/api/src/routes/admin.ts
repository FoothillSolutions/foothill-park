import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { db } from '../db/connection';
import { runBambooSync } from '../services/bambooSync';

const router = Router();

// GET /api/admin/audit-logs
router.get('/audit-logs', authenticate, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const offset = parseInt(req.query.offset as string) || 0;

  try {
    const result = await db.query(
      `SELECT
         al.id,
         al.action,
         al.target_plate AS "targetPlate",
         al.ip_address   AS "ipAddress",
         al.metadata,
         al.created_at   AS "createdAt",
         e.display_name  AS "actorName",
         e.entra_id      AS "actorEntraId"
       FROM audit_logs al
       JOIN employees e ON e.id = al.actor_id
       ORDER BY al.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ logs: result.rows, limit, offset });
  } catch (err) {
    console.error('[GET /api/admin/audit-logs]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/sync-bamboo — manual trigger for the nightly BambooHR sync
router.post('/sync-bamboo', authenticate, async (_req, res) => {
  try {
    const result = await runBambooSync();
    res.json({ ok: true, result });
  } catch (err) {
    console.error('[POST /api/admin/sync-bamboo]', err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;
