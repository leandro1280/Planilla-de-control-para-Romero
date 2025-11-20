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
  app.use(mongoSanitize());
  
  // Prevenir HTTP Parameter Pollution
  app.use(hpp());
  
  // Rate limiting general
  // app.use('/api/', limiter);
  
  // Rate limiting específico para auth
  // app.use('/auth/login', authLimiter);
  // app.use('/auth/register', authLimiter);
  
  // Rate limiting para escrituras
  // app.use('/inventario', writeLimiter);
  // app.use('/movimientos', writeLimiter);
};

module.exports = { setupSecurity, limiter, authLimiter, writeLimiter };

