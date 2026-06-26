import { PaymentModel } from './payments.model';
import { CustomerModel } from '../customers/customers.model';
import { createNotFoundError, createBadRequestError, createValidationError } from '../../utils/response';

interface PaymentData {
  amount: number;
  period: string;
  paymentDate?: Date;
  description?: string;
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
      if (!clientId.match(/^[0-9a-fA-F]{24}$/)) {
        throw createBadRequestError(
          "ID de cliente inválido",
          { providedId: clientId }
        );
      }

      // Verificar que exista el cliente
      const client = await CustomerModel.findById(clientId);

      if (!client) {
        throw createNotFoundError("Cliente", clientId);
      }

      // Validar monto
      if (!data.amount || data.amount <= 0) {
        throw createValidationError(
          "amount",
          "El monto debe ser mayor a 0",
          data.amount
        );
      }

      // Validar período
      if (!data.period || !/^\d{4}-\d{2}$/.test(data.period)) {
        throw createValidationError(
          "period",
          "El formato debe ser YYYY-MM",
          data.period
        );
      }

      // Verificar que el período no esté pago
      const exists = await PaymentModel.findOne({
        clientId,
        period: data.period,
      });

      if (exists) {
        throw createBadRequestError(
          `El período ${data.period} ya fue abonado`
        );
      }

      // Crear pago
      const payment = await PaymentModel.create({
        clientId,
        amount: data.amount,
        period: data.period,
        paymentDate: data.paymentDate ?? new Date(),
        description: data.description ?? "",
      });

      return payment;
    } catch (error) {
      console.error("Error en paymentsService.addPayment:", error);
      throw error;
    }
  },


 detailPayments: async (clientId: string) => {
  const client = await CustomerModel.findById(clientId);

  if (!client) {
    throw createNotFoundError("Cliente no encontrado");
  }

  const payments = await PaymentModel.find({ clientId }).sort({
    paymentDate: 1,
  });

  const history = [];

  const current = new Date(client.entryDate);
  const today = new Date();

  current.setDate(1);

  const currentMonth = new Date(today);
  currentMonth.setDate(1);

  while (current <= currentMonth) {
    const period = `${current.getFullYear()}-${String(
      current.getMonth() + 1
    ).padStart(2, "0")}`;

    const payment = payments.find((p) => p.period === period);

    history.push({
      period,
      status: payment ? "PAID" : "PENDING",
      paymentDate: payment?.paymentDate ?? null,
      amount: payment?.amount ?? client.amount,
    });

    current.setMonth(current.getMonth() + 1);
  }

  // Último pago
  const lastPayment =
    payments.length > 0 ? payments[payments.length - 1] : null;

  // Próximo período
  let nextPeriodDate = new Date(client.entryDate);

  if (lastPayment) {
    const [year, month] = lastPayment.period.split("-").map(Number);

    nextPeriodDate = new Date(year, month, 1); // mes siguiente
  }

  const nextPeriod = `${nextPeriodDate.getFullYear()}-${String(
    nextPeriodDate.getMonth() + 1
  ).padStart(2, "0")}`;

  // Fecha de vencimiento
  const dueDate = new Date(
    nextPeriodDate.getFullYear(),
    nextPeriodDate.getMonth(),
    client.entryDate.getDate()
  );

  // Diferencia de días
  const diff =
    Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

  const pendingPeriods = history.filter(
    (p) => p.status === "PENDING"
  );

  return {
    client,

    lastPayment: lastPayment
      ? {
          period: lastPayment.period,
          paymentDate: lastPayment.paymentDate,
          amount: lastPayment.amount,
        }
      : null,

    nextPayment: {
      period: nextPeriod,
      dueDate,
      daysRemaining: diff > 0 ? diff : 0,
      daysOverdue: diff < 0 ? Math.abs(diff) : 0,
      isOverdue: diff < 0,
    },

    debt: {
      pendingMonths: pendingPeriods.length,
      total: pendingPeriods.length * client.amount,
      periods: pendingPeriods.map((p) => p.period),
    },

    history,
  };
}

};
