import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "clientes",
      required: [true, "El ID del cliente es requerido"],
    },

    amount: {
      type: Number,
      required: [true, "El monto es requerido"],
      min: [0.01, "El monto debe ser mayor a 0"],
    },

    // Mes que se está abonando
    // Ej: "2026-06"
    period: {
      type: String,
      required: [true, "El período es requerido"],
      match: [/^\d{4}-\d{2}$/, "El formato debe ser YYYY-MM"],
    },

    // Fecha real en la que se recibió el pago
    paymentDate: {
      type: Date,
      required: [true, "La fecha del pago es requerida"],
      default: Date.now,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [300, "La descripción no puede superar los 300 caracteres"],
    },
  },
  {
    timestamps: true,
  }
);

// Evita que un cliente pague dos veces el mismo período
paymentSchema.index(
  { clientId: 1, period: 1 },
  { unique: true }
);

export const PaymentModel = mongoose.model("pagos", paymentSchema);