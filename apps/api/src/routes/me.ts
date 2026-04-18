import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { findOrCreateEmployee, hasActivePlate } from '../services/employeeService';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const employee = await findOrCreateEmployee(
      req.user!.entraId,
      req.user!.displayName,
      req.user!.email
    );
    const hasPlate = await hasActivePlate(employee.id);
    res.json({
      entraId: employee.entraId,
      displayName: employee.displayName,
      email: req.user!.email,
      department: employee.department,
      hasPlate,
    });
  } catch (err) {
    console.error('[GET /api/me]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
