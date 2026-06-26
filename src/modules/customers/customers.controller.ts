import { Request, Response, NextFunction } from 'express';
import { customersService } from './customers.service';
import { handleError, createValidationError } from '../../utils/response';

export const customersController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, page, limit } = req.query;

      const filters: any = {};
      if (search) filters.search = search as string;
      if (page) {
        const pageNum = parseInt(page as string);
        if (isNaN(pageNum) || pageNum < 1) {
          throw createValidationError('page', 'Page debe ser un número mayor a 0', page);
        }
        filters.page = pageNum;
      }
      if (limit) {
        const limitNum = parseInt(limit as string);
        if (isNaN(limitNum) || limitNum < 1) {
          throw createValidationError('limit', 'Limit debe ser un número mayor a 0', limit);
        }
        filters.limit = limitNum;
      }

      const result = await customersService.getAll(filters);
      return res.json(result);
    } catch (error: any) {
      handleError(error, req, res, 400);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = req.params.id || req.params.clientId;
      const id = Array.isArray(clientId) ? clientId[0] : clientId;

      if (!id) {
        throw createValidationError('clientId', 'ID del cliente requerido');
      }

      const client = await customersService.getById(id);
      return res.json(client);
    } catch (error: any) {
      handleError(error, req, res, 404);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await customersService.create(req.body);
      return res.status(201).json(customer);
    } catch (error: any) {
      handleError(error, req, res, 400);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = Array.isArray(req.params.clientId) ? req.params.clientId[0] : req.params.clientId;

      if (!clientId) {
        throw createValidationError('clientId', 'ID del cliente requerido');
      }

      const customer = await customersService.update(clientId, req.body);
      return res.json(customer);
    } catch (error: any) {
      handleError(error, req, res, 400);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = Array.isArray(req.params.clientId) ? req.params.clientId[0] : req.params.clientId;

      if (!clientId) {
        throw createValidationError('clientId', 'ID del cliente requerido');
      }

      const result = await customersService.delete(clientId);
      return res.json(result);
    } catch (error: any) {
      handleError(error, req, res, 404);
    }
  }



};
