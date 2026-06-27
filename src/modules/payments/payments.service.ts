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

  // Si existen pagos adelantados, extender el historial
  if (payments.length > 0) {
    const lastPaid = payments[payments.length - 1].period;
    const [y, m] = lastPaid.split("-").map(Number);

    if (
      y > endYear ||
      (y === endYear && m - 1 > endMonth)
    ) {
      endYear = y;
      endMonth = m - 1;
    }
  }

  const history = [];

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

  /**
   * SOLO cuentan como deuda
   * los períodos que YA vencieron.
   *
   * Ej:
   * Período 2026-06
   * vence el 26/07
   */
  const overduePeriods = history.filter((item) => {
    if (item.status === "PAID") return false;

    const [y, m] = item.period.split("-").map(Number);

    // El período vence un mes después
    const dueDate = new Date(
      Date.UTC(y, m, billingDay)
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

  const [dueYear, dueMonth] = nextDuePeriod
    .split("-")
    .map(Number);

  /**
   * El próximo vencimiento
   * es un mes después del período.
   */
  const nextDueDate = new Date(
    Date.UTC(
      dueYear,
      dueMonth,
      billingDay
    )
  );

  const diffDays = Math.ceil(
    (nextDueDate.getTime() - now.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return {
    client,

    account: {
      status:
        overduePeriods.length > 0
          ? "OVERDUE"
          : "CURRENT",

      lastPaidPeriod: lastPaidPeriod
        ? {
            period: lastPaidPeriod.period,
            paymentDate: lastPaidPeriod.paymentDate,
            amount: lastPaidPeriod.amount,
          }
        : null,

      nextDuePeriod,

      nextDueDate,

      daysRemaining:
        diffDays > 0 ? diffDays : 0,

      daysOverdue:
        diffDays < 0 ? Math.abs(diffDays) : 0,

      monthsOwed: overduePeriods.length,

      totalDebt:
        overduePeriods.length * client.amount,

      pendingPeriods: overduePeriods.map(
        (x) => x.period
      ),
    },

    history,
  };
}

};
