import { FinanceMovementModel } from './finanzas.model';

export const INCOME_CATEGORIES = ['guardamuebles', 'viaje', 'varios'] as const;
export const EXPENSE_CATEGORIES = ['empleados', 'combustible', 'gastos varios', 'materiales', 'publicidad'] as const;

export type FinanceType = 'ingreso' | 'egreso';
export type FinanceCategory = typeof INCOME_CATEGORIES[number] | typeof EXPENSE_CATEGORIES[number];

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_REGEX = /^\d{4}-\d{2}$/;

const CATEGORY_BY_TYPE: Record<FinanceType, readonly string[]> = {
  ingreso: INCOME_CATEGORIES,
  egreso: EXPENSE_CATEGORIES
};

const isValidDateString = (value: string) => {
  if (!ISO_DATE_REGEX.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
};

const isValidMonthString = (value: string) => MONTH_REGEX.test(value);

export const validateFinanceMovement = (data: unknown) => {
  if (!data || typeof data !== 'object') {
    throw new Error('El cuerpo de la solicitud debe ser un objeto JSON');
  }

  const input = data as Record<string, unknown>;

  if (typeof input.type !== 'string' || !['ingreso', 'egreso'].includes(input.type.trim())) {
    throw new Error('type es obligatorio y debe ser ingreso o egreso');
  }

  const type = input.type.trim() as FinanceType;
  const categoryRaw = typeof input.category === 'string' ? input.category.trim() : '';

  if (!categoryRaw) {
    throw new Error('category es obligatoria');
  }

  if (!CATEGORY_BY_TYPE[type].includes(categoryRaw)) {
    throw new Error(`La categoría "${categoryRaw}" no es válida para tipo "${type}"`);
  }

  const amountValue = typeof input.amount === 'number'
    ? input.amount
    : typeof input.amount === 'string' && input.amount.trim() !== ''
      ? Number(input.amount)
      : NaN;

  if (!Number.isFinite(amountValue) || amountValue <= 0) {
    throw new Error('El monto debe ser mayor a 0');
  }

  if (typeof input.date !== 'string' || !isValidDateString(input.date)) {
    throw new Error('date debe venir en formato ISO YYYY-MM-DD');
  }

  const description = typeof input.description === 'string'
    ? input.description
    : typeof input.description === 'undefined'
      ? ''
      : (() => {
          throw new Error('description debe ser un string');
        })();

  return {
    type,
    category: categoryRaw,
    amount: amountValue,
    date: input.date,
    description: description ?? '',
    createdAt: Date.now()
  };
};

export const buildFinanceSummary = (movements: Array<{ type: string; amount: number }>) => {
  const ingresos = movements
    .filter((item) => item.type === 'ingreso')
    .reduce((total, item) => total + Number(item.amount || 0), 0);

  const egresos = movements
    .filter((item) => item.type === 'egreso')
    .reduce((total, item) => total + Number(item.amount || 0), 0);

  return {
    ingresos,
    egresos,
    total: ingresos - egresos
  };
};

export const buildCategorySummary = (movements: Array<{ category: string; amount: number }>) => {
  const totals = new Map<string, number>();

  movements.forEach((item) => {
    const key = item.category;
    totals.set(key, (totals.get(key) || 0) + Number(item.amount || 0));
  });

  return Array.from(totals.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total || a.category.localeCompare(b.category));
};

const normalizeMonth = (month?: string) => {
  if (!month) return undefined;
  const trimmedMonth = month.trim();

  if (!isValidMonthString(trimmedMonth)) {
    throw new Error('El mes debe tener formato YYYY-MM');
  }

  return trimmedMonth;
};

export const finanzasService = {
  getAll: async () => {
    return FinanceMovementModel.find().sort({ date: -1, createdAt: -1 });
  },

  create: async (data: unknown) => {
    const movementData = validateFinanceMovement(data);
    return FinanceMovementModel.create(movementData);
  },

  update: async (id: string, data: unknown) => {
    const movement = await FinanceMovementModel.findOne({ id });
    if (!movement) {
      const error = new Error('Movimiento no encontrado') as Error & { statusCode?: number };
      error.statusCode = 404;
      throw error;
    }

    const movementData = validateFinanceMovement(data);
    const updated = await FinanceMovementModel.findOneAndUpdate(
      { id },
      { ...movementData },
      { new: true, runValidators: true }
    );

    return updated;
  },

  delete: async (id: string) => {
    const result = await FinanceMovementModel.findOneAndDelete({ id });
    if (!result) {
      const error = new Error('Movimiento no encontrado') as Error & { statusCode?: number };
      error.statusCode = 404;
      throw error;
    }

    return { success: true, id };
  },

  getSummary: async (month?: string) => {
    const normalizedMonth = normalizeMonth(month);
    const filter = normalizedMonth ? { date: { $regex: `^${normalizedMonth}-` } } : {};
    const movements = await FinanceMovementModel.find(filter).select('type amount date');
    const summary = buildFinanceSummary(movements.map((movement) => ({
      type: movement.type,
      amount: Number(movement.amount)
    })));

    if (normalizedMonth) {
      return {
        month: normalizedMonth,
        ...summary
      };
    }

    return summary;
  },

  getCategorySummary: async (month?: string) => {
    const normalizedMonth = normalizeMonth(month);
    const filter = normalizedMonth ? { date: { $regex: `^${normalizedMonth}-` } } : {};
    const movements = await FinanceMovementModel.find(filter).select('category amount');

    return buildCategorySummary(movements.map((movement) => ({
      category: movement.category,
      amount: Number(movement.amount)
    })));
  }
};
