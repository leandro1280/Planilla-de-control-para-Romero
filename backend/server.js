require('dotenv').config();

// Configurar zona horaria de Argentina (America/Argentina/Buenos_Aires, UTC-3)
// Esto afecta a todas las operaciones de fecha/hora en Node.js
process.env.TZ = 'America/Argentina/Buenos_Aires';

// Validar variables de entorno críticas ANTES de importar otros módulos
const { validateEnvironment } = require('./utils/validateEnv');
validateEnvironment();

const express = require('express');
const mongoose = require('mongoose');
const hbs = require('express-handlebars');
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const compression = require('compression');
const connectDB = require('./config/database');
const { setupSecurity } = require('./middleware/security');
const { sanitizeBody, validateObjectId, sanitizeSearch } = require('./middleware/sanitize');
const errorHandler = require('./middleware/errorHandler').errorHandler;
const { iniciarTareasProgramadas } = require('./services/servicioCron');

// Conectar a MongoDB
const logger = require('./utils/logger');
connectDB().catch(err => {
  logger.error('Error conectando a MongoDB', err);
});

// Crear app Express
const app = express();

// Optimizaciones para producción
if (process.env.NODE_ENV === 'production') {
  // Deshabilitar X-Powered-By header (ya lo hace Helmet, pero por si acaso)
  app.disable('x-powered-by');
  
  // Trust proxy (importante si está detrás de un reverse proxy como Render)
  // Render usa un reverse proxy, así que confiar en el primer proxy
  app.set('trust proxy', 1);
  
  // Habilitar view cache
  app.enable('view cache');
}

// Middleware básico - Seguridad mejorada
// Nota: 'unsafe-inline' es necesario para Bootstrap y algunos scripts inline
// En producción, considerar usar nonces o hashes para mayor seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // styleSrc: unsafe-inline necesario para Bootstrap y estilos inline de Handlebars
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      // scriptSrc: unsafe-inline necesario para scripts inline en templates
      // En producción ideal, usar nonces, pero requiere cambios en templates
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      // scriptSrcAttr: necesario para event handlers inline (onclick, etc.)
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      // upgradeInsecureRequests solo en producción
      ...(process.env.NODE_ENV === 'production' ? { upgradeInsecureRequests: [] } : {})
    },
    // Reportar violaciones de CSP (útil para debugging)
    reportOnly: process.env.NODE_ENV === 'development'
  },
  crossOriginEmbedderPolicy: false, // Permite CDN para desarrollo
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Permite recursos de CDN
  hsts: {
    maxAge: process.env.NODE_ENV === 'production' ? 31536000 : 0, // 1 año en producción, deshabilitado en desarrollo
    includeSubDomains: true,
    preload: process.env.NODE_ENV === 'production'
  },
  // Deshabilitar X-Powered-By header
  hidePoweredBy: true,
  // Protección contra clickjacking
  frameguard: { action: 'deny' },
  // Deshabilitar DNS prefetching
  dnsPrefetchControl: true,
  // Protección contra MIME type sniffing
  noSniff: true,
  // Protección XSS (aunque CSP es más efectivo)
  xssFilter: true
}));

