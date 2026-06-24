import { Request, Response, NextFunction } from 'express';
import { customersService } from './customers.service';
import { handleError, createValidationError } from '../../utils/response';

/**
 * CUSTOMERS CONTROLLER
 * Maneja todas las operaciones relacionadas con clientes
 * Ruta base: /api/clients
 */
export const customersController = {
 
 
 
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await customersService.create(req.body);
      return res.status(201).json(customer);
    } catch (error: any) {
      handleError(error, req, res, 400);
    }
  },

 
};
