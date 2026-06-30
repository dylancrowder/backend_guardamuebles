import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import routes from './routes';
import { handleError } from './utils/response';

const app = express();

const isDevelopment = process.env.NODE_ENV === 'development';

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  optionsSuccessStatus: 200
}));
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
