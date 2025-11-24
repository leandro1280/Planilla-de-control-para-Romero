const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: 'Demasiadas solicitudes desde esta IP, intenta nuevamente más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting más estricto para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login por IP
  message: 'Demasiados intentos de login, intenta nuevamente en 15 minutos.',
  skipSuccessfulRequests: true,
});

// Rate limiting para operaciones de escritura
const writeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 20, // máximo 20 operaciones de escritura por minuto
  message: 'Demasiadas operaciones de escritura, espera un momento.',
});

const setupSecurity = (app) => {
  // Sanitizar datos MongoDB (previene NoSQL injection)
  app.use(mongoSanitize({
    replaceWith: '_', // Reemplazar caracteres peligrosos
    onSanitize: ({ req, key }) => {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`⚠️ Intento de inyección NoSQL detectado en ${key}`);
      }
    }
  }));
  
  // Prevenir HTTP Parameter Pollution
  app.use(hpp({
    whitelist: ['busqueda', 'tipo', 'stock', 'pagina', 'porPagina'] // Permitir múltiples valores en estos campos
  }));
  
  // Solo aplicar rate limiting si NO estamos en modo test
  if (process.env.NODE_ENV !== 'test') {
    // Rate limiting general para API
    app.use('/api/', limiter);
    
    // Rate limiting específico para autenticación (protección contra fuerza bruta)
    app.use('/auth/login', authLimiter);
    app.use('/auth/register', authLimiter);
    
    // Rate limiting para operaciones de escritura (previene spam/abuso)
    app.use('/inventario/productos', writeLimiter);
    app.use('/inventario/movimientos', writeLimiter);
    app.use('/mantenimientos', writeLimiter);
    
    // Rate limiting para importaciones (operación pesada)
    const importLimiter = rateLimit({
      windowMs: 5 * 60 * 1000, // 5 minutos
      max: 3, // máximo 3 importaciones cada 5 minutos
      message: 'Demasiadas importaciones, espera 5 minutos antes de intentar nuevamente.',
    });
    app.use('/inventario/importar', importLimiter);
  }
};

module.exports = { setupSecurity, limiter, authLimiter, writeLimiter };

