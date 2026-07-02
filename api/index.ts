import { connectDatabase } from '../src/config/database';
import app from '../src/app';

let dbConnected = false;

export default async (req: any, res: any) => {
  // Set CORS headers first, before anything else
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight - DO NOT process further
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    if (!dbConnected) {
      await connectDatabase();
      dbConnected = true;
    }

    // Pass to Express
    return new Promise((resolve, reject) => {
      app(req, res, (err: any) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });
  } catch (error) {
    console.error('Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error' });
    }
  }
};
