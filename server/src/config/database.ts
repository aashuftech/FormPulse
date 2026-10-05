import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectToDatabase(): Promise<void> {
  await mongoose.connect(env.mongoUri);
  console.info('Connected to MongoDB');
}