// Compresión de respuestas (gzip) - solo en producción para mejor performance
if (process.env.NODE_ENV === 'production') {
  app.use(compression({
    level: 6, // Nivel de compresión balanceado
    filter: (req, res) => {
      // No comprimir si el cliente no lo soporta
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Usar compresión para todos los tipos de contenido
      return compression.filter(req, res);
    }
  }));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging mejorado según entorno
if (process.env.NODE_ENV === 'production') {
  // En producción, logging más estructurado (formato combined de Apache)
  app.use(morgan('combined', {
    skip: (req, res) => {
      // No loggear health checks en producción para reducir ruido
      return req.path.startsWith('/health');
    },
    stream: {
      write: (message) => {
        // Usar nuestro logger estructurado
        logger.http(message.trim());
      }
    }
  }));
} else {
  // En desarrollo, logging más detallado
  app.use(morgan('dev'));
}

// Middleware de sanitización y seguridad
app.use(sanitizeBody);
app.use(validateObjectId);
app.use(sanitizeSearch);

// Configurar seguridad
setupSecurity(app);

// Configurar Handlebars
app.engine('hbs', hbs.engine({
  extname: 'hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    formatNumber: (value) => {
      if (value === null || value === undefined) return '-';
      return Number(value).toLocaleString('es-AR');
    },
    formatCurrency: (value) => {
      if (value === null || value === undefined) return '-';
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
      }).format(value);
    },
    formatDate: (value) => {
      if (!value) return '-';
      const date = new Date(value);
      // Usar zona horaria de Argentina explícitamente
      return date.toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true // Formato 12 horas con AM/PM
      });
    },
    eq: (a, b) => a === b,
    gt: (a, b) => a > b,
    lt: (a, b) => a < b,
    lte: (a, b) => a <= b,
    gte: (a, b) => a >= b,
    or: (a, b) => a || b,
    and: (a, b) => a && b,
    year: () => new Date().getFullYear(),
    add: (a, b) => Number(a) + Number(b),
    subtract: (a, b) => Number(a) - Number(b),
    json: (context) => JSON.stringify(context),
    toString: (value) => String(value),
    objectIdEq: (a, b) => String(a) === String(b),
    buildPaginationUrl: function(currentPage, offset, baseUrl) {
      try {
        const page = Number(currentPage) + Number(offset);
        const base = baseUrl || '/inventario';
        
        if (page < 1) {
          // Si la página es menor a 1, devolver la base sin parámetro de página
          const urlParts = base.split('?');
          const basePath = urlParts[0];
          const existingParams = urlParts[1] ? new URLSearchParams(urlParts[1]) : new URLSearchParams();
          existingParams.delete('pagina'); // Eliminar parámetro de página
          const queryString = existingParams.toString();
          return queryString ? `${basePath}?${queryString}` : basePath;
        }
        
        // Parsear la baseUrl para extraer los parámetros existentes
        const urlParts = base.split('?');
        const basePath = urlParts[0];
        const existingParams = urlParts[1] ? new URLSearchParams(urlParts[1]) : new URLSearchParams();
        
        // Actualizar o agregar el parámetro de página
        existingParams.set('pagina', page.toString());
        
        const queryString = existingParams.toString();
        return queryString ? `${basePath}?${queryString}` : basePath;
      } catch (error) {
        console.error('Error en buildPaginationUrl:', error);
        return baseUrl || '/inventario';
      }
    },
    generatePaginationPages: function(currentPage, totalPages, baseUrl) {
      try {
        const current = Number(currentPage) || 1;
        const total = Number(totalPages) || 1;
        const maxPages = 5;
        
        if (total <= 1) return [];
        
        const pages = [];
        let start = Math.max(1, current - Math.floor(maxPages / 2));
        let end = Math.min(total, start + maxPages - 1);
        
        if (end - start < maxPages - 1) {
          start = Math.max(1, end - maxPages + 1);
        }
        
        // Parsear baseUrl para mantener los parámetros de query
        const base = baseUrl || '/inventario';
        const urlParts = base.split('?');
        const basePath = urlParts[0];
        const existingParams = urlParts[1] ? new URLSearchParams(urlParts[1]) : new URLSearchParams();
        
        // Crear una copia de los parámetros base para cada página
        for (let i = start; i <= end; i++) {
          const params = new URLSearchParams(existingParams);
          params.set('pagina', i.toString());
          const queryString = params.toString();
          const url = queryString ? `${basePath}?${queryString}` : basePath;
          
          pages.push({
            numero: i,
            active: i === current,
            url: url
          });
        }
        
        return pages;
      } catch (error) {
        console.error('Error en generatePaginationPages:', error);
        return [];
      }
    },
    buildPaginationPages: function(currentPage, totalPages, maxPagesToShow) {
      try {
        // Validar y convertir parámetros
        const current = Number(currentPage) || 1;
        const total = Number(totalPages) || 1;
        const maxPages = Number(maxPagesToShow) || 5;
        
        // Si no hay suficientes páginas, retornar array vacío
        if (!currentPage || !totalPages || total <= 1) {
          return [];
        }
        
        const pages = [];
        
        // Calcular el rango de páginas a mostrar
        let start = Math.max(1, current - Math.floor(maxPages / 2));
        let end = Math.min(total, start + maxPages - 1);
        
        // Ajustar el inicio si estamos cerca del final
        if (end - start < maxPages - 1) {
          start = Math.max(1, end - maxPages + 1);
        }
        
        // Generar array de objetos con número, active y url
        for (let i = start; i <= end; i++) {
          pages.push({
            numero: i,
            active: i === current,
            url: `?pagina=${i}`
          });
        }
        
        return pages;
      } catch (error) {
        console.error('Error en buildPaginationPages:', error);
        return [];
      }
    }
  }
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/auth', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/inventario', require('./routes/inventario'));
app.use('/movimientos', require('./routes/movimientos'));
app.use('/mantenimientos', require('./routes/mantenimientos'));
app.use('/maquinas', require('./routes/maquinas'));
app.use('/perfiles', require('./routes/perfiles'));
app.use('/auditoria', require('./routes/auditoria'));
app.use('/historial', require('./routes/historial'));
app.use('/estadisticas', require('./routes/estadisticasViews'));
app.use('/api', require('./routes/api'));
app.use('/api/estadisticas', require('./routes/estadisticas'));
app.use('/api/notificaciones', require('./routes/notificaciones'));
app.use('/reportes', require('./routes/reportes'));

