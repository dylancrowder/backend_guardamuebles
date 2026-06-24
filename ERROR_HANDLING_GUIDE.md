# Guía de Sistema de Manejo de Errores Mejorado

## 📋 Descripción General

Se ha implementado un sistema completo de manejo de errores con logs detallados para facilitar el debugging. El sistema incluye:

- Clases de error personalizadas
- Respuestas de error estructuradas
- Logging automático con información de contexto
- Middlewares de manejo global de errores
- Validación de entrada mejorada

## 🏗️ Componentes Principales

### 1. **AppError** - Clase Base de Errores

```typescript
import { AppError } from './utils/response';

throw new AppError(
  statusCode: number,      // Código HTTP (400, 404, 500, etc)
  code: string,             // Código único del error
  message: string,          // Mensaje descriptivo
  details?: object,         // Información adicional
  originalError?: Error     // Error original (para debugging)
);
```

**Ejemplo:**
```typescript
throw new AppError(
  404,
  'CUSTOMER_NOT_FOUND',
  'Cliente no encontrado',
  { customerId: '123abc' },
  originalError
);
```

### 2. **Helper Functions** - Funciones Auxiliares

#### `createNotFoundError(resource, id?)`
```typescript
import { createNotFoundError } from './utils/response';

throw createNotFoundError('Cliente', clientId);
// Resultado: 404, NOT_FOUND, "Cliente no encontrado"
```

#### `createValidationError(field, message, value?)`
```typescript
import { createValidationError } from './utils/response';

throw createValidationError('email', 'El email debe ser único', userEmail);
// Resultado: 400, VALIDATION_ERROR, "Validación fallida en email"
```

#### `createDuplicateError(field, value)`
```typescript
import { createDuplicateError } from './utils/response';

throw createDuplicateError('email', userEmail);
// Resultado: 409, DUPLICATE_ERROR, "Ya existe un email con ese valor"
```

#### `createBadRequestError(message, details?)`
```typescript
import { createBadRequestError } from './utils/response';

throw createBadRequestError('Datos inválidos', { campo: 'valor' });
// Resultado: 400, BAD_REQUEST, "Datos inválidos"
```

## 🔍 Sistema de Logging

### Automatic Logging (Se Ejecuta Automáticamente)

Cada error es registrado automáticamente con:

```
[TIMESTAMP] ERROR_CODE [REQUEST_ID]
- statusCode
- message
- method (HTTP)
- path
- query (si existen)
- body (si existen)
- validationErrors (si aplica)
- stack trace (solo en development)
```

**Ejemplo de log:**
```
[2024-01-20T14:30:00.000Z] VALIDATION_ERROR [abc123def]
{
  "statusCode": 400,
  "message": "Validación fallida en email",
  "method": "POST",
  "path": "/api/clients",
  "details": {
    "field": "email",
    "message": "El email debe ser único",
    "value": "juan@ejemplo.com"
  }
}
```

### Manual Logging en Services

```typescript
import { logger } from './utils/logger';

// Info log
logger.info('Cliente creado', { customerId: client._id, email: client.email });

// Error log
logger.error('Error creando cliente', error, { email: data.email });

// Debug log (solo en development)
logger.debug('Datos del cliente', { ...client });

// Warning log
logger.warn('Cliente sin pagos registrados', { customerId: client._id });
```

## 📊 Estructura de Respuestas

### Respuesta de Éxito

```json
{
  "success": true,
  "message": "Cliente creado exitosamente",
  "data": {
    "_id": "64f5a3b2c1e4d2b5f8a7c1d2",
    "nombre": "Juan Pérez",
    ...
  }
}
```

### Respuesta de Error (Production)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validación fallida en email",
    "timestamp": "2024-01-20T14:30:00.000Z",
    "details": {
      "field": "email",
      "message": "El email debe ser único",
      "value": "juan@ejemplo.com"
    }
  }
}
```

### Respuesta de Error (Development - Incluye Stack Trace)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validación fallida en email",
    "timestamp": "2024-01-20T14:30:00.000Z",
    "details": {...},
    "stack": "Error: Validación fallida en email\n    at createValidationError...",
    "originalMessage": "Error message from try/catch"
  }
}
```

## 💡 Patrones de Uso

### En Controllers

```typescript
import { handleError, successResponse, createValidationError } from '../../utils/response';

export const customersController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validar entrada
      if (!req.body.email) {
        throw createValidationError('email', 'Email requerido');
      }

      // Llamar al servicio
      const customer = await customersService.create(req.body);
      
      // Respuesta de éxito
      return res.status(201).json(
        successResponse('Cliente creado exitosamente', customer)
      );
    } catch (error: any) {
      // Manejo automático de errores
      handleError(error, req, res, 400);
    }
  }
};
```

### En Services

