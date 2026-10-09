import { Request, Response } from 'express';
import { finanzasService } from './finanzas.service';

const sendError = (res: Response, error: any, defaultStatus: number) => {
  const statusCode = typeof error?.statusCode === 'number' ? error.statusCode : defaultStatus;
  const message = error?.message || 'Error interno del servidor';

  return res.status(statusCode).json({ message });
};

export const finanzasController = {
  getAll: async (_req: Request, res: Response) => {
    try {
      const movements = await finanzasService.getAll();
      return res.status(200).json(movements);
    } catch (error) {
      return sendError(res, error, 500);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const movement = await finanzasService.create(req.body);
      return res.status(201).json(movement);
    } catch (error) {
      return sendError(res, error, 400);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const movement = await finanzasService.update(id, req.body);
      return res.status(200).json(movement);
    } catch (error) {
      return sendError(res, error, 400);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await finanzasService.delete(id);
      return res.status(200).json(result);
    } catch (error) {
      return sendError(res, error, 404);
    }
  },

  getSummary: async (req: Request, res: Response) => {
    try {
      const summary = await finanzasService.getSummary(req.query.month as string | undefined);
      return res.status(200).json(summary);
    } catch (error) {
      return sendError(res, error, 400);
    }
  },

  getCategorySummary: async (req: Request, res: Response) => {
    try {
      const summary = await finanzasService.getCategorySummary(req.query.month as string | undefined);
      return res.status(200).json(summary);
    } catch (error) {
      return sendError(res, error, 400);
    }
  }
};
