const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

// Rate limiting general - más estricto en producción
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 200, // Más permisivo en desarrollo
  message: {
    success: false,
    error: 'Demasiadas solicitudes desde esta IP. Por favor intenta nuevamente más tarde.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true, // Retorna rate limit info en headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita `X-RateLimit-*` headers
  // Handler personalizado para mejor respuesta JSON
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Demasiadas solicitudes desde esta IP. Por favor intenta nuevamente más tarde.',
      retryAfter: '15 minutos'
    });
  }
});

// Rate limiting más estricto para autenticación (protección contra fuerza bruta)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login por IP
  message: {
    success: false,
    error: 'Demasiados intentos de login. Por favor intenta nuevamente en 15 minutos.',
    retryAfter: '15 minutos'
  },
  skipSuccessfulRequests: true, // No contar requests exitosos
  skipFailedRequests: false, // Contar solo los fallidos
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Demasiados intentos de login. Por favor intenta nuevamente en 15 minutos.',
      retryAfter: '15 minutos'
    });
  }
});

// Rate limiting para operaciones de escritura (previene spam/abuso)
const writeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: process.env.NODE_ENV === 'production' ? 20 : 50, // Más permisivo en desarrollo
  message: {
    success: false,
    error: 'Demasiadas operaciones de escritura. Por favor espera un momento antes de intentar nuevamente.',
    retryAfter: '1 minuto'
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Demasiadas operaciones de escritura. Por favor espera un momento antes de intentar nuevamente.',
      retryAfter: '1 minuto'
    });
  }
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
      message: {
        success: false,
        error: 'Demasiadas importaciones. Por favor espera 5 minutos antes de intentar nuevamente.',
        retryAfter: '5 minutos'
      },
      handler: (req, res) => {
        res.status(429).json({
          success: false,
          error: 'Demasiadas importaciones. Por favor espera 5 minutos antes de intentar nuevamente.',
          retryAfter: '5 minutos'
        });
      }
    });
    app.use('/inventario/importar', importLimiter);
  }
};

module.exports = { setupSecurity, limiter, authLimiter, writeLimiter };

