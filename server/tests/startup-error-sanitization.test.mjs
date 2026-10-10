import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

test('startup errors do not log MongoDB URI credentials or stacks', () => {
  const credentialMarker = 'startup-secret-marker';
  const serverPath = fileURLToPath(new URL('../dist/server.js', import.meta.url));
  const result = spawnSync(process.execPath, [serverPath], {
    encoding: 'utf8',
    timeout: 5000,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      MONGODB_URI: `mongodb://qa-user:${credentialMarker}@/formpulse`,
      CLIENT_URL: 'http://localhost:5173',
      JWT_SECRET: 'a'.repeat(64),
    },
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;

  assert.equal(result.status, 1);
  assert.match(output, /Failed to start FormPulse API/);
  assert.equal(output.includes(credentialMarker), false);
  assert.equal(output.includes('mongodb://'), false);
  assert.equal(output.includes('MongoParseError:'), false);
});
