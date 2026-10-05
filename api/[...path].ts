import type { Request, Response } from 'express';
import { createApp } from '../server.ts';

// Keep the Express app warm between invocations in a single Vercel Function
// instance. The Gemini key remains server-only in Vercel environment variables.
let appPromise: ReturnType<typeof createApp> | undefined;

export default async function handler(req: Request, res: Response) {
  appPromise ??= createApp();
  const app = await appPromise;
  return new Promise<void>((resolve, reject) => {
    app(req, res, (err?: any) => {
      if (err) return reject(err);
      resolve();
    });
    res.on('finish', () => resolve());
    res.on('close', () => resolve());
  });
}
