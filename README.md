# Guardamuebles & Fletes API

Backend API para la gestión de guardamuebles y fletes. Sistema de gestión de clientes, pagos, gastos e ingresos con dashboard de estadísticas.

## Tecnologías

- Node.js
- Express.js
- TypeScript
- MongoDB (Mongoose)
- CORS
- Helmet
- Morgan
- Vercel (Serverless)

## Instalación

1. Clonar el repositorio
2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar el archivo `.env` con tus credenciales de MongoDB:
```
PORT=3001
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/guardamuebles
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

## Scripts

- `npm run dev` - Iniciar servidor en modo desarrollo con hot reload
- `npm run build` - Compilar TypeScript a JavaScript
- `npm start` - Iniciar servidor en producción
- `npm run lint` - Ejecutar linter

## Despliegue en Vercel

### Configuración previa

1. **Variables de entorno en Vercel**:
   - `MONGODB_URI` - Tu URI de MongoDB Atlas
   - `NODE_ENV` - `production`
   - `CORS_ORIGIN` - Dominio de tu frontend (ej: `https://tu-frontend.vercel.app`)

2. **MongoDB Atlas**:
   - Asegúrate de que tu cluster de MongoDB Atlas permita conexiones desde cualquier IP (0.0.0.0/0) o agrega las IPs de Vercel
   - Configura connection pooling adecuado para serverless (maxPoolSize: 10)

### Despliegue

**Opción 1: Desde Vercel Dashboard**
1. Conecta tu repositorio de GitHub a Vercel
2. Importa el proyecto
3. Configura las variables de entorno
4. Haz deploy

**Opción 2: Desde CLI**
```bash
npm install -g vercel
vercel
```

**Opción 3: Automático con GitHub**
- Push a tu repositorio de GitHub
- Vercel hará deploy automático en cada push

### Consideraciones importantes para Serverless

- **Conexión MongoDB**: La conexión está cacheada para evitar agotar el límite de conexiones
- **Cold starts**: El primer request puede ser más lento (cold start)
- **Timeout**: Vercel tiene un límite de 10 segundos para funciones serverless (Hobby) o 60 segundos (Pro)
- **Base de datos gratis**: MongoDB Atlas gratis tiene límite de 500 conexiones simultáneas

## Estructura del Proyecto

```
src/
├── config/
│   ├── database.ts      # Configuración de MongoDB
│   └── env.ts           # Variables de entorno
├── modules/
│   ├── customers/       # Módulo de clientes
│   ├── payments/        # Módulo de pagos
│   ├── expenses/        # Módulo de gastos/ingresos
│   └── dashboard/       # Módulo de dashboard
├── routes/
│   └── index.ts         # Rutas principales
├── utils/
│   └── response.ts      # Utilidades de respuesta
├── app.ts               # Configuración de Express
└── server.ts            # Punto de entrada
```

## Endpoints

### Clientes

- `GET /api/clients` - Obtener lista de clientes (con filtros y paginación)
- `GET /api/clients/:clientId` - Obtener cliente por ID
- `POST /api/clients` - Crear nuevo cliente
- `PUT /api/clients/:clientId` - Actualizar cliente
- `DELETE /api/clients/:clientId` - Eliminar cliente

### Pagos

- `POST /api/clients/:clientId/payments` - Registrar pago para un cliente
- `DELETE /api/clients/:clientId/payments/:paymentId` - Eliminar pago

### Gastos e Ingresos

- `GET /api/expenses` - Obtener lista de movimientos (con filtros)
- `GET /api/expenses/stats` - Obtener estadísticas de gastos/ingresos
- `POST /api/expenses` - Crear nuevo movimiento
- `PUT /api/expenses/:expenseId` - Actualizar movimiento
- `DELETE /api/expenses/:expenseId` - Eliminar movimiento

### Dashboard

- `GET /api/dashboard/stats` - Obtener estadísticas generales del dashboard

## Modelos de Datos

### Cliente
```typescript
{
  nombre: string;           // Requerido, min 2, max 100
  empresa: string;          // Requerido, min 2, max 100
  email: string;            // Requerido, único, formato email
  telefono: string;         // Requerido
  direccion: string;        // Requerido, min 5, max 200
  limiteCredito: number;    // Requerido, min 0
  diaPago: number;          // Requerido, 1-31
}
```

### Pago
```typescript
{
  clienteId: ObjectId;     // Requerido, referencia a cliente
  monto: number;           // Requerido, min 0.01
  fecha: Date;             // Requerido
  descripcion?: string;     // Opcional, max 300
}
```

### Gasto/Ingreso
```typescript
{
  tipo: 'ingreso' | 'egreso';                    // Requerido
  monto: number;                                 // Requerido, min 0.01
  categoria: 'flete' | 'guardamuebles' | 'gasoil' | 'repuestos' | 'empleados' | 'otros'; // Requerido
  registradoPor: 'Dylan' | 'Jordan';             // Requerido
  fecha: Date;                                   // Requerido
  notas?: string;                                // Opcional, max 500
}
```

## Ejemplos de Uso

### Crear Cliente
```bash
curl -X POST http://localhost:3001/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "empresa": "Transportes JP",
    "email": "juan@ejemplo.com",
    "telefono": "1234567890",
    "direccion": "Calle 123, CABA",
    "limiteCredito": 50000,
    "diaPago": 15
  }'
```

### Registrar Pago
```bash
curl -X POST http://localhost:3001/api/clients/64f5a3b2c1e4d2b5f8a7c1d2/payments \
  -H "Content-Type: application/json" \
  -d '{
    "monto": 5000,
    "fecha": "2024-01-20T14:30:00Z",
    "descripcion": "Pago parcial por flete"
  }'
```

### Crear Gasto
```bash
curl -X POST http://localhost:3001/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "egreso",
    "monto": 1500,
    "categoria": "gasoil",
    "registradoPor": "Dylan",
    "fecha": "2024-01-20T10:15:00Z",
    "notas": "Carga de combustible para camión 1"
  }'
```

## Validaciones

- **Email**: Debe ser único y tener formato válido
- **Montos**: Deben ser mayores a 0
- **Fechas**: Deben ser válidas y en formato ISO 8601
- **Enums**: Deben coincidir exactamente con los valores permitidos

## Cálculos Automáticos

- **Estado del cliente**: Se calcula automáticamente (paid/pending/overdue)
- **Días hasta pago**: Se calcula en base al día de pago y fecha actual
- **Días atrasado**: Se calcula si el cliente está vencido
- **Totales**: Se calculan sumando pagos y movimientos

## Licencia

MIT
