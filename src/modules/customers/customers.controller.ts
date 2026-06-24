import { Request, Response, NextFunction } from 'express';
import { customersService } from './customers.service';
import { handleError, createValidationError } from '../../utils/response';

/**
 * CUSTOMERS CONTROLLER
 * Maneja todas las operaciones relacionadas con clientes
 * Ruta base: /api/clients
 */
export const customersController = {
  /**
   * GET /api/clients
   * Obtiene lista de clientes con filtros y paginación
   * Query params: search, status, page, limit
   */
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
      return res.json(result.clients);
    } catch (error: any) {
      handleError(error, req, res, 400);
    }
  },

  /**
   * GET /api/clients/:clientId
   * Obtiene un cliente específico con sus pagos
   * Params: clientId (ID de MongoDB)
   */
  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = Array.isArray(req.params.clientId) ? req.params.clientId[0] : req.params.clientId;

      if (!clientId) {
        throw createValidationError('clientId', 'ID del cliente requerido');
      }

      const client = await customersService.getById(clientId);
      return res.json(client);
    } catch (error: any) {
      handleError(error, req, res, 404);
    }
  },

  /**
   * POST /api/clients
   * Crea un nuevo cliente
   * Body: nombre, empresa, email, telefono, direccion, limiteCredito, diaPago
   */
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await customersService.create(req.body);
      return res.status(201).json(customer);
    } catch (error: any) {
      handleError(error, req, res, 400);
    }
  },

  /**
   * PUT /api/clients/:clientId
   * Actualiza un cliente existente
   * Params: clientId (ID de MongoDB)
   * Body: Campos a actualizar (todos opcionales)
   */
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

  /**
   * DELETE /api/clients/:clientId
   * Elimina un cliente y todos sus pagos asociados
   * Params: clientId (ID de MongoDB)
   */
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
