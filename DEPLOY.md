# Guía de Deploy en Render

## Requisitos Previos

- Cuenta de GitHub con el repositorio sincronizado
- Cuenta en [Render.com](https://render.com)
- MongoDB Atlas configurado con una base de datos

## Pasos para Deploy

### 1. Preparar Variables de Entorno

Antes de hacer deploy, asegúrate de tener estas variables configuradas en Render:

- **NODE_ENV**: `production`
- **PORT**: `3000`
- **MONGODB_URI**: Tu conexión string de MongoDB Atlas (ej: `mongodb+srv://username:password@cluster.mongodb.net/guardamuebles?retryWrites=true&w=majority`)
- **CORS_ORIGIN**: La URL de tu frontend (ej: `https://frontguarda.netlify.app`)

### 2. Crear el Servicio en Render

1. Inicia sesión en [Render Dashboard](https://dashboard.render.com)
2. Click en "+ New" → "Web Service"
3. Selecciona tu repositorio de GitHub
4. Configura:
   - **Name**: `guardamuebles-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (o el que prefieras)

### 3. Configurar Variables de Entorno

En la sección "Environment" del servicio en Render:
1. Añade todas las variables listadas en el paso 1
2. Asegúrate de que `MONGODB_URI` sea correcta y accesible desde Render

### 4. Verificar la Conexión MongoDB

En MongoDB Atlas:
1. Ve a Network Access
2. Añade la IP `0.0.0.0/0` (Render no tiene IPs fijas) o usa el whitelist de Render
3. Verifica que el usuario de base de datos tiene los permisos correctos

### 5. Deploy

1. Click en "Create Web Service"
2. Render iniciará automáticamente el build y el deploy
3. Monitorea los logs en el dashboard

## Verificar que el Deploy fue Exitoso

Una vez deployed, verifica:

```bash
# Health check endpoint
curl https://your-render-app-url.onrender.com/health
```

Deberías recibir una respuesta como:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "uptime": 125.456
}
```

## Troubleshooting

### El servidor no inicia

- Revisa los logs en Render Dashboard
- Verifica que las variables de entorno estén correctas
- Asegúrate de que MONGODB_URI sea válida

### Errores de conexión a MongoDB

- Verifica el whitelist de IP en MongoDB Atlas
- Comprueba que el usuario y contraseña son correctos
- Asegúrate de que la base de datos existe

### CORS errors en el frontend

- Verifica que `CORS_ORIGIN` está configurado correctamente
- Incluye el protocolo completo (http:// o https://)

## Actualizaciones Futuras

Cada push a `main` en GitHub iniciará automáticamente un nuevo deploy en Render.

## URLs Importantes

- **Render Dashboard**: https://dashboard.render.com
- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
- **API Health Check**: `https://your-app-url.onrender.com/health`
