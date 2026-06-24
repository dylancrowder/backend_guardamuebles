import mongoose from 'mongoose';
import { env } from './env';

let cachedConnection: typeof mongoose | null = null;

export const connectDatabase = async () => {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cachedConnection = await mongoose.connect(env.MONGODB_URI, opts);
    console.log('MongoDB connected');
    return cachedConnection;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
