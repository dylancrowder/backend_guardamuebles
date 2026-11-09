import { NextFunction, Request, Response } from 'express';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1
  }
}).single('photo');

export const parseClientPhoto = (req: Request, res: Response, next: NextFunction) => {
  upload(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'La imagen no puede superar los 10 MB'
        : 'El archivo enviado no es válido';
      return res.status(400).json({ message });
    }
    if (error) {
      console.error('Error al procesar la carga de foto:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
    return next();
  });
};
