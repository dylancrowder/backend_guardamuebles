import mongoose from 'mongoose';

const financeMovementSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => `finanza_${new mongoose.Types.ObjectId().toString()}`
    },
    type: {
      type: String,
      required: true,
      enum: ['ingreso', 'egreso']
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    date: {
      type: String,
      required: true,
      trim: true,
      match: /^\d{4}-\d{2}-\d{2}$/
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    createdAt: {
      type: Number,
      default: () => Date.now()
    }
  },
  {
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id;
        return ret;
      }
    }
  }
);

export const FinanceMovementModel = mongoose.model('finance_movements', financeMovementSchema);
