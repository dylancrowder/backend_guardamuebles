import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import routes from './routes';
import { handleError } from './utils/response';

const app = express();

const isDevelopment = process.env.NODE_ENV === 'development';

// Disable redirects
app.set('strict routing', false);
app.disable('x-powered-by');

app.use(cors({
  origin: [
    'https://frontguarda.netlify.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  optionsSuccessStatus: 200
}));

app.options('*', cors());

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(morgan(isDevelopment ? 'dev' : 'combined'));
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  console.log('Origin:', req.headers.origin);
  console.log('User-Agent:', req.headers['user-agent']);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

app.use('/api', routes);

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
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR - ${req.method} ${req.path}`);
  console.error('Origin:', req.headers.origin);
  console.error('Error:', error);
  console.error('User-Agent:', req.headers['user-agent']);
  handleError(error, req, res, 500);
});

export default app;
