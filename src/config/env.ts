import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || ''
} as const;

if (!env.MONGODB_URI) {
  console.warn('⚠️  WARNING: MONGODB_URI environment variable is not set');
}
