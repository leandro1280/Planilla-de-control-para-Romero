/**
 * Error Handler mejorado con logging estructurado y mejor manejo de errores
 */
exports.errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Logging estructurado de errores
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode: error.statusCode,
    message: error.message,
    errorName: err.name,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    user: req.user ? req.user._id : 'anonymous',
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  };

  // Log según el entorno
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error Handler:', errorLog);
    console.error('Stack:', err.stack);
  } else {
    // En producción, log estructurado sin stack completo
    console.error(JSON.stringify({
      level: 'error',
      ...errorLog,
      stack: err.stack ? err.stack.split('\n').slice(0, 5).join('\n') : undefined
    }));
  }

  // Error de Handlebars (Missing helper, etc.)
  if (err.message && err.message.includes('Missing helper')) {
    console.error('❌ Error de Handlebars:', err.message);
    // Si es una request de API, devolver JSON
    if (req.path && req.path.startsWith('/api')) {
      return res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
          ? 'Error en la plantilla' 
          : 'Error en la plantilla: ' + err.message
      });
    }
    // Si es una vista, renderizar página de error
    if (!res.headersSent) {
      return res.status(500).render('error', {
        title: 'Error',
        message: 'Error al renderizar la página. Por favor contacta al administrador.',
        layout: 'main'
      });
    }
    return;
  }

  // Error de Mongoose - Bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Recurso no encontrado';
    error = { message, statusCode: 404 };
  }

  // Error de Mongoose - Duplicate Key
  if (err.code === 11000) {
    const message = 'Recurso duplicado';
    error = { message, statusCode: 400 };
  }

  // Error de Mongoose - Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    error = { message: 'Token inválido', statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    error = { message: 'Token expirado', statusCode: 401 };
  }

  // Si ya se envió respuesta, no hacer nada
  if (res.headersSent) {
    return next(err);
  }

  // Si es una request de API, devolver JSON
  if (req.path && req.path.startsWith('/api')) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' && error.statusCode === 500
        ? 'Error del servidor'
        : error.message || 'Error del servidor'
    });
  }

  // Si es una vista, renderizar página de error
  res.status(error.statusCode || 500).render('error', {
    title: 'Error',
    message: process.env.NODE_ENV === 'production' && error.statusCode === 500
      ? 'Error del servidor. Por favor contacta al administrador.'
      : error.message || 'Error del servidor',
    layout: 'main'
  });
};

