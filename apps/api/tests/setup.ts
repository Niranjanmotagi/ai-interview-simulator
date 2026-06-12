/**
 * Runs before each test file's imports. Environment must be in place before
 * src/config/env.ts is first imported anywhere in the dependency graph.
 */
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://placeholder-replaced-by-memory-server/test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-test-access-secret-test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-test-refresh-secret-test-refresh-secret';
process.env.AI_PROVIDER = 'mock';
process.env.FREE_TIER_INTERVIEWS_PER_MONTH = '3';
process.env.UPLOAD_DIR = './uploads-test';

import { afterAll, afterEach, beforeAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const { connectDb } = await import('../src/config/db');
  await connectDb(mongod.getUri('ai_interview_test'));
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
