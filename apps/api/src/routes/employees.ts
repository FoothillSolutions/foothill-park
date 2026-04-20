import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { db } from '../db/connection';

const router = Router();

router.get('/', authenticate, async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT id, display_name AS "displayName", department, phone, discord_id AS "discordId"
       FROM employees
       WHERE is_active = true
       ORDER BY display_name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[GET /api/employees]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
