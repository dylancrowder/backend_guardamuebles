import { connectDatabase } from '../src/config/database';
import app from '../src/app';

let dbConnected = false;

export default async (req: any, res: any) => {
  try {
    if (!dbConnected) {
      await connectDatabase();
      dbConnected = true;
    }

    // Let Express handle the request with its built-in CORS middleware
    return new Promise<void>((resolve) => {
      app.handle(req, res);
      res.on('finish', () => resolve());
    });
  } catch (error) {
    console.error('Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error' });
    }
  }
};
