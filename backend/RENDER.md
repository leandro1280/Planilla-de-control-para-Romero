# 🚀 Guía de Deploy en Render.com

## Configuración en Render

### 1. Root Directory
```
backend
```

### 2. Build Command
```
npm install
```

### 3. Start Command
```
npm start
```

## Variables de Entorno Requeridas

Configura estas variables en Render Dashboard → Environment:

### MongoDB
```
MONGODB_URI=mongodb+srv://sirleo1280_db_user:Frida@romero.gdd47wm.mongodb.net/romero_stock?retryWrites=true&w=majority
```

### JWT Secret
```
JWT_SECRET=romero_panificados_secret_key_produccion_cambiar_2024
```

### Node Environment
```
NODE_ENV=production
```

### Puerto (Opcional - Render lo asigna automáticamente)
```
PORT=3000
```

## Instrucciones

1. **Conectar repositorio**: Conecta tu repositorio de GitHub/GitLab a Render
2. **Root Directory**: Establece `backend` como directorio raíz
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. **Environment Variables**: Agrega todas las variables de entorno mencionadas arriba
6. **Deploy**: Haz clic en "Deploy Web Service"

## Notas Importantes

- Render asigna automáticamente el puerto mediante `process.env.PORT`
- Asegúrate de que el `MONGODB_URI` permita conexiones desde cualquier IP (0.0.0.0/0)
- El `JWT_SECRET` debe ser único y seguro en producción
- Considera usar un dominio personalizado en la configuración de Render

