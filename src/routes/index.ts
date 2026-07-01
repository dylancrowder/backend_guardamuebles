import { Router } from 'express';
import customersRoutes from '../modules/customers/customers.routes';
import paymentsRoutes from '../modules/payments/payments.routes';

const router = Router();

router.get('/', (_req, res) => {
  return res.json({
    success: true,
    message: 'Guardamuebles & Fletes API'
  });
});

router.get('/health', (_req, res) => {
  return res.json({
    success: true,
    message: 'API running'
  });
});

// Mount routes without trailing slash requirement
router.use('/api/clients', customersRoutes);
router.use('/api/payments', paymentsRoutes);

// Also mount with trailing slash for compatibility
router.use('/api/clients/', customersRoutes);
router.use('/api/payments/', paymentsRoutes);

export default router;
