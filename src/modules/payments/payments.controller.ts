import { Request, Response, NextFunction } from 'express';
import { paymentsService } from './payments.service';
import { handleError, createValidationError } from '../../utils/response';
import { customersService } from '../customers/customers.service';

export const paymentsController = {
  getPaymentsByClient: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = Array.isArray(req.params.clientId) ? req.params.clientId[0] : req.params.clientId;

      if (!clientId) {
        throw createValidationError('clientId', 'ID del cliente requerido');
      }

      const { page, limit } = req.query;
      const filters: any = {};

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

      const result = await paymentsService.getPaymentsByClient(clientId, filters);
      return res.json(result);
    } catch (error: any) {
      handleError(error, req, res, 400);
    }
  },

  addPayment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = Array.isArray(req.params.clientId) ? req.params.clientId[0] : req.params.clientId;

      if (!clientId) {
        throw createValidationError('clientId', 'ID del cliente requerido');
      }

      const payment = await paymentsService.addPayment(clientId, req.body);
      return res.status(201).json(payment);
    } catch (error: any) {
      handleError(error, req, res, 400);
    }
  },





  detailPayments: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const clientId = Array.isArray(req.params.clientId)
        ? req.params.clientId[0]
        : req.params.clientId;

      if (!clientId) {
        throw createValidationError(
          "clientId",
          "ID del cliente requerido"
        );
      }

      const result = await paymentsService.detailPayments(clientId);

      return res.status(200).json(result);
    } catch (error) {
      handleError(error, req, res, 400);
    }

  }








};
