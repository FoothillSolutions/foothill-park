import { Request, Response, NextFunction } from 'express';
import { hasActivePlate } from '../services/employeeService';
import { findOrCreateEmployee } from '../services/employeeService';

export async function requirePlate(req: Request, res: Response, next: NextFunction) {
  try {
    const employee = await findOrCreateEmployee(
      req.user!.entraId,
      req.user!.displayName,
      req.user!.email,
    );
    const plated = await hasActivePlate(employee.id);
    if (!plated) {
      res.status(403).json({ error: 'You must register your plate before looking up others.' });
      return;
    }
    next();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
}
