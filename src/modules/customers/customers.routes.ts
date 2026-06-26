import { Router } from 'express';
import { customersController } from './customers.controller';

const router = Router();

router.get('/', customersController.getAll);
router.post('/', customersController.create);
router.get('/getClient/:id', customersController.getById);
router.put('/:clientId', customersController.update);
router.delete('/:clientId', customersController.delete);

export default router;
