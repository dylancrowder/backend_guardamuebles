import { PaymentModel } from './payments.model';
import { CustomerModel } from '../customers/customers.model';
import { createNotFoundError, createBadRequestError, createValidationError } from '../../utils/response';

interface PaymentData {
  amount: number;
  date?: Date;
  monthDate: string;
}

interface PaymentFilters {
  page?: number;
  limit?: number;
}

export const paymentsService = {
  getPaymentsByClient: async (clientId: string, filters: PaymentFilters = {}) => {
    try {
      if (!clientId || !clientId.match(/^[0-9a-fA-F]{24}$/)) {
        throw createBadRequestError('ID de cliente inválido', { providedId: clientId });
      }

      const client = await CustomerModel.findById(clientId);
      if (!client) {
        throw createNotFoundError('Cliente', clientId);
      }

      const { page = 1, limit = 10 } = filters;
      const skip = (page - 1) * limit;

      const payments = await PaymentModel.find({ clientId })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const totalResults = await PaymentModel.countDocuments({ clientId });
      const totalPages = Math.ceil(totalResults / limit);

      return {
        payments,
        pagination: {
          currentPage: page,
          totalPages,
          totalResults,
          limit
        }
      };
    } catch (error: any) {
      console.error('Error en paymentsService.getPaymentsByClient:', error);
      throw error;
    }
  },

  addPayment: async (clientId: string, data: PaymentData) => {
    try {
      if (!clientId || !clientId.match(/^[0-9a-fA-F]{24}$/)) {
        throw createBadRequestError('ID de cliente inválido', { providedId: clientId });
      }

      const client = await CustomerModel.findById(clientId);
      if (!client) {
        throw createNotFoundError('Cliente', clientId);
      }

      if (!data.amount || data.amount <= 0) {
        throw createValidationError('amount', 'El monto debe ser mayor a 0', data.amount);
      }

      if (!data.monthDate || !data.monthDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        throw createValidationError('monthDate', 'El formato debe ser YYYY-MM-DD', data.monthDate);
      }

      const payment = await PaymentModel.create({
        clientId,
        amount: data.amount,
        date: data.date || new Date(),
        monthDate: data.monthDate
      });

      console.log('Pago creado exitosamente:', { paymentId: payment._id, clientId, amount: data.amount });
      return payment;
    } catch (error: any) {
      console.error('Error en paymentsService.addPayment:', error);
      throw error;
    }
  }
};
