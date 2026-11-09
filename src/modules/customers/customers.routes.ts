import { Router } from 'express';
import { customersController } from './customers.controller';
import { clientPhotosController } from './client-photos.controller';
import { parseClientPhoto } from './client-photos.upload';

const router = Router();

router.get('/:clientId/photos', clientPhotosController.list);
router.post('/:clientId/photos', parseClientPhoto, clientPhotosController.upload);
router.delete('/:clientId/photos/:photoId', clientPhotosController.delete);
router.get('/', customersController.getAll);
router.get('/getAllInfo', customersController.getAllInfo);
router.post('/', customersController.create);
router.get('/getClient/:id', customersController.getById);
router.put('/:clientId', customersController.update);
router.delete('/:clientId', customersController.delete);

export default router;
