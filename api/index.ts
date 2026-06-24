import { connectDatabase } from '../src/config/database';
import app from '../src/app';

export default async (req: any, res: any) => {
  await connectDatabase();
  return app(req, res);
};
