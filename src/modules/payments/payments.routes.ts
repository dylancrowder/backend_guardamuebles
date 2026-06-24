import { Router } from 'express';
import { paymentsController } from './payments.controller';

const router = Router();

router.get('/getPayments/:clientId', paymentsController.getPaymentsByClient);
router.post('/addPayment/:clientId', paymentsController.addPayment);

export default router;
