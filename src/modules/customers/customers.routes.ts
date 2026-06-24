import { Router } from 'express';
import { customersController } from './customers.controller';

const router = Router();

router.get('/', customersController.getAll);
router.get('/:clientId', customersController.getById);
router.post('/', customersController.create);
router.put('/:clientId', customersController.update);
router.delete('/:clientId', customersController.delete);

export default router;
