import { connectDatabase } from '../src/config/database';
import app from '../src/app';

let dbConnected = false;

export default async (req: any, res: any) => {
  try {
    if (!dbConnected && req.method !== 'OPTIONS') {
      await connectDatabase();
      dbConnected = true;
    }

    // Pass to Express
    app(req, res);
  } catch (error) {
    console.error('Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};
