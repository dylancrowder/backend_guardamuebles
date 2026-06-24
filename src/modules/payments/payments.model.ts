import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'clientes',
      required: [true, 'El ID del cliente es requerido']
    },
    amount: {
      type: Number,
      required: [true, 'El monto es requerido'],
      min: [0.01, 'El monto debe ser mayor a 0']
    },
    date: {
      type: Date,
      required: [true, 'La fecha del pago es requerida'],
      default: () => new Date()
    },
    monthDate: {
      type: String,
      required: [true, 'La fecha del mes es requerida'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'El formato debe ser YYYY-MM-DD']
    }
  },
  {
    timestamps: true
  }
);

export const PaymentModel = mongoose.model('pagos', paymentSchema);
