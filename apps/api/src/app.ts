import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import healthRouter from './routes/health';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/health', healthRouter);

// Additional routes wired up in subsequent sessions:
// app.use('/api/auth',   authRouter);
// app.use('/api/me',     meRouter);
// app.use('/api/plates', platesRouter);
// app.use('/api/admin',  adminRouter);

app.listen(config.port, () => {
  console.log(`API running on port ${config.port} [${config.nodeEnv}]`);
});

export default app;
