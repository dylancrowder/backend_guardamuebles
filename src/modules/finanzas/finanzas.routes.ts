import { Router } from 'express';
import { finanzasController } from './finanzas.controller';

const router = Router();

router.get('/resumen', finanzasController.getSummary);
router.get('/categorias', finanzasController.getCategorySummary);
router.get('/', finanzasController.getAll);
router.post('/', finanzasController.create);
router.put('/:id', finanzasController.update);
router.delete('/:id', finanzasController.delete);

export default router;
