import { Request, Response } from 'express';
import { ventasService } from './ventas.service';

const sendError = (res: Response, error: any, defaultStatus: number) => {
  if (error?.code === 11000) return res.status(409).json({ message: 'Ya existe un turno para la misma fecha y hora' });
  if (error?.message === 'Turno inexistente') return res.status(404).json({ message: error.message });
  return res.status(defaultStatus).json({ message: error?.message || 'Error interno del servidor' });
};

export const ventasController = {
  getAll: async (_req: Request, res: Response) => {
    try {
      return res.status(200).json(await ventasService.getAll());
    } catch (error) {
      return sendError(res, error, 500);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      return res.status(201).json(await ventasService.create(req.body));
    } catch (error) {
      return sendError(res, error, 400);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      return res.status(200).json(await ventasService.update(id, req.body));
    } catch (error) {
      return sendError(res, error, 400);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await ventasService.delete(id);
      return res.status(204).send();
    } catch (error) {
      return sendError(res, error, 404);
    }
  }
};