```typescript
import { 
  createNotFoundError, 
  createDuplicateError, 
  createBadRequestError 
} from '../../utils/response';

export const customersService = {
  getById: async (id: string) => {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw createBadRequestError('ID inválido', { providedId: id });
      }

      const customer = await CustomerModel.findById(id);
      if (!customer) {
        throw createNotFoundError('Cliente', id);
      }

      logger.info('Cliente obtenido', { customerId: id });
      return customer;
    } catch (error: any) {
      logger.error('Error obteniendo cliente', error, { id });
      throw error;
    }
  },

  create: async (data: CustomerData) => {
    try {
      const existingEmail = await CustomerModel.findOne({ email: data.email });
      if (existingEmail) {
        throw createDuplicateError('email', data.email);
      }

      const customer = await CustomerModel.create(data);
      logger.info('Cliente creado', { customerId: customer._id });
      return customer;
    } catch (error: any) {
      logger.error('Error creando cliente', error, { email: data.email });
      throw error;
    }
  }
};
```

## 🚨 Códigos de Error Comunes

| Código | Status | Descripción |
|--------|--------|-------------|
| `NOT_FOUND` | 404 | Recurso no encontrado |
| `VALIDATION_ERROR` | 400 | Error en validación de datos |
| `DUPLICATE_ERROR` | 409 | Recurso duplicado (email, etc) |
| `BAD_REQUEST` | 400 | Solicitud inválida |
| `INTERNAL_SERVER_ERROR` | 500 | Error interno del servidor |
| `DUPLICATE_KEY_ERROR` | 409 | Error de llave única en BD |
| `TYPE_ERROR` | 400 | Error de tipo de dato |

## 📝 Debugging Checklist

### Cuando obtengas un error:

1. **Revisar la respuesta del API**
   - ¿Cuál es el código de error? (`error.code`)
   - ¿Cuál es el mensaje? (`error.message`)
   - ¿Cuáles son los detalles? (`error.details`)

2. **Revisar los logs del servidor**
   ```
   [TIMESTAMP] ERROR_CODE [REQUEST_ID]
   - Busca el REQUEST_ID en los logs
   - Verifica el stack trace (en development)
   - Revisa los detalles de la solicitud
   ```

3. **Validar entrada**
   - ¿Los campos requeridos están presentes?
   - ¿Los valores son del tipo correcto?
   - ¿Cumplen con las restricciones (min, max, formato)?

4. **Validar ID de MongoDB**
   - ¿El ID tiene 24 caracteres hexadecimales?
   - ¿Existe realmente el documento?

5. **Revisar logs de la BD**
   - ¿La conexión a MongoDB está activa?
   - ¿La consulta está siendo ejecutada?

## 🔧 Variables de Entorno para Debugging

```bash
# Habilitar logs en producción
NODE_ENV=production

# Habilitar logs de development (más detallados)
NODE_ENV=development

# Con development obtendrás:
# - Stack traces en respuestas de error
# - Logs de debug
# - Información más detallada
```

## ✅ Best Practices

### ✓ HACER

```typescript
// ✓ Usar helpers específicos para cada tipo de error
throw createNotFoundError('Cliente', id);

// ✓ Incluir details relevantes
throw new AppError(400, 'INVALID_DATE', 'Fecha inválida', { 
  providedDate: dateString 
});

// ✓ Hacer logging en services
logger.info('Operación completada', { operationId, duration });

// ✓ Validar en el nivel correcto
if (!id.match(/^[0-9a-fA-F]{24}$/)) {
  throw createBadRequestError('ID inválido', { providedId: id });
}
```

### ✗ NO HACER

```typescript
// ✗ Usar Error genérico
throw new Error('Algo salió mal');

// ✗ Pasar información sensible en details
throw new AppError(500, 'DB_ERROR', 'Error BD', { 
  connectionString: mongoUri  // ¡NO!
});

// ✗ Ignorar errores
await operation().catch(() => {});

// ✗ Responder con strings directos
res.status(400).json({ error: error.message });  // ¡Usar successResponse/errorResponse!
```

## 📞 Soporte

Si encuentras un error nuevo:

1. Identifica el patrón de error
2. Crea un helper específico si es necesario
3. Documenta el código de error
4. Usa logging consistente

### Ejemplo de nuevo error:

```typescript
// En response.ts
export const createInvalidFormatError = (field: string, expectedFormat: string) => {
  return new AppError(
    400,
    'INVALID_FORMAT',
    `Formato inválido para ${field}`,
    { field, expectedFormat }
  );
};

// En el código
if (!email.includes('@')) {
  throw createInvalidFormatError('email', 'user@domain.com');
}
```

## 🎯 Objetivos Logrados

✅ **Errores claros y estructurados** - Cada error tiene código, mensaje y detalles  
✅ **Logging automático** - Se registra toda la información importante  
✅ **Stack traces en development** - Fácil debugging  
✅ **Respuestas consistentes** - Formato uniforme en todos los endpoints  
✅ **Validación mejorada** - Errores descriptivos con detalles  
✅ **Request tracking** - Cada request tiene un ID único para rastreo  
✅ **Información sensible segura** - Los detalles se ocultan en producción  

---

**Versión:** 1.0.0  
**Última actualización:** 2024-01-20
