import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { db } from '../db/connection';

const router = Router();

router.get('/', authenticate, async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT e.id, e.display_name AS "displayName", e.department, e.phone,
              e.discord_id AS "discordId", e.discord_username AS "discordUsername",
              p.plate_number AS "plateNumber"
       FROM employees e
       LEFT JOIN plates p ON p.employee_id = e.id AND p.is_active = true
       WHERE e.is_active = true
       ORDER BY e.display_name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[GET /api/employees]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
