import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import test from 'node:test';
import { getHealth } from '../dist/controllers/healthController.js';

test('health endpoint reports unavailable when MongoDB is disconnected', () => {
  const originalReadyState = mongoose.connection.readyState;
  let statusCode;
  let responseBody;
  const response = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  try {
    mongoose.connection.readyState = 0;
    getHealth({}, response);
    assert.equal(statusCode, 503);
    assert.equal(responseBody.status, 'unavailable');
    assert.equal(responseBody.database, 'disconnected');
  } finally {
    mongoose.connection.readyState = originalReadyState;
  }
});

test('health endpoint reports ready when MongoDB is connected', () => {
  const originalReadyState = mongoose.connection.readyState;
  let statusCode;
  let responseBody;
  const response = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  try {
    mongoose.connection.readyState = 1;
    getHealth({}, response);
    assert.equal(statusCode, 200);
    assert.equal(responseBody.status, 'ok');
    assert.equal(responseBody.database, 'connected');
  } finally {
    mongoose.connection.readyState = originalReadyState;
  }
});
