/**
 * Local development API server — runs the same handlers as Vercel `/api/*`
 * without the Vercel CLI. Use with `npm run dev:api` (port 3000) + `npm run dev` (Vite).
 */
import { ringcentralJwtFromEnv } from '../api/lib/rcTokenStore.js';
import { config } from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

config({ path: join(root, '.env.local') });
config({ path: join(root, '.env') });

type ApiHandler = (req: Request, res: Response) => void | Promise<void>;

function mount(load: () => Promise<{ default: ApiHandler }>) {
  return (req: Request, res: Response, next: NextFunction) => {
    void load()
      .then(({ default: handler }) => handler(req, res))
      .catch(next);
  };
}

const app = express();
app.use(express.json({ limit: '1mb' }));

app.post('/api/send-reminder', mount(() => import('../api/send-reminder.ts')));

app.get('/api/ringcentral/status', mount(() => import('../api/ringcentral/status.ts')));

app.post('/api/notifications/run', mount(() => import('../api/notifications/run.ts')));
app.get('/api/notifications/cron-run', mount(() => import('../api/notifications/cron-run.ts')));
app.post('/api/notifications/test-sms', mount(() => import('../api/notifications/test-sms.ts')));
app.post(
  '/api/notifications/validate-ringcentral',
  mount(() => import('../api/notifications/validate-ringcentral.ts'))
);
app.post('/api/notifications/preview', mount(() => import('../api/notifications/preview.ts')));

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  if (res.headersSent) return;
  const msg = err instanceof Error ? err.message : 'Server error';
  res.status(500).json({ error: msg });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, '127.0.0.1', () => {
  console.log(`[local-api] http://127.0.0.1:${port}`);
  const jwtSet = Boolean(ringcentralJwtFromEnv());
  const rcClient = Boolean(process.env.RINGCENTRAL_CLIENT_ID?.trim() && process.env.RINGCENTRAL_CLIENT_SECRET?.trim());
  console.log(
    `[local-api] RingCentral: JWT env ${jwtSet ? 'set' : 'missing'}; client id+secret ${rcClient ? 'set' : 'missing'} (.env.local at repo root)`
  );
});
