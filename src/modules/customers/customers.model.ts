import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    // Información básica
    name: {
      type: String,
      required: [true, 'El nombre es requerido'],
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
      trim: true
    },
    whatsapp: {
      type: String,
      required: [true, 'El WhatsApp es requerido'],
      trim: true
    },
    // Fechas
    entryDate: {
      type: Date,
      required: [true, 'La fecha de entrada es requerida']
    },
    dueDate: {
      type: Date,
      required: [true, 'La fecha de vencimiento es requerida']
    },
    // Monto
    amount: {
      type: Number,
      required: [true, 'El monto mensual es requerido'],
      min: [0.01, 'El monto debe ser mayor a 0']
    },
    // Observaciones
    observations: {
      type: String,
      default: '',
      maxlength: [500, 'Las observaciones no pueden exceder 500 caracteres']
    }
  },
  {
    timestamps: true
  }
);


export const CustomerModel = mongoose.model(
  'clientes',
  customerSchema
);
