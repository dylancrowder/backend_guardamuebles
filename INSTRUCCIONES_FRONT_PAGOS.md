# Instrucciones para el frontend: pagos de Guardamuebles

Implementar en la seccion de pagos realizados las acciones para registrar pagos, pagar varios meses, editar pagos y eliminarlos.

## API

Todas las rutas usan el prefijo `/api/payments`. Reemplazar `API_BASE_URL` por la URL configurada para el backend.

### Listar pagos de un cliente

```http
GET {API_BASE_URL}/api/payments/getPayments/{clientId}
```

La respuesta contiene `payments` y `pagination`. Cada pago incluye, entre otros campos:

- `_id`: identificador que se usa para editar o eliminar.
- `amount`: monto pagado por ese mes.
- `period`: mes cubierto, en formato `YYYY-MM`.
- `paymentDate`: fecha en que se recibio el pago.
- `description`: descripcion del pago; puede ser una cadena vacia.

### Registrar el pago de un mes

```http
POST {API_BASE_URL}/api/payments/addPayment/{clientId}
Content-Type: application/json
```

```json
{
  "amount": 25000,
  "period": "2026-10",
  "paymentDate": "2026-10-12",
  "description": "Pago en efectivo"
}
```

### Registrar varios meses juntos

Permitir seleccionar mas de un mes. Enviar los meses en `periods`, usando el formato `YYYY-MM`.

```http
POST {API_BASE_URL}/api/payments/addPayment/{clientId}
Content-Type: application/json
```

```json
{
  "amount": 25000,
  "periods": ["2026-10", "2026-11"],
  "paymentDate": "2026-10-12",
  "description": "Pago adelantado por transferencia"
}
```

`amount` es el monto por mes, no el total de todos los meses. El backend crea un pago separado por cada periodo seleccionado y conserva la misma fecha y descripcion en cada uno. No permitir seleccionar periodos repetidos ni periodos que ya esten pagados; el backend tambien valida esto.

Se pueden incluir periodos adeudados y periodos futuros en la misma operacion. No limitar el selector a meses vencidos o al mes actual: permitir elegir tambien meses por adelantado que aun no esten pagados. Por ejemplo, si el cliente debe septiembre y quiere adelantar noviembre y diciembre, enviar `periods` con esos tres periodos. Los meses futuros pagados quedaran cubiertos, pero no cancelan automaticamente otros meses adeudados que no se hayan incluido.

La respuesta al registrar un solo periodo es un objeto de pago; al registrar varios, es un arreglo de pagos. Para procesar ambos casos:

```js
const payments = Array.isArray(responseData)
  ? responseData
  : [responseData];
```

### Editar un pago realizado

Usar el `_id` del pago seleccionado. El body puede incluir solo los campos que se desean cambiar.

```http
PUT {API_BASE_URL}/api/payments/updatePayment/{paymentId}
Content-Type: application/json
```

Ejemplo para actualizar monto, mes, fecha y descripcion:

```json
{
  "amount": 25000,
  "period": "2026-10",
  "paymentDate": "2026-10-12",
  "description": "Pago actualizado por transferencia"
}
```

Ejemplo para actualizar solamente la descripcion:

```json
{
  "description": "Pago actualizado"
}
```

La descripcion se envia en la propiedad exacta `description` (no `descripcion`). Es opcional y admite hasta 300 caracteres.

### Eliminar un pago realizado

Usar el `_id` del pago y pedir confirmacion antes de eliminarlo.

```http
DELETE {API_BASE_URL}/api/payments/deletePayment/{paymentId}
```

## Comportamiento de la interfaz

- En cada pago realizado, mostrar acciones para editar y eliminar.
- Usar `_id` como identificador; no usar el periodo como identificador del registro.
- Al editar, cargar los datos actuales del pago en el formulario y enviar solo los campos editados.
- Para registrar varios meses, permitir seleccionar meses adeudados, el mes actual y meses futuros no pagados. Mostrar claramente que el importe ingresado se aplica a cada mes.
- Tras registrar, editar o eliminar un pago, volver a consultar los pagos y actualizar el historial/estado de deuda.
- Mostrar los errores devueltos por el backend, por ejemplo cuando un periodo ya fue pagado.
