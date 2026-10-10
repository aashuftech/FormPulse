import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const serverDirectory = fileURLToPath(new URL('..', import.meta.url));

function readCookieConfiguration(overrides = {}) {
  const script = `import { authCookieOptions, refreshCookieOptions } from './dist/config/authCookie.js'; console.log(JSON.stringify({ auth: { httpOnly: authCookieOptions.httpOnly, secure: authCookieOptions.secure, sameSite: authCookieOptions.sameSite }, refresh: { httpOnly: refreshCookieOptions.httpOnly, secure: refreshCookieOptions.secure, sameSite: refreshCookieOptions.sameSite } }));`;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: serverDirectory,
    encoding: 'utf8',
    env: {
      ...process.env,
      MONGODB_URI: 'mongodb://127.0.0.1:27017/formpulse-config-test',
      CLIENT_URL: 'https://app.example.invalid',
      JWT_SECRET: 'a'.repeat(64),
      ...overrides,
    },
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout.trim());
}

test('production auth and refresh cookies are HttpOnly, Secure, and SameSite configured', () => {
  const cookies = readCookieConfiguration({ NODE_ENV: 'production', COOKIE_SAME_SITE: 'lax' });
  assert.deepEqual(cookies, {
    auth: { httpOnly: true, secure: true, sameSite: 'lax' },
    refresh: { httpOnly: true, secure: true, sameSite: 'lax' },
  });
});

test('development localhost cookies work over HTTP; SameSite=None remains Secure', () => {
  const localCookies = readCookieConfiguration({
    NODE_ENV: 'development',
    COOKIE_SAME_SITE: 'lax',
  });
  assert.equal(localCookies.auth.secure, false);
  assert.equal(localCookies.refresh.secure, false);
  assert.equal(localCookies.auth.httpOnly, true);
  assert.equal(localCookies.refresh.httpOnly, true);

  const crossSiteCookies = readCookieConfiguration({
    NODE_ENV: 'development',
    COOKIE_SAME_SITE: 'none',
  });
  assert.equal(crossSiteCookies.auth.secure, true);
  assert.equal(crossSiteCookies.refresh.secure, true);
});

test('Express trust proxy hop count comes from validated environment configuration', () => {
  const script = `import { app } from './dist/app.js'; console.log(JSON.stringify({ trustProxy: app.get('trust proxy') }));`;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: serverDirectory,
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/formpulse-config-test',
      CLIENT_URL: 'https://app.example.invalid',
      JWT_SECRET: 'a'.repeat(64),
      TRUST_PROXY_HOPS: '1',
    },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout.trim()), { trustProxy: 1 });
});
