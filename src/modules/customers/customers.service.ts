import { CustomerModel } from './customers.model';
import { AppError, createNotFoundError, createBadRequestError, createValidationError } from '../../utils/response';

interface CustomerData {
  name?: string;
  whatsapp?: string;
  entryDate?: Date;
  amount?: number;
  observations?: string;
}




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
   
      const mappedData: CustomerData = {
        name: data.name || data.nombre,
        whatsapp: data.whatsapp || data.telefono,
        entryDate: entryDate,
        amount: data.amount || data.limiteCredito,
        observations: data.observations || ''
      };

      const requiredFields = ['name', 'whatsapp', 'entryDate', 'amount'];
      const missingFields = requiredFields.filter(field => !mappedData[field as keyof CustomerData]);

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
      if (data.name || data.nombre) mappedData.name = data.name || data.nombre;
      if (data.whatsapp || data.telefono) mappedData.whatsapp = data.whatsapp || data.telefono;
      if (data.entryDate) mappedData.entryDate = data.entryDate;
      if (data.dueDate) mappedData.dueDate = data.dueDate;
      if (data.amount !== undefined || data.limiteCredito !== undefined) {
        mappedData.amount = data.amount || data.limiteCredito;
      }
      if (data.observations !== undefined) mappedData.observations = data.observations;

      if (mappedData.amount && mappedData.amount <= 0) {
        throw createValidationError('amount', 'El monto debe ser mayor a 0', mappedData.amount);
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
