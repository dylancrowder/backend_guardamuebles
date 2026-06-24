import { CustomerModel } from './customers.model';
import { AppError, createNotFoundError, createBadRequestError, createValidationError } from '../../utils/response';

interface CustomerData {
  name?: string;
  whatsapp?: string;
  entryDate?: Date;
  dueDate?: Date;
  monthlyAmount?: number;
  observations?: string;
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

getAll: async (filters: Record<string, any>) => {
  try {
    const customers = await CustomerModel.find(filters).lean();

    const customersWithStatus = customers.map((customer) => ({
      ...customer,
      status: calculateClientStatus(customer.dueDate),
    }));

    return customersWithStatus;
  } catch (error: any) {
    console.error('Error en customersService.getAll:', error.message);
    throw createBadRequestError('Error al obtener clientes', {
      originalError: error.message,
    });
  }
},


create: async (data: CustomerData) => {
  try {
    if (!data.entryDate) {
      throw createBadRequestError('La fecha de entrada es obligatoria');
    }

    const entryDate = new Date(data.entryDate);
    const dueDate = new Date(entryDate);
    dueDate.setMonth(dueDate.getMonth() + 1);

    const customer = await CustomerModel.create({
      ...data,
      dueDate,
    });

    console.log('Cliente creado exitosamente:', customer);
    return customer;
  } catch (error: any) {
    console.error('Error en customersService.create:', error.message);

    if (error instanceof AppError) throw error;

    throw createBadRequestError('Error al crear cliente', {
      originalError: error.message,
    });
  }
},


};
