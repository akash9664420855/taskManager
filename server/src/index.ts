import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import { env } from './config/env';
import { connectDB } from './config/db';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Resolve the client build at `<repo>/client/dist`. Works whether we're running
// from `server/src/index.ts` (tsx, dev) or `server/dist/index.js` (compiled).
const CLIENT_DIST = path.resolve(__dirname, '..', '..', 'client', 'dist');
const SERVE_CLIENT = fs.existsSync(path.join(CLIENT_DIST, 'index.html'));

async function bootstrap() {
  await connectDB();

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      // The client bundle is served from the same origin and uses inline styles
      // from shadcn/Radix — relax CSP to the default Express-friendly preset.
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.use('/api', apiRouter);

  // --- Single-origin frontend: serve the built React app if it exists ----
  if (SERVE_CLIENT) {
    console.log(`[static] serving client from ${CLIENT_DIST}`);
    app.use(
      express.static(CLIENT_DIST, {
        index: false,
        maxAge: '1h',
        setHeaders(res, filePath) {
          // Long-cache hashed assets, no-cache the index html
          if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          } else if (/\.(?:js|css|woff2?|ttf|svg|png|jpe?g|webp|ico)$/.test(filePath)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      }),
    );
    // SPA fallback — every non-API GET serves index.html so React Router handles it.
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    });
  } else {
    // Dev-mode helper: the React app runs on the Vite dev server, not here.
    app.get('/', (_req, res) => {
      res.json({
        name: 'TaskFlow API',
        message: 'API only — the web app runs at the Vite dev server (CLIENT_ORIGIN).',
        web: env.CLIENT_ORIGIN,
        health: '/api/health',
      });
    });
  }

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
