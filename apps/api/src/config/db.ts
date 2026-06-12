import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

mongoose.set('strictQuery', true);
// Reject queries while disconnected instead of buffering them silently.
mongoose.set('bufferCommands', false);

export async function connectDb(uri: string = env.MONGODB_URI): Promise<void> {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  });
  logger.info({ db: mongoose.connection.name }, 'MongoDB connected');

  mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'MongoDB connection error');
  });
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected (graceful)');
}
