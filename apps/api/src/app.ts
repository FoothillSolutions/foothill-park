import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { runMigrations } from './db/migrate';
import healthRouter from './routes/health';
import meRouter from './routes/me';
import platesRouter from './routes/plates';
import employeesRouter from './routes/employees';
import adminRouter from './routes/admin';
import { startNightlyBambooSync } from './jobs/scheduler';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/me', meRouter);
app.use('/api/plates', platesRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/admin', adminRouter);

async function start() {
  await runMigrations();
  app.listen(config.port, () => {
    console.log(`API running on port ${config.port} [${config.nodeEnv}]`);
  });
  startNightlyBambooSync();
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
