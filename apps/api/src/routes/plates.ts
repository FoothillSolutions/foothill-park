import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requirePlate } from '../middleware/requirePlate';
import { findOrCreateEmployee } from '../services/employeeService';
import { registerPlate, getMyPlates, lookupPlate } from '../services/plateService';
import { db } from '../db/connection';

const router = Router();

// GET /api/plates/my
router.get('/my', authenticate, async (req, res) => {
  try {
    const employee = await findOrCreateEmployee(
      req.user!.entraId, req.user!.displayName, req.user!.email
    );
    const plates = await getMyPlates(employee.id);
    res.json(plates);
  } catch (err) {
    console.error('[GET /api/plates/my]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/plates/register
router.post('/register', authenticate, async (req, res) => {
  const { plateNumber, targetEmployeeId } = req.body;
  if (!plateNumber || typeof plateNumber !== 'string') {
    res.status(400).json({ error: 'plateNumber is required' });
    return;
  }

  try {
    const actor = await findOrCreateEmployee(
      req.user!.entraId, req.user!.displayName, req.user!.email
    );
    const ownerId = targetEmployeeId ?? actor.id;
    const plate = await registerPlate(ownerId, plateNumber, 'PS', actor.id);

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (actor_id, action, target_plate, metadata)
       VALUES ($1, 'PLATE_REGISTER', $2, $3)`,
      [actor.id, plate.plateNormalized, JSON.stringify({ plateNumber, targetEmployeeId: targetEmployeeId ?? null })]
    );

    res.status(201).json(plate);
  } catch (err) {
    console.error('[POST /api/plates/register]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/plates/lookup
router.post('/lookup', authenticate, requirePlate, async (req, res) => {
  const { plateNumber } = req.body;
  if (!plateNumber || typeof plateNumber !== 'string') {
    res.status(400).json({ error: 'plateNumber is required' });
    return;
  }

  try {
    const actor = await findOrCreateEmployee(
      req.user!.entraId, req.user!.displayName, req.user!.email
    );

    const result = await lookupPlate(plateNumber);

    await db.query(
      `INSERT INTO audit_logs (actor_id, action, target_plate, metadata, ip_address)
       VALUES ($1, 'PLATE_LOOKUP', $2, $3, $4)`,
      [actor.id, plateNumber.toUpperCase(), JSON.stringify({ found: result.found }), req.ip]
    );

    res.json(result);
  } catch (err) {
    console.error('[POST /api/plates/lookup]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
