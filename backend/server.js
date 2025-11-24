require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const hbs = require('express-handlebars');
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const connectDB = require('./config/database');
const { setupSecurity } = require('./middleware/security');
const { sanitizeBody, validateObjectId, sanitizeSearch } = require('./middleware/sanitize');
const errorHandler = require('./middleware/errorHandler').errorHandler;
const { iniciarTareasProgramadas } = require('./services/servicioCron');

// Conectar a MongoDB
connectDB().catch(err => {
  console.error('❌ Error conectando a MongoDB:', err.message);
});

// Crear app Express
const app = express();

// Middleware básico - Seguridad mejorada
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false, // Permite CDN para desarrollo
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true
  }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

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
      return date.toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
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
    buildPaginationUrl: (baseUrl, query) => {
      const params = new URLSearchParams(query);
      return `${baseUrl}?${params.toString()}`;
    },
    generatePaginationPages: (currentPage, totalPages) => {
      const pages = [];
      const maxPages = 5;
      let start = Math.max(1, currentPage - Math.floor(maxPages / 2));
      let end = Math.min(totalPages, start + maxPages - 1);
      
      if (end - start < maxPages - 1) {
        start = Math.max(1, end - maxPages + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      return pages;
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
app.use('/perfiles', require('./routes/perfiles'));
app.use('/auditoria', require('./routes/auditoria'));
app.use('/historial', require('./routes/historial'));
app.use('/estadisticas', require('./routes/estadisticasViews'));
app.use('/api', require('./routes/api'));
app.use('/api/estadisticas', require('./routes/estadisticas'));
app.use('/api/notificaciones', require('./routes/notificaciones'));
app.use('/reportes', require('./routes/reportes'));

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

// Manejar errores no capturados para que el servidor no se caiga
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  console.warn('⚠️  El servidor continuará ejecutándose');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  console.warn('⚠️  El servidor continuará ejecutándose');
});

// Exportar app para tests (SIEMPRE, antes de iniciar servidor)
module.exports = app;

// Iniciar servidor solo si NO estamos en modo test
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });

  // Manejar errores del servidor
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Puerto ${PORT} ya está en uso`);
      process.exit(1);
    } else {
      console.error('❌ Error del servidor:', error);
    }
  });
}
