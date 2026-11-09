import { Request, Response } from 'express';
import { fromBuffer } from 'file-type';
import mongoose from 'mongoose';
import { clientPhotosService } from './client-photos.service';

const invalidClientId = (clientId: string) => !mongoose.Types.ObjectId.isValid(clientId);
const getClientId = (req: Request): string => {
  const clientId = req.params.clientId;
  return Array.isArray(clientId) ? clientId[0] || '' : clientId;
};

export const clientPhotosController = {
  list: async (req: Request, res: Response) => {
    const clientId = getClientId(req);
    if (invalidClientId(clientId)) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    try {
      const photos = await clientPhotosService.list(clientId);
      if (photos === null) return res.status(404).json({ message: 'Cliente no encontrado' });
      return res.status(200).json(photos);
    } catch (error) {
      console.error('Error al listar fotos del cliente:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  upload: async (req: Request, res: Response) => {
    const clientId = getClientId(req);
    if (invalidClientId(clientId)) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Debes enviar una imagen en el campo photo' });
    }

    try {
      const detectedType = await fromBuffer(req.file.buffer);
      if (!detectedType?.mime.startsWith('image/')) {
        return res.status(400).json({ message: 'El archivo enviado no es una imagen válida' });
      }

      const photo = await clientPhotosService.create(
        clientId,
        req.file.buffer,
        detectedType.mime,
        detectedType.ext
      );
      if (!photo) return res.status(404).json({ message: 'Cliente no encontrado' });
      return res.status(201).json(photo);
    } catch (error) {
      console.error('Error al subir foto del cliente:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};
