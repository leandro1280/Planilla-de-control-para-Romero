const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verificar token JWT
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Verificar token en cookies o headers
    if (req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      // Si es una petición API, retornar JSON
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado'
        });
      }
      return res.redirect('/auth/login');
    }

    try {
      // Verificar token
      const secret = process.env.JWT_SECRET || 'romero_panificados_secret_key_default_cambiar_en_produccion_2024';
      const decoded = jwt.verify(token, secret);
      
      // Obtener usuario
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user || !req.user.activo) {
        // Si es una petición API, retornar JSON
        if (req.path.startsWith('/api/')) {
          return res.status(401).json({
            success: false,
            message: 'Usuario no autorizado'
          });
        }
        return res.redirect('/auth/login');
      }

      next();
    } catch (error) {
      res.clearCookie('token');
      // Si es una petición API, retornar JSON
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido'
        });
      }
      return res.redirect('/auth/login');
    }
  } catch (error) {
    // Si es una petición API, retornar JSON
    if (req.path.startsWith('/api/')) {
      return res.status(500).json({
        success: false,
        message: 'Error de autenticación'
      });
    }
    return res.redirect('/auth/login');
  }
};

// Verificar roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado para acceder a esta ruta'
      });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: `Usuario con rol ${req.user.rol} no tiene acceso a esta ruta`
      });
    }

    next();
  };
};

// Verificar permisos específicos
exports.canCreate = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'No autorizado' });
  }

  if (['administrador', 'visor'].includes(req.user.rol)) {
    return next();
  }

  return res.status(403).json({ success: false, message: 'No tiene permisos para crear' });
};

exports.canDelete = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'No autorizado' });
  }

  if (req.user.rol === 'administrador') {
    return next();
  }

  return res.status(403).json({ success: false, message: 'Solo administradores pueden eliminar' });
};

exports.canViewMovements = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'No autorizado' });
  }

  // Todos los usuarios autenticados pueden ver movimientos
  return next();
};

