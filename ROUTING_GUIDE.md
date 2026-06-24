# Guía de Routing y Controllers

## 📍 Mapeo de Endpoints a Controllers

### CLIENTES

| Endpoint | Método | Controller | Función | Descripción |
|----------|--------|-----------|---------|-------------|
| `/api/clients` | GET | `customersController` | `getAll()` | Obtiene lista de clientes con filtros |
| `/api/clients/:clientId` | GET | `customersController` | `getById()` | Obtiene cliente específico |
| `/api/clients` | POST | `customersController` | `create()` | Crea nuevo cliente |
| `/api/clients/:clientId` | PUT | `customersController` | `update()` | Actualiza cliente |
| `/api/clients/:clientId` | DELETE | `customersController` | `delete()` | Elimina cliente |

**Archivo:** `src/modules/customers/customers.controller.ts`
**Servicio:** `src/modules/customers/customers.service.ts`
**Rutas:** `src/modules/customers/customers.routes.ts`

---

### PAGOS

| Endpoint | Método | Controller | Función | Descripción |
|----------|--------|-----------|---------|-------------|
| `/api/clients/:clientId/payments` | POST | `paymentsController` | `create()` | Registra pago para cliente |
| `/api/clients/:clientId/payments/:paymentId` | DELETE | `paymentsController` | `delete()` | Elimina pago |

**Archivo:** `src/modules/payments/payments.controller.ts`
**Servicio:** `src/modules/payments/payments.service.ts`
**Rutas:** `src/modules/payments/payments.routes.ts`

---

### GASTOS E INGRESOS

| Endpoint | Método | Controller | Función | Descripción |
|----------|--------|-----------|---------|-------------|
| `/api/expenses` | GET | `expensesController` | `getAll()` | Obtiene lista de movimientos |
| `/api/expenses/:expenseId` | GET | `expensesController` | `getById()` | Obtiene movimiento específico |
| `/api/expenses` | POST | `expensesController` | `create()` | Crea nuevo movimiento |
| `/api/expenses/:expenseId` | PUT | `expensesController` | `update()` | Actualiza movimiento |
| `/api/expenses/:expenseId` | DELETE | `expensesController` | `delete()` | Elimina movimiento |
| `/api/expenses/stats` | GET | `expensesController` | `getStats()` | Obtiene estadísticas |

**Archivo:** `src/modules/expenses/expenses.controller.ts`
**Servicio:** `src/modules/expenses/expenses.service.ts`
**Rutas:** `src/modules/expenses/expenses.routes.ts`

---

### DASHBOARD

| Endpoint | Método | Controller | Función | Descripción |
|----------|--------|-----------|---------|-------------|
| `/api/dashboard/stats` | GET | `dashboardController` | `getStats()` | Obtiene estadísticas del dashboard |

**Archivo:** `src/modules/dashboard/dashboard.controller.ts`
**Servicio:** `src/modules/dashboard/dashboard.service.ts`
**Rutas:** `src/modules/dashboard/dashboard.routes.ts`

---

## 📂 Estructura de Directorios

```
src/
├── modules/
│   ├── customers/
│   │   ├── customers.controller.ts      ← Lógica de respuesta HTTP
│   │   ├── customers.service.ts         ← Lógica de negocio
│   │   ├── customers.model.ts           ← Esquema MongoDB
│   │   └── customers.routes.ts          ← Definición de rutas
│   ├── payments/
│   │   ├── payments.controller.ts
│   │   ├── payments.service.ts
│   │   ├── payments.model.ts
│   │   └── payments.routes.ts
│   ├── expenses/
│   │   ├── expenses.controller.ts
│   │   ├── expenses.service.ts
│   │   ├── expenses.model.ts
│   │   └── expenses.routes.ts
│   └── dashboard/
│       ├── dashboard.controller.ts
│       ├── dashboard.service.ts
│       └── dashboard.routes.ts
├── routes/
│   └── index.ts                         ← Registro central de rutas
├── config/
│   ├── database.ts
│   └── env.ts
├── utils/
│   ├── response.ts                      ← Manejo de errores
│   └── logger.ts                        ← Sistema de logging
├── app.ts                               ← Configuración de Express
└── server.ts                            ← Punto de entrada
```

---

## 🔄 Flujo de una Solicitud

```
Cliente (Frontend)
    ↓
POST /api/clients
    ↓
src/routes/index.ts (Router)
    ↓
src/modules/customers/customers.routes.ts
    ↓
src/modules/customers/customers.controller.ts
    ├── Valida entrada
    └── Llama al servicio
    ↓
src/modules/customers/customers.service.ts
    ├── Lógica de negocio
    ├── Accede a la BD
    └── Retorna datos
    ↓
customers.controller.ts (Continúa)
    ├── Maneja errores (si hay)
    └── Devuelve respuesta HTTP
    ↓
Cliente (Recibe respuesta JSON)
```

---

## 🛠️ Cómo Agregar un Nuevo Endpoint

### 1. Crear el Controller (customers.controller.ts)
```typescript
/**
 * POST /api/clients/bulk
 * Crea múltiples clientes
 * Body: array de objetos cliente
 */
bulkCreate: async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customers = await customersService.bulkCreate(req.body);
    return res.status(201).json(customers);
  } catch (error: any) {
    handleError(error, req, res, 400);
  }
}
```

### 2. Crear el Servicio (customers.service.ts)
```typescript
bulkCreate: async (data: CustomerData[]) => {
  try {
    const customers = await CustomerModel.insertMany(data);
    logger.info('Clientes creados en lote', { count: customers.length });
    return customers;
  } catch (error: any) {
    logger.error('Error creando clientes en lote', error);
    throw error;
  }
}
```

### 3. Registrar la Ruta (customers.routes.ts)
```typescript
router.post('/bulk', customersController.bulkCreate);
```

### 4. Documentar en tu guía
```
| `/api/clients/bulk` | POST | `customersController` | `bulkCreate()` | Crea múltiples clientes |
```

---

## 🎯 Patrones Usados

### Error Handling
```typescript
// En controllers:
try {
  const result = await service.operation();
  return res.json(result);
} catch (error: any) {
  handleError(error, req, res, 400);
}
```

### Validación de Parámetros
```typescript
if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
  throw createBadRequestError('ID inválido', { providedId: id });
}
```

### Logging
```typescript
logger.info('Operación completada', { customerId, duration });
logger.error('Error en operación', error, { context });
```

---

## 📞 Quick Reference

**¿Dónde cambio la lógica de crear un cliente?**
→ `src/modules/customers/customers.service.ts` - función `create()`

**¿Dónde valido los parámetros de entrada?**
→ `src/modules/customers/customers.controller.ts` - en el método correspondiente

**¿Dónde defino las rutas?**
→ `src/modules/customers/customers.routes.ts` y se registran en `src/routes/index.ts`

**¿Dónde manejo errores globales?**
→ `src/app.ts` - middleware de error global

**¿Dónde están los logs?**
→ Consola (stdout) - look para `[TIMESTAMP] ERROR_CODE`

---

## 🚀 Comandos Útiles

```bash
# Iniciar servidor
npm run dev

# Compilar TypeScript
npm run build

# Iniciar producción
npm start

# Linter
npm run lint
```

---

**Última actualización:** 2024-01-20
**Versión:** 1.0.0
