import mongoose from 'mongoose';

const ventasSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => `turno_${new mongoose.Types.ObjectId().toString()}`
    },
    whatsapp: {
      type: String,
      required: true,
      trim: true
    },
    origin: {
      type: String,
      required: true,
      trim: true
    },
    destination: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/
    },
    time: {
      type: String,
      required: true,
      match: /^(?:[01]\d|2[0-3]):[0-5]\d$/
    },
    description: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id;
        return ret;
      }
    }
  }
);

ventasSchema.index({ date: 1, time: 1 }, { unique: true });

export const VentaModel = mongoose.model('ventas', ventasSchema);
