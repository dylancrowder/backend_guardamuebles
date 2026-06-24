import { CustomerModel } from './customers.model';
import { AppError, createNotFoundError, createBadRequestError, createValidationError } from '../../utils/response';

interface CustomerData {
  fullName?: string;
  whatsapp?: string;
  entryDate?: Date;
  dueDate?: Date;
  monthlyAmount?: number;
  observations?: string;
}

interface ClientFilters {
  search?: string;
  page?: number;
  limit?: number;
}

const calculateClientStatus = (
  dueDate: Date
): 'paid' | 'pending' | 'overdue' => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDateNormalized = new Date(dueDate);
  dueDateNormalized.setHours(0, 0, 0, 0);

  if (dueDateNormalized < today) {
    return 'overdue';
  } else if (dueDateNormalized.getTime() === today.getTime()) {
    return 'pending';
  }

  return 'pending';
};

export const customersService = {
  getAll: async (filters: ClientFilters = {}) => {
    try {
      const { search, page = 1, limit = 10 } = filters;

      let query: any = {};

      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { whatsapp: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;

      let clients = await CustomerModel.find(query)
        .skip(skip)
        .limit(limit)
        .lean();

      const totalResults = await CustomerModel.countDocuments(query);
      const totalPages = Math.ceil(totalResults / limit);

      clients = clients.map((client: any) => {
        const clientStatus = calculateClientStatus(client.dueDate);

        return {
          ...client,
          estado: clientStatus
        };
      });

      return {
        clients,
        pagination: {
          currentPage: page,
          totalPages,
          totalResults,
          limit
        }
      };
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

      const clientStatus = calculateClientStatus(client.dueDate);

      return {
        ...client.toObject(),
        estado: clientStatus
      };
    } catch (error: any) {
      console.error('Error en customersService.getById:', { id, error: error.message });
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      // Mapear campos antiguos a nuevos si existen
      const mappedData: CustomerData = {
        fullName: data.fullName || data.nombre,
        whatsapp: data.whatsapp || data.telefono,
        entryDate: data.entryDate,
        dueDate: data.dueDate,
        monthlyAmount: data.monthlyAmount || data.limiteCredito,
        observations: data.observations || ''
      };

      const requiredFields = ['fullName', 'whatsapp', 'entryDate', 'dueDate', 'monthlyAmount'];
      const missingFields = requiredFields.filter(field => !mappedData[field as keyof CustomerData]);

      if (missingFields.length > 0) {
        throw createBadRequestError('Campos requeridos faltantes', { missingFields });
      }

      if (mappedData.monthlyAmount && mappedData.monthlyAmount <= 0) {
        throw createValidationError('monthlyAmount', 'El monto debe ser mayor a 0', mappedData.monthlyAmount);
      }

      if (mappedData.entryDate && mappedData.dueDate) {
        const entry = new Date(mappedData.entryDate);
        const due = new Date(mappedData.dueDate);
        if (due <= entry) {
          throw createValidationError('dueDate', 'La fecha de vencimiento debe ser posterior a la fecha de entrada');
        }
      }

      const customer = await CustomerModel.create(mappedData);
      console.log('Cliente creado exitosamente:', { customerId: customer._id, fullName: customer.fullName });
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

      // Mapear campos antiguos a nuevos si existen
      const mappedData: CustomerData = {};
      if (data.fullName || data.nombre) mappedData.fullName = data.fullName || data.nombre;
      if (data.whatsapp || data.telefono) mappedData.whatsapp = data.whatsapp || data.telefono;
      if (data.entryDate) mappedData.entryDate = data.entryDate;
      if (data.dueDate) mappedData.dueDate = data.dueDate;
      if (data.monthlyAmount !== undefined || data.limiteCredito !== undefined) {
        mappedData.monthlyAmount = data.monthlyAmount || data.limiteCredito;
      }
      if (data.observations !== undefined) mappedData.observations = data.observations;

      if (mappedData.monthlyAmount && mappedData.monthlyAmount <= 0) {
        throw createValidationError('monthlyAmount', 'El monto debe ser mayor a 0', mappedData.monthlyAmount);
      }

      if (mappedData.entryDate || mappedData.dueDate) {
        const entry = mappedData.entryDate || existingClient.entryDate;
        const due = mappedData.dueDate || existingClient.dueDate;
        if (due <= entry) {
          throw createValidationError('dueDate', 'La fecha de vencimiento debe ser posterior a la fecha de entrada');
        }
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
};
