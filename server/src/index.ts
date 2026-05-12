import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { connectDB } from './config/db';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

async function bootstrap() {
  await connectDB();

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.get('/', (_req, res) => {
    res.json({
      name: 'TaskFlow API',
      message: 'This is the API server. The web app runs at the CLIENT_ORIGIN URL.',
      web: env.CLIENT_ORIGIN,
      health: '/api/health',
      docs: 'See README.md for the full route list.',
    });
  });
  app.use('/api', apiRouter);
  app.use(notFound);
  app.use(errorHandler);

  const server = app.listen(env.PORT, () => {
    console.log(`[api] listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal: string) => {
    console.log(`\n[${signal}] shutting down…`);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('[fatal] startup failed:', err);
  process.exit(1);
});
