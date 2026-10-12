import { PaymentModel } from './payments.model';
import { CustomerModel } from '../customers/customers.model';
import { createNotFoundError, createBadRequestError, createValidationError } from '../../utils/response';

interface PaymentData {
  amount: number;
  period?: string;
  periods?: string[];
  paymentDate?: Date | string;
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

      const periods = data.periods ?? (data.period ? [data.period] : []);

      if (periods.length === 0) {
        throw createValidationError(
          "periods",
          "Debe indicar al menos un período en formato YYYY-MM",
          periods
        );
      }

      if (periods.some((period) => !/^\d{4}-(0[1-9]|1[0-2])$/.test(period))) {
        throw createValidationError(
          "periods",
          "El formato debe ser YYYY-MM",
          periods
        );
      }

      if (new Set(periods).size !== periods.length) {
        throw createBadRequestError("No se puede incluir un período más de una vez");
      }

      const existingPayments = await PaymentModel.find({
        clientId,
        period: { $in: periods },
      });

      if (existingPayments.length > 0) {
        throw createBadRequestError(
          `El período ${existingPayments[0].period} ya fue abonado`
        );
      }

      const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();
      if (Number.isNaN(paymentDate.getTime())) {
        throw createValidationError("paymentDate", "Fecha de pago inválida", data.paymentDate);
      }

      const payments = await PaymentModel.insertMany(periods.map((period) => ({
        clientId,
        amount: data.amount,
        period,
        paymentDate,
        description: data.description ?? "",
      })));

      return payments.length === 1 ? payments[0] : payments;
    } catch (error) {
      console.error("Error en paymentsService.addPayment:", error);
      throw error;
    }
  },

  updatePayment: async (paymentId: string, data: Partial<PaymentData>) => {
    if (!paymentId || !/^[0-9a-fA-F]{24}$/.test(paymentId)) {
      throw createBadRequestError("ID de pago inválido", { providedId: paymentId });
    }

    const payment = await PaymentModel.findById(paymentId);
    if (!payment) {
      throw createNotFoundError("Pago", paymentId);
    }

    const update: Record<string, unknown> = {};

    if (data.amount !== undefined) {
      if (!Number.isFinite(data.amount) || data.amount <= 0) {
        throw createValidationError("amount", "El monto debe ser mayor a 0", data.amount);
      }
      update.amount = data.amount;
    }

    if (data.period !== undefined) {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(data.period)) {
        throw createValidationError("period", "El formato debe ser YYYY-MM", data.period);
      }

      const existing = await PaymentModel.findOne({
        clientId: payment.clientId,
        period: data.period,
        _id: { $ne: paymentId },
      });
      if (existing) {
        throw createBadRequestError(`El período ${data.period} ya fue abonado`);
      }
      update.period = data.period;
    }

    if (data.paymentDate !== undefined) {
      const paymentDate = new Date(data.paymentDate);
      if (Number.isNaN(paymentDate.getTime())) {
        throw createValidationError("paymentDate", "Fecha de pago inválida", data.paymentDate);
      }
      update.paymentDate = paymentDate;
    }

    if (data.description !== undefined) {
      update.description = data.description;
    }

    return PaymentModel.findByIdAndUpdate(paymentId, update, {
      new: true,
      runValidators: true,
    });
  },

  deletePayment: async (paymentId: string) => {
    if (!paymentId || !/^[0-9a-fA-F]{24}$/.test(paymentId)) {
      throw createBadRequestError("ID de pago inválido", { providedId: paymentId });
    }

    const payment = await PaymentModel.findByIdAndDelete(paymentId);
    if (!payment) {
      throw createNotFoundError("Pago", paymentId);
    }

    return { success: true, id: paymentId };
  },

detailPayments: async (clientId: string) => {
  const client = await CustomerModel.findById(clientId);

  if (!client) {
    throw createNotFoundError("Cliente no encontrado");
  }

  const payments = await PaymentModel.find({ clientId }).sort({
    period: 1,
  });

  const paymentsMap = new Map(
    payments.map((payment) => [payment.period, payment])
  );

  const billingDay = client.entryDate.getUTCDate();

  const startYear = client.entryDate.getUTCFullYear();
  const startMonth = client.entryDate.getUTCMonth();

  const now = new Date();

  let endYear = now.getUTCFullYear();
  let endMonth = now.getUTCMonth();

  // extender historial si hay pagos adelantados
  if (payments.length > 0) {
    const lastPaid = payments[payments.length - 1].period;
    const [y, m] = lastPaid.split("-").map(Number);

    if (y > endYear || (y === endYear && m - 1 > endMonth)) {
      endYear = y;
      endMonth = m - 1;
    }
  }

  const history: any[] = [];

  let year = startYear;
  let month = startMonth;

  while (
    year < endYear ||
    (year === endYear && month <= endMonth)
  ) {
    const period = `${year}-${String(month + 1).padStart(2, "0")}`;

    const payment = paymentsMap.get(period);

    history.push({
      period,
      status: payment ? "PAID" : "PENDING",
      paymentDate: payment?.paymentDate ?? null,
      amount: payment?.amount ?? client.amount,
    });

    month++;

    if (month > 11) {
      month = 0;
      year++;
    }
  }

  // períodos vencidos
  const overduePeriods = history.filter((item) => {
    if (item.status === "PAID") return false;

    const [y, m] = item.period.split("-").map(Number);

    const dueDate = new Date(
      Date.UTC(y, m - 1, billingDay, 12)
    );

    return now >= dueDate;
  });

  const lastPaidPeriod =
    payments.length > 0
      ? payments[payments.length - 1]
      : null;

  let nextDuePeriod: string;

  if (overduePeriods.length > 0) {
    nextDuePeriod = overduePeriods[0].period;
  } else if (lastPaidPeriod) {
    const [y, m] = lastPaidPeriod.period.split("-").map(Number);

    let nextYear = y;
    let nextMonth = m + 1;

    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }

    nextDuePeriod = `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
  } else {
    nextDuePeriod = `${startYear}-${String(startMonth + 1).padStart(2, "0")}`;
  }

  const [dueYear, dueMonth] = nextDuePeriod.split("-").map(Number);

  // ✅ FIX FINAL: corrección de base 1 → base 0
  const nextDueDate = new Date(
    Date.UTC(dueYear, dueMonth - 1, billingDay, 12)
  );

  const diffDays = Math.ceil(
    (nextDueDate.getTime() - now.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return {
    client,
    account: {
      status: overduePeriods.length > 0 ? "OVERDUE" : "CURRENT",

      lastPaidPeriod: lastPaidPeriod
        ? {
            period: lastPaidPeriod.period,
            paymentDate: lastPaidPeriod.paymentDate,
            amount: lastPaidPeriod.amount,
          }
        : null,

      nextDuePeriod,
      nextDueDate,

      daysRemaining: diffDays > 0 ? diffDays : 0,
      daysOverdue: diffDays < 0 ? Math.abs(diffDays) : 0,

      monthsOwed: overduePeriods.length,
      totalDebt: overduePeriods.length * client.amount,

      pendingPeriods: overduePeriods.map((x) => x.period),
    },

    history,
  };
},

};
