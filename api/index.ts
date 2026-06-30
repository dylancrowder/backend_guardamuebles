import { connectDatabase } from '../src/config/database';
import app from '../src/app';

export default async (req: any, res: any) => {
  try {
    await connectDatabase();
    app(req, res);
  } catch (error) {
    console.error('Error in API handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
