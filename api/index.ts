import { connectDatabase } from '../src/config/database';
import app from '../src/app';

let dbConnected = false;

export default async (req: any, res: any) => {
  // Handle CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (!dbConnected) {
      await connectDatabase();
      dbConnected = true;
    }

    return app(req, res);
  } catch (error) {
    console.error('Error in API handler:', error);
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
};
