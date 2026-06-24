import { Router } from 'express';
import { customersController } from './customers.controller';

const router = Router();


router.post('/addNewClient', customersController.create);
router.post('/getAllClients', customersController.create);


export default router;
