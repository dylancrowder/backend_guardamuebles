import { Router } from 'express';
import { ventasController } from './ventas.controller';

const router = Router();

router.get('/', ventasController.getAll);
router.post('/', ventasController.create);
router.put('/:id', ventasController.update);
router.delete('/:id', ventasController.delete);

export default router;
