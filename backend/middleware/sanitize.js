/**
 * Middleware para sanitizar y validar inputs adicionales
 * Protección contra XSS, inyección de código, etc.
 */

// Función para sanitizar strings (remover caracteres peligrosos)
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
   
  // Remover scripts y etiquetas HTML peligrosas
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '') // Remover event handlers (onclick, onerror, etc.)
    .trim();
};

// Middleware para sanitizar el body de la request
exports.sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      } else if (Array.isArray(req.body[key])) {
        req.body[key] = req.body[key].map(item => 
          typeof item === 'string' ? sanitizeString(item) : item
        );
      }
    });
  }
  
  // Sanitizar query parameters
  if (req.query && typeof req.query === 'object') {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    });
  }
  
  next();
};

// Validar que IDs de MongoDB sean válidos
exports.validateObjectId = (req, res, next) => {
  const mongoose = require('mongoose');
  
  // Validar parámetros de ruta que deberían ser ObjectIds
  const idParams = ['id', 'productoId', 'usuarioId', 'mantenimientoId'];
  
  idParams.forEach(param => {
    if (req.params[param] && !mongoose.Types.ObjectId.isValid(req.params[param])) {
      return res.status(400).json({
        success: false,
        message: `ID inválido: ${param}`
      });
    }
  });
  
  next();
};

// Protección contra inyección en búsquedas
exports.sanitizeSearch = (req, res, next) => {
  if (req.query.busqueda) {
    // Limitar longitud de búsqueda
    if (req.query.busqueda.length > 200) {
      req.query.busqueda = req.query.busqueda.substring(0, 200);
    }
    
    // Remover caracteres peligrosos pero mantener funcionalidad de búsqueda
    req.query.busqueda = req.query.busqueda
      .replace(/[<>{}[\]]/g, '') // Remover caracteres que pueden romper regex
      .replace(/[$^*()+?.\\]/g, '\\$&'); // Escapar caracteres especiales de regex
  }
  
  next();
};