// Health check endpoints (sin autenticación, para monitoreo)
app.use('/health', require('./routes/health'));

// Ruta principal
app.get('/', (req, res) => {
  if (req.cookies.token) {
    return res.redirect('/dashboard');
  }
  res.redirect('/auth/login');
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Iniciar tareas programadas (Cron)
iniciarTareasProgramadas();

// Manejar errores no capturados - CRÍTICO: debe cerrar el proceso
process.on('uncaughtException', (error) => {
  logger.error('Error no capturado (uncaughtException)', error, {
    type: 'uncaughtException'
  });
  
  // En producción, cerrar el proceso de forma controlada
  if (process.env.NODE_ENV === 'production') {
    logger.warn('Cerrando servidor de forma controlada...');
    // Dar tiempo para que los logs se escriban
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  } else {
    // En desarrollo, solo loggear
    logger.warn('En desarrollo, el servidor continuará ejecutándose');
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesa rechazada no manejada', reason, {
    type: 'unhandledRejection',
    promise: promise.toString()
  });
  
  // En producción, considerar cerrar el proceso si es crítico
  // Por ahora solo loggear, ya que algunas promesas rechazadas pueden no ser críticas
  if (process.env.NODE_ENV === 'production') {
    // Si es un error crítico de base de datos, cerrar
    if (reason && (reason.message && reason.message.includes('Mongo') || 
                   reason.name === 'MongoError' || 
                   reason.name === 'MongooseError')) {
      logger.error('Error crítico de base de datos, cerrando servidor...', reason);
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    }
  }
});

// Exportar app para tests (SIEMPRE, antes de iniciar servidor)
module.exports = app;

// Iniciar servidor solo si NO estamos en modo test
if (process.env.NODE_ENV !== 'test') {
  // Render asigna PORT automáticamente, usar 10000 como fallback
  const PORT = process.env.PORT || 10000;
  const server = app.listen(PORT, () => {
    logger.info('Servidor iniciado', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      healthCheck: `http://localhost:${PORT}/health`
    });
  });

  // Graceful shutdown - cerrar servidor de forma controlada
  const gracefulShutdown = (signal) => {
    logger.warn(`Señal ${signal} recibida. Cerrando servidor de forma controlada...`);
    
    server.close((err) => {
      if (err) {
        logger.error('Error cerrando servidor', err);
        process.exit(1);
      }
      
      logger.info('Servidor HTTP cerrado');
      
      // Cerrar conexión a MongoDB
      mongoose.connection.close(false, () => {
        logger.info('Conexión a MongoDB cerrada');
        logger.info('Servidor cerrado correctamente');
        process.exit(0);
      });
    });
    
    // Forzar cierre después de 10 segundos si no se cierra limpiamente
    setTimeout(() => {
      logger.error('Forzando cierre del servidor después de timeout');
      process.exit(1);
    }, 10000);
  };

  // Escuchar señales de terminación
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Manejar errores del servidor
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Puerto ${PORT} ya está en uso`, error);
      process.exit(1);
    } else {
      logger.error('Error del servidor', error);
    }
  });
}
