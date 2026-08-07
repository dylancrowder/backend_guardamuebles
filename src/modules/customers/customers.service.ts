import { CustomerModel } from './customers.model';
import { AppError, createNotFoundError, createBadRequestError, createValidationError } from '../../utils/response';
import { PaymentModel } from '../payments/payments.model';

interface CustomerData {
  box?: number[];
  name?: string;
  whatsapp?: string;
  entryDate?: Date;
  amount?: number;
  observations?: string;
}

export const normalizeCustomerBoxes = (value: unknown): number[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'number') return item;
        if (typeof item === 'string') {
          const trimmed = item.trim();
          return trimmed ? Number(trimmed) : NaN;
        }
        return NaN;
      })
      .filter((item): item is number => Number.isFinite(item) && item > 0);
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? [value] : [];
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    return trimmed
      .split(/[,;\s]+/)
      .filter(Boolean)
      .map((item) => Number(item))
      .filter((item): item is number => Number.isFinite(item) && item > 0);
  }

  return [];
};

export const customersService = {
  getAll: async (query: Record<string, any>) => {
    try {

      let clients = await CustomerModel.find(query)
      console.log('Clientes encontrados:', clients);

      return clients
    } catch (error: any) {
      console.error('Error en customersService.getAll:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw createBadRequestError('ID de cliente inválido', { providedId: id });
      }

      const client = await CustomerModel.findById(id);
      if (!client) {
        throw createNotFoundError('Cliente', id);
      }


      return client;
    } catch (error: any) {
      console.error('Error en customersService.getById:', { id, error: error.message });
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const entryDate = new Date(data.entryDate);

      if (isNaN(entryDate.getTime())) {
        throw createValidationError('entryDate', 'Fecha de entrada inválida', data.entryDate);
      }

      const boxes = normalizeCustomerBoxes(data.box ?? data.boxes);

      const mappedData: CustomerData = {
        box: boxes,
        name: data.name || data.nombre,
        whatsapp: data.whatsapp || data.telefono,
        entryDate: entryDate,
        amount: data.amount || data.limiteCredito,
        observations: data.observations || ''
      };

      const requiredFields = ['box', 'name', 'whatsapp', 'entryDate', 'amount'];
      const missingFields = requiredFields.filter(field => {
        if (field === 'box') return mappedData.box?.length === 0;
        return !mappedData[field as keyof CustomerData];
      });

      if (missingFields.length > 0) {
        throw createBadRequestError('Campos requeridos faltantes', { missingFields });
      }

      if (mappedData.amount && mappedData.amount <= 0) {
        throw createValidationError('amount', 'El monto debe ser mayor a 0', mappedData.amount);
      }



      const customer = await CustomerModel.create(mappedData);
      console.log('Cliente creado exitosamente:', { customerId: customer._id, name: customer.name });
      return customer;
    } catch (error: any) {
      console.error('Error en customersService.create:', error.message);
      if (error instanceof AppError) throw error;
      throw createBadRequestError('Error al crear cliente', { originalError: error.message });
    }
  },

  update: async (id: string, data: any) => {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw createBadRequestError('ID de cliente inválido', { providedId: id });
      }

      const existingClient = await CustomerModel.findById(id);
      if (!existingClient) {
        throw createNotFoundError('Cliente', id);
      }

      const mappedData: CustomerData = {};
      if (data.box !== undefined || data.boxes !== undefined) {
        const boxes = normalizeCustomerBoxes(data.box ?? data.boxes);
        if (boxes.length === 0) {
          throw createValidationError('box', 'Debe proporcionar al menos un box válido', data.box ?? data.boxes);
        }
        mappedData.box = boxes;
      }
      if (data.name || data.nombre) mappedData.name = data.name || data.nombre;
      if (data.whatsapp || data.telefono) mappedData.whatsapp = data.whatsapp || data.telefono;
      if (data.entryDate) {
        const entryDate = new Date(data.entryDate);
        if (isNaN(entryDate.getTime())) {
          throw createValidationError('entryDate', 'Fecha de entrada inválida', data.entryDate);
        }
        mappedData.entryDate = entryDate;
      }
      if (data.amount !== undefined || data.limiteCredito !== undefined) {
        mappedData.amount = data.amount || data.limiteCredito;
      }
      if (data.observations !== undefined) mappedData.observations = data.observations;

      if (mappedData.amount && mappedData.amount <= 0) {
        throw createValidationError('amount', 'El monto debe ser mayor a 0', mappedData.amount);
      }

      const updatedCustomer = await CustomerModel.findByIdAndUpdate(
        id,
        mappedData,
        {
          new: true,
          runValidators: true
        }
      );

      console.log('Cliente actualizado exitosamente:', { customerId: id });
      return updatedCustomer;
    } catch (error: any) {
      console.error('Error en customersService.update:', { id, error: error.message });
      if (error instanceof AppError) throw error;
      throw createBadRequestError('Error al actualizar cliente', { originalError: error.message });
    }
  },

  delete: async (id: string) => {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw createBadRequestError('ID de cliente inválido', { providedId: id });
      }

      const client = await CustomerModel.findById(id);
      if (!client) {
        throw createNotFoundError('Cliente', id);
      }

      await CustomerModel.findByIdAndDelete(id);

      console.log('Cliente eliminado exitosamente:', { customerId: id });
      return {
        message: 'Cliente eliminado exitosamente',
        deletedClient: {
          _id: client._id
        }
      };
    } catch (error: any) {
      console.error('Error en customersService.delete:', { id, error: error.message });
      if (error instanceof AppError) throw error;
      throw createBadRequestError('Error al eliminar cliente', { originalError: error.message });
    }
  }
  ,


  getAllInfo: async () => {
    const clients = await CustomerModel.find();

    if (!clients.length) {
      throw createNotFoundError("No hay clientes registrados");
    }

    const now = new Date();

    const result = await Promise.all(
      clients.map(async (client) => {
        const payments = await PaymentModel.find({
          clientId: client._id,
        }).sort({
          period: 1,
        });

        const billingDay = client.entryDate.getUTCDate();

        const startYear = client.entryDate.getUTCFullYear();
        const startMonth = client.entryDate.getUTCMonth();

        const paymentsMap = new Map(
          payments.map((payment) => [
            payment.period,
            payment,
          ])
        );

        let endYear = now.getUTCFullYear();
        let endMonth = now.getUTCMonth();

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
          });

          month++;

          if (month > 11) {
            month = 0;
            year++;
          }
        }

        const overduePeriods = history.filter((item) => {
          if (item.status === "PAID") return false;

          const [y, m] = item.period.split("-").map(Number);

          const dueDate = new Date(
            Date.UTC(y, m - 1, billingDay, 12)
          );

          return now >= dueDate;
        });

        const lastPaid =
          payments.length > 0
            ? payments[payments.length - 1]
            : null;

        let nextDuePeriod: string;

        if (overduePeriods.length > 0) {
          nextDuePeriod = overduePeriods[0].period;
        } else if (lastPaid) {
          const [y, m] = lastPaid.period.split("-").map(Number);

          let nextYear = y;
          let nextMonth = m + 1;

          if (nextMonth > 12) {
            nextMonth = 1;
            nextYear++;
          }

          nextDuePeriod = `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
        } else {
          nextDuePeriod = `${startYear}-${String(
            startMonth + 1
          ).padStart(2, "0")}`;
        }

        const [dueYear, dueMonth] =
          nextDuePeriod.split("-").map(Number);

        const nextDueDate = new Date(
          Date.UTC(dueYear, dueMonth - 1, billingDay, 12)
        );

        const diffDays = Math.ceil(
          (nextDueDate.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
        );

        return {
          ...client.toObject(),

          nextDueDate,

          daysRemaining:
            diffDays > 0 ? diffDays : 0,

          daysOverdue:
            diffDays < 0 ? Math.abs(diffDays) : 0,

          monthsOwed:
            overduePeriods.length,
        };
      })
    );

    return result;
  },
};
