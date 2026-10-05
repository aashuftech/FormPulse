import { app } from './app.js';
import { connectToDatabase } from './config/database.js';
import { env } from './config/env.js';

async function startServer(): Promise<void> {
  await connectToDatabase();

  app.listen(env.port, () => {
    console.info(`FormPulse API listening on port ${env.port}`);
  });
}

startServer().catch(error => {
  console.error('Failed to start FormPulse API', error);
  process.exitCode = 1;
});
