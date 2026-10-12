import { Router } from 'express';
import { paymentsController } from './payments.controller';

const router = Router();

router.get('/getPayments/:clientId', paymentsController.getPaymentsByClient);
router.post('/addPayment/:clientId', paymentsController.addPayment);
router.put('/updatePayment/:paymentId', paymentsController.updatePayment);
router.delete('/deletePayment/:paymentId', paymentsController.deletePayment);
router.get('/getPaymentInfo/:clientId', paymentsController.detailPayments);
export default router;
