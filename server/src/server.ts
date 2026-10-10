import { app } from './app.js';
import { connectToDatabase } from './config/database.js';
import { env } from './config/env.js';
import mongoose from 'mongoose';
import type { Server } from 'node:http';

let server: Server | undefined;
let isShuttingDown = false;

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.info(`Received ${signal}; shutting down FormPulse API`);

  if (!server) {
    await mongoose.disconnect();
    return;
  }

  const forceCloseTimer = setTimeout(() => server?.closeAllConnections(), 10_000);
  forceCloseTimer.unref();
  await new Promise<void>((resolve, reject) => {
    server?.close(error => (error ? reject(error) : resolve()));
  });
  clearTimeout(forceCloseTimer);
  await mongoose.disconnect();
}

async function startServer(): Promise<void> {
  await connectToDatabase();

  server = app.listen(env.port, () => {
    console.info(`FormPulse API listening on port ${env.port}`);
  });

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM').catch(() => {
      console.error('FormPulse API shutdown did not complete cleanly');
      process.exitCode = 1;
    });
  });
  process.once('SIGINT', () => {
    void shutdown('SIGINT').catch(() => {
      console.error('FormPulse API shutdown did not complete cleanly');
      process.exitCode = 1;
    });
  });
}

startServer().catch(error => {
  const errorType =
    error instanceof Error && /^[A-Za-z][A-Za-z0-9]*$/.test(error.name) ? error.name : 'Error';
  console.error(`Failed to start FormPulse API (${errorType})`);
  process.exitCode = 1;
});
