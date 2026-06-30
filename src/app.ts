import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import routes from './routes';
import { handleError } from './utils/response';

const app = express();

const isDevelopment = process.env.NODE_ENV === 'development';

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'https://guardamuebles-front.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan(isDevelopment ? 'dev' : 'combined'));
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

app.use(routes);

app.use((req: Request, res: Response) => {
  handleError(
    {
      name: 'NotFound',
      message: `Ruta no encontrada: ${req.method} ${req.path}`,
      code: 'NOT_FOUND'
    },
    req,
    res,
    404
  );
});

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  handleError(error, req, res, 500);
});

export default app;
