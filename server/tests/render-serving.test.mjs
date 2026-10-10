import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

process.env.NODE_ENV = 'production';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/formpulse-render-test';
process.env.JWT_SECRET = 'render-serving-test-secret-that-is-long-enough';
process.env.CLIENT_URL = 'https://formpulse.example';
process.env.TRUST_PROXY_HOPS = '0';

const { app } = await import('../dist/app.js');
const frontendIndex = new URL('../../dist/index.html', import.meta.url);
const html = await readFile(frontendIndex, 'utf8');

const layers = app.router.stack;
const staticLayerIndex = layers.findIndex(layer => layer.name === 'serveStatic');
const apiLayerIndex = layers.findIndex(layer => layer.name === 'router');
const corsLayer = layers.find(layer => layer.name === 'corsMiddleware');
const notFoundLayerIndex = layers.findIndex(layer => layer.name === 'notFound');
const spaFallback = layers[staticLayerIndex + 1]?.handle;

test('mounts API routes before static assets and SPA fallback', () => {
  assert.ok(apiLayerIndex >= 0);
  assert.ok(staticLayerIndex > apiLayerIndex);
  assert.ok(notFoundLayerIndex > staticLayerIndex);
  assert.equal(typeof spaFallback, 'function');
});

test('applies credentialed CORS checks to API paths, not same-origin frontend assets', () => {
  assert.ok(corsLayer);
  const matchesCorsPath = corsLayer.matchers[0];
  assert.ok(matchesCorsPath('/api/auth/me'));
  assert.equal(matchesCorsPath('/assets/index.js'), false);
});

test('serves the built index for root and client-side route requests', () => {
  assert.match(html, /FormPulse/);

  for (const path of ['/', '/dashboard/profile']) {
    let sentFile;
    let passedToNext = false;
    spaFallback(
      { method: 'GET', path, accepts: type => type === 'html' },
      { sendFile: file => (sentFile = file) },
      () => (passedToNext = true),
    );

    assert.equal(sentFile, fileURLToPath(frontendIndex));
    assert.equal(passedToNext, false);
  }
});

test('does not send API or non-HTML requests through the SPA fallback', () => {
  for (const request of [
    { method: 'GET', path: '/api/not-a-route', accepts: () => 'html' },
    { method: 'POST', path: '/dashboard', accepts: () => 'html' },
    { method: 'GET', path: '/dashboard', accepts: () => false },
  ]) {
    let passedToNext = false;
    spaFallback(request, {}, () => (passedToNext = true));
    assert.equal(passedToNext, true);
  }
});

test('the built asset directory contains the frontend bundle referenced by index', async () => {
  const assetPath = html.match(/src="([^"]+\.js)"/)?.[1];
  assert.ok(assetPath);
  await access(new URL(`../../dist${assetPath}`, import.meta.url));
});
