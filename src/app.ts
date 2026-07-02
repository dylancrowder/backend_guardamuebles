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

const allowedOrigins = [
  'https://frontguarda.netlify.app',
  'http://localhost:3000',
  'http://localhost:3001'
];

// Add dynamic origin from environment if provided
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  optionsSuccessStatus: 200,
  maxAge: 86400
}));

// Handle preflight requests explicitly
app.options('*', cors());
app.use(helmet());
app.use(morgan(isDevelopment ? 'dev' : 'combined'));
app.use(express.json());

// Health check endpoint for Render
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

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
