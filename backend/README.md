# Romero Panificados - Sistema de Control de Stock

Sistema completo de gestión de inventario para Romero Panificados con autenticación, permisos y reportes.

## 🚀 Instalación y Configuración

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Copia el archivo `.env.example` a `.env` y configura:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/romero_stock
JWT_SECRET=tu_secreto_jwt_muy_seguro_cambiar_en_produccion
JWT_EXPIRE=7d
NODE_ENV=development
```

### 3. Iniciar MongoDB
Asegúrate de que MongoDB esté corriendo localmente o usa MongoDB Atlas.

### 4. Ejecutar la aplicación

**Desarrollo:**
```bash
npm run dev
```

**Producción:**
```bash
npm start
```

## 👥 Usuarios por defecto

El sistema crea automáticamente estos usuarios:

### Administradores:
- **Sergio Franco**: sergio.franco@romero.com / Admin123!
- **Nahuel Romero**: nahuel.romero@romero.com / Admin123!
- **Escuela Técnica**: escuela@romero.com / Admin123!

### Usuarios Nivel 1:
- **Guillermo Kleimbielen**: guillermo.kleimbielen@romero.com / User1123!
- **Javier Speroni**: javier.speroni@romero.com / User1123!

⚠️ **IMPORTANTE**: Cambia estas contraseñas en producción.

## 🔐 Sistema de Permisos

- **Administrador**: Acceso total (modificación, carga, borrado)
- **Usuario 1**: Carga/descarga, agregado de componentes, NO borra registros
- **Usuario Común**: Solo descarga y visualización para búsqueda

## 📁 Estructura del Proyecto

```
backend/
├── config/          # Configuración (base de datos)
├── controllers/     # Controladores de rutas
├── middleware/      # Middlewares (auth, security, errors)
├── models/          # Modelos de MongoDB
├── routes/          # Definición de rutas
├── utils/           # Utilidades (validators, token)
├── views/           # Vistas Handlebars
│   ├── auth/       # Login, registro
│   ├── inventario/ # Vista de inventario
│   ├── movimientos/# Vista de movimientos
│   ├── layouts/    # Layouts principales
│   └── partials/   # Componentes reutilizables
└── public/          # Archivos estáticos (CSS, JS)
```

## 🛡️ Seguridad

- JWT para autenticación
- bcrypt para hash de contraseñas
- Rate limiting (protección contra saturación)
- express-mongo-sanitize (protección NoSQL injection)
- express-validator (validación de datos)
- Helmet (headers de seguridad)

## 📊 Funcionalidades

- ✅ Gestión de productos (CRUD)
- ✅ Registro de movimientos (ingresos/egresos)
- ✅ Filtros y búsqueda avanzada
- ✅ Gráficos y estadísticas
- ✅ Descarga de planillas Excel
- ✅ Alertas de stock bajo/crítico
- ✅ Sistema de permisos granular

## 🌐 Despliegue en Render

1. Conecta tu repositorio a Render
2. Configura las variables de entorno
3. Usa MongoDB Atlas para la base de datos
4. Deploy automático en cada push

