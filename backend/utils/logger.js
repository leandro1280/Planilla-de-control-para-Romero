/**
 * Logger estructurado para producción
 * Proporciona logging consistente y parseable
 */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Formatear log como JSON estructurado
 */
function formatLog(level, message, meta = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    environment: process.env.NODE_ENV || 'development',
    ...meta
  };

  return JSON.stringify(logEntry);
}

/**
 * Logger simple que puede ser reemplazado por Winston u otro en el futuro
 */
const logger = {
  /**
   * Log de información
   */
  info: (message, meta = {}) => {
    if (isProduction) {
      console.log(formatLog('info', message, meta));
    } else {
      console.log(`ℹ️  [INFO] ${message}`, meta);
    }
  },

  /**
   * Log de advertencia
   */
  warn: (message, meta = {}) => {
    if (isProduction) {
      console.warn(formatLog('warn', message, meta));
    } else {
      console.warn(`⚠️  [WARN] ${message}`, meta);
    }
  },

  /**
   * Log de error
   */
  error: (message, error = null, meta = {}) => {
    const errorMeta = {
      ...meta,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: isProduction ? undefined : error.stack
        }
      })
    };

    if (isProduction) {
      console.error(formatLog('error', message, errorMeta));
    } else {
      console.error(`❌ [ERROR] ${message}`, errorMeta);
      if (error && error.stack) {
        console.error('Stack:', error.stack);
      }
    }
  },

  /**
   * Log de debug (solo en desarrollo)
   */
  debug: (message, meta = {}) => {
    if (!isProduction) {
      console.debug(`🔍 [DEBUG] ${message}`, meta);
    }
  },

  /**
   * Log de acceso HTTP (para usar con Morgan)
   */
  http: (message) => {
    if (isProduction) {
      console.log(formatLog('http', message));
    } else {
      console.log(`🌐 [HTTP] ${message}`);
    }
  }
};

module.exports = logger;

