require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const hbs = require('express-handlebars');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/database');
const { setupSecurity } = require('./middleware/security');
const { errorHandler } = require('./middleware/errorHandler');
const { iniciarTareasProgramadas } = require('./services/servicioCron');

const app = express();

// Conectar a MongoDB (no bloquea el servidor si falla)
connectDB().catch(err => {
  console.error(`⚠️  Error en conexión inicial a MongoDB: ${err.message}`);
  console.warn(`⚠️  El servidor continuará ejecutándose`);
});

// Iniciar tareas programadas (Notificaciones)
iniciarTareasProgramadas();

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
const { sanitizeBody, validateObjectId, sanitizeSearch } = require('./middleware/sanitize');
app.use(sanitizeBody);
app.use(validateObjectId);
app.use(sanitizeSearch);

// Configurar Handlebars
app.engine('hbs', hbs.engine({
  extname: 'hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    formatNumber: (num) => {
      if (!num && num !== 0) return '-';
      return Number(num).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    },
    formatCurrency: (num) => {
      if (num === null || num === undefined) return '-';
      if (!num && num !== 0) return '-';
      const numValue = Number(num);
      if (isNaN(numValue)) return '-';
      return numValue.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    formatDate: (date) => {
      if (!date) return '-';
      try {
        const fecha = new Date(date);
        return fecha.toLocaleString('es-AR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        return '-';
      }
    },
    eq: (a, b) => a === b,
    toString: (val) => val ? val.toString() : '',
    gt: (a, b) => a > b,
    lt: (a, b) => a < b,
    lte: (a, b) => a <= b,
    or: (a, b) => a || b,
    year: () => new Date().getFullYear(),
    and: (a, b) => a && b,
    gte: (a, b) => a >= b,
    add: (a, b) => (parseInt(a) || 0) + (parseInt(b) || 0),
    subtract: (a, b) => (parseInt(a) || 0) - (parseInt(b) || 0),
    // Helper para construir URL de paginación preservando filtros
    buildPaginationUrl: (paginaActual, cambio, baseUrl) => {
      if (typeof paginaActual !== 'number') paginaActual = parseInt(paginaActual) || 1;
      if (typeof cambio !== 'number') cambio = parseInt(cambio) || 0;

      const nuevaPagina = paginaActual + cambio;
      if (nuevaPagina < 1) return '#';

      const params = new URLSearchParams(baseUrl || '');
      params.set('pagina', nuevaPagina.toString());
      const urlParams = params.toString();
      return urlParams ? '?' + urlParams : '?pagina=' + nuevaPagina;
    },
    // Helper para generar números de página a mostrar
    generatePaginationPages: (paginaActual, totalPaginas, baseUrl) => {
      if (typeof paginaActual !== 'number') paginaActual = parseInt(paginaActual) || 1;
      if (typeof totalPaginas !== 'number') totalPaginas = parseInt(totalPaginas) || 1;

      const paginas = [];
      const maxPaginas = 7; // Máximo de números de página a mostrar

      if (totalPaginas <= 1) {
        return paginas; // No mostrar paginación si hay 1 o menos páginas
      }

      let inicio = Math.max(1, paginaActual - Math.floor(maxPaginas / 2));
      let fin = Math.min(totalPaginas, inicio + maxPaginas - 1);

      // Ajustar inicio si nos acercamos al final
      if (fin - inicio < maxPaginas - 1) {
        inicio = Math.max(1, fin - maxPaginas + 1);
      }

      for (let i = inicio; i <= fin; i++) {
        const params = new URLSearchParams(baseUrl || '');
        params.set('pagina', i.toString());
        const urlParams = params.toString();
        paginas.push({
          numero: i,
          active: i === paginaActual,
          disabled: false,
          url: urlParams ? '?' + urlParams : '?pagina=' + i
        });
      }

      return paginas;
    },
    json: (context) => JSON.stringify(context)
  }
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de seguridad
setupSecurity(app);

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

const PORT = process.env.PORT || 3000;

// Solo iniciar servidor si no estamos en modo test
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Manejar errores no capturados para que el servidor no se caiga
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  console.warn('⚠️  El servidor continuará ejecutándose');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  console.warn('⚠️  El servidor continuará ejecutándose');
});

// Iniciar servidor solo si no estamos en modo test
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Manejar errores del servidor
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Puerto ${PORT} ya está en uso`);
    process.exit(1);
  } else {
    console.error(`❌ Error del servidor: ${error.message}`);
  }
});

// Force restart

