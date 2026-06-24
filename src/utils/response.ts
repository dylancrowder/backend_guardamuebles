import { Request, Response } from 'express';

const isDevelopment = process.env.NODE_ENV === 'development';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, any>,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const successResponse = (
  message: string,
  data: unknown = null
) => ({
  success: true,
  message,
  data
});

export const errorResponse = (
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, any>,
  originalError?: Error
) => {
  const response: any = {
    success: false,
    error: {
      code,
      message,
      timestamp: new Date().toISOString()
    }
  };

  if (details) {
    response.error.details = details;
  }

  if (isDevelopment && originalError) {
    response.error.stack = originalError.stack;
    response.error.originalMessage = originalError.message;
  }

  return response;
};

export const handleError = (
  error: any,
  req: Request,
  res: Response,
  defaultStatusCode: number = 500
) => {
  const timestamp = new Date().toISOString();
  const requestId = Math.random().toString(36).substring(7);
  const method = req.method;
  const path = req.path;
  const query = Object.keys(req.query).length > 0 ? req.query : undefined;
  const body = req.method !== 'GET' ? req.body : undefined;

  let statusCode = defaultStatusCode;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Error interno del servidor';
  let details: Record<string, any> = {
    requestId,
    method,
    path
  };

  if (query) details.query = query;
  if (body) details.body = body;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    if (error.details) {
      details = { ...details, ...error.details };
    }

    console.error(`[${timestamp}] ${code} [${requestId}]`, {
      statusCode,
      message,
      method,
      path,
      details,
      stack: error.originalError?.stack
    });
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Error de validación';
    const validationErrors: Record<string, string> = {};

    Object.keys(error.errors || {}).forEach((field) => {
      validationErrors[field] = error.errors[field].message;
    });

    details.validationErrors = validationErrors;

    console.error(`[${timestamp}] ${code} [${requestId}]`, {
      statusCode,
      message,
      method,
      path,
      details,
      stack: error.stack
    });
  } else if (error.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY_ERROR';
    message = 'El recurso ya existe';

    const field = Object.keys(error.keyPattern || {})[0];
    details.field = field;
    details.value = error.keyValue?.[field];

    console.error(`[${timestamp}] ${code} [${requestId}]`, {
      statusCode,
      message,
      method,
      path,
      field,
      stack: error.stack
    });
  } else if (error instanceof TypeError) {
    statusCode = 400;
    code = 'TYPE_ERROR';
    message = 'Error de tipo de dato';

    console.error(`[${timestamp}] ${code} [${requestId}]`, {
      statusCode,
      message,
      method,
      path,
      details,
      stack: error.stack
    });
  } else {
    code = error.code || 'UNKNOWN_ERROR';
    message = error.message || 'Ocurrió un error desconocido';

    console.error(`[${timestamp}] ${code} [${requestId}]`, {
      statusCode,
      message,
      method,
      path,
      details,
      stack: error.stack
    });
  }

  const response = errorResponse(statusCode, code, message, details, error);
  res.status(statusCode).json(response);
};

export const createValidationError = (
  field: string,
  message: string,
  value?: any
) => {
  return new AppError(
    400,
    'VALIDATION_ERROR',
    `Validación fallida en ${field}`,
    {
      field,
      message,
      value
    }
  );
};

export const createNotFoundError = (resource: string, id?: string) => {
  return new AppError(
    404,
    'NOT_FOUND',
    `${resource} no encontrado`,
    { resource, id }
  );
};

export const createDuplicateError = (field: string, value: any) => {
  return new AppError(
    409,
    'DUPLICATE_ERROR',
    `Ya existe un ${field.toLowerCase()} con ese valor`,
    { field, value }
  );
};

export const createBadRequestError = (message: string, details?: Record<string, any>) => {
  return new AppError(
    400,
    'BAD_REQUEST',
    message,
    details
  );
};
