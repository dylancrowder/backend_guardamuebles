import { VentaModel } from './ventas.model';

export interface VentaInput {
  whatsapp: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  description?: string;
}

const isValidDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
};

const isValidTime = (value: string) => {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hour, minute] = value.split(':').map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
};

const validateInput = (data: unknown): VentaInput => {
  if (!data || typeof data !== 'object') {
    throw new Error('El cuerpo de la solicitud debe ser un objeto JSON');
  }

  const input = data as Record<string, unknown>;
  const requiredFields = ['whatsapp', 'origin', 'destination', 'date', 'time'];
  const missingField = requiredFields.find(
    (field) => typeof input[field] !== 'string' || !(input[field] as string).trim()
  );

  if (missingField) throw new Error(`${missingField} es obligatorio y debe ser un string`);
  if (!isValidDate(input.date as string)) throw new Error('date debe ser una fecha real con formato YYYY-MM-DD');
  if (!isValidTime(input.time as string)) throw new Error('time debe tener formato HH:mm y ser un horario válido');
  if (input.description !== undefined && typeof input.description !== 'string') {
    throw new Error('description debe ser un string');
  }

  return {
    whatsapp: (input.whatsapp as string).trim(),
    origin: (input.origin as string).trim(),
    destination: (input.destination as string).trim(),
    date: input.date as string,
    time: input.time as string,
    description: typeof input.description === 'string' ? input.description.trim() : ''
  };
};

export const ventasService = {
  getAll: async () => VentaModel.find().sort({ date: 1, time: 1 }),

  create: async (data: unknown) => {
    const input = validateInput(data);
    return VentaModel.create(input);
  },

  update: async (id: string, data: unknown) => {
    const input = validateInput(data);
    const venta = await VentaModel.findOneAndUpdate(
      { id },
      { ...input, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!venta) throw new Error('Turno inexistente');
    return venta;
  },

  delete: async (id: string) => {
    const venta = await VentaModel.findOneAndDelete({ id });
    if (!venta) throw new Error('Turno inexistente');
  }
};
