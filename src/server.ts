import app from './app';
import { env } from './config/env';
import { connectDatabase } from './config/database';

const startServer = async () => {
  try {
    await connectDatabase();

    const server = app.listen(env.PORT, () => {
      console.log(`[${new Date().toISOString()}] Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('[SIGTERM] Shutting down gracefully...');
      server.close(() => {
        console.log('[SIGTERM] Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('[SIGINT] Shutting down gracefully...');
      server.close(() => {
        console.log('[SIGINT] Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('[ERROR] Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
