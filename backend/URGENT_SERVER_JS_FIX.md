# ⚠️ URGENTE: Archivo server.js Sobrescrito

## Problema

El archivo `backend/server.js` fue accidentalmente sobrescrito durante los cambios de tests. 
El archivo ahora solo tiene 25 líneas cuando debería tener más de 200.

## Solución

**NECESITAS RESTAURAR EL ARCHIVO DESDE:**
1. Un backup reciente
2. Control de versiones (git) si está disponible
3. O puedo ayudarte a reconstruirlo basándome en la estructura del proyecto

## Contenido Mínimo que debe tener server.js

El archivo debe incluir (en orden):
1. `require` statements (express, mongoose, dotenv, etc.)
2. Configuración de dotenv
3. Conexión a MongoDB (connectDB)
4. Creación de app Express
5. Middleware (helmet, cors, bodyParser, cookieParser, morgan)
6. Configuración de Handlebars
7. Rutas (auth, dashboard, inventario, movimientos, etc.)
8. Middleware de errores
9. Iniciar tareas programadas (cron)
10. Exportar app para tests
11. Iniciar servidor (solo si no es test)

## Para Probar Tests Mientras Tanto

Los tests están configurados pero necesitan que `server.js` esté completo.

**Opciones:**
1. Restaurar `server.js` desde backup
2. Pedirme que lo reconstruya (puedo hacerlo si me confirmas)
3. Trabajar sin tests temporalmente

## Archivos de Configuración de Tests (OK)

✅ `jest.config.js` - Configurado correctamente
✅ `tests/setup.js` - Creado correctamente  
✅ `tests/inventario.test.js` - Listo (esperando server.js)
✅ `tests/auth.test.js` - Listo (esperando server.js)
✅ `tests/security.test.js` - Listo (esperando server.js)

**¿Quieres que reconstruya server.js ahora?** Puedo hacerlo basándome en la estructura del proyecto que hemos estado desarrollando.

