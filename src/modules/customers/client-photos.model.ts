import mongoose from 'mongoose';

const clientPhotoSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'clientes',
      required: true,
      index: true
    },
    storagePath: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    secure_url: {
      type: String
    },
    format: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      required: true
    }
  },
  { versionKey: false }
);

export const ClientPhotoModel = mongoose.model('clientphotos', clientPhotoSchema);
