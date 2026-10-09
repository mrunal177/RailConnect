import { spawn, type ChildProcess } from 'node:child_process';
import { delimiter, join } from 'node:path';
import { existsSync } from 'node:fs';
import 'dotenv/config';

const venvPython = join(
  process.cwd(),
  '.venv',
  process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python'
);
const pythonCommand = process.env.PYTHON || (existsSync(venvPython) ? venvPython : 'python3.12');
const childEnv = {
  ...process.env,
  PATH: [process.env.PATH, '/opt/homebrew/bin', '/usr/local/bin']
    .filter(Boolean)
    .join(delimiter),
};
const children: ChildProcess[] = [];
let shuttingDown = false;

const stopChildren = (exitCode: number) => {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
  }
  process.exitCode = exitCode;
};

const waitForPredictionApi = async (child: ChildProcess) => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (shuttingDown) throw new Error('Waitlist prediction API failed to start');
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error('Waitlist prediction API exited before becoming ready');
    }

    try {
      const response = await fetch('http://127.0.0.1:8001/openapi.json', {
        signal: AbortSignal.timeout(500),
      });
      if (response.ok) return;
    } catch {
      // The API process is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error('Waitlist prediction API did not become ready on port 8001');
};

const start = async () => {
  const predictionApi = spawn(
    pythonCommand,
    ['-m', 'uvicorn', 'waitlist_service.app:app', '--host', '127.0.0.1', '--port', '8001'],
    { stdio: 'inherit', env: childEnv }
  );
  children.push(predictionApi);
  predictionApi.once('error', (error) => {
    console.error('Failed to start waitlist prediction API:', error);
    stopChildren(1);
  });
  predictionApi.once('exit', (code) => {
    if (!shuttingDown) {
      console.error(`Waitlist prediction API exited unexpectedly (${code ?? 'signal'})`);
      stopChildren(code || 1);
    }
  });

  await waitForPredictionApi(predictionApi);
  if (shuttingDown) return;

  const server = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
    stdio: 'inherit',
    env: childEnv,
  });
  children.push(server);
  server.once('error', (error) => {
    console.error('Failed to start application server:', error);
    stopChildren(1);
  });
  server.once('exit', (code) => {
    if (!shuttingDown) stopChildren(code ?? 1);
  });
};

process.once('SIGINT', () => stopChildren(0));
process.once('SIGTERM', () => stopChildren(0));

start().catch((error: unknown) => {
  console.error(error);
  stopChildren(1);
});
