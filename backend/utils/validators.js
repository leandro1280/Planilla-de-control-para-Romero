const { body, validationResult } = require('express-validator');

// Validar errores de express-validator
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Errores de validación:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: errors.array()
    });
  }
  next();
};

// Validaciones para registro de usuario
exports.validateRegister = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  
  body('rol')
    .optional()
    .isIn(['administrador', 'visor', 'usuario_comun']).withMessage('Rol inválido'),
];

// Validaciones para login
exports.validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Email inválido')
    .toLowerCase(),
    // NO usar normalizeEmail porque puede cambiar el formato del email (ej: admin@romerito.com -> admin+@romerito.com)
  
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria'),
];

// Validaciones para productos
exports.validateProduct = [
  body('referencia')
    .trim()
    .notEmpty().withMessage('La referencia es obligatoria')
    .isLength({ max: 100 }).withMessage('La referencia no puede exceder 100 caracteres')
    .matches(/^[A-Z0-9\-_]+$/).withMessage('La referencia solo puede contener letras mayúsculas, números, guiones y guiones bajos'),
  
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 200 }).withMessage('El nombre no puede exceder 200 caracteres'),
  
  body('equipo')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('El equipo no puede exceder 200 caracteres'),
  
  body('existencia')
    .notEmpty().withMessage('La existencia es obligatoria')
    .isInt({ min: 0 }).withMessage('La existencia debe ser un número entero mayor o igual a 0'),
  
  body('detalle')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('El detalle no puede exceder 500 caracteres'),
  
  body('tipo')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('El tipo no puede exceder 50 caracteres'),
  
  body('costoUnitario')
    .optional()
    .isFloat({ min: 0 }).withMessage('El costo unitario debe ser un número mayor o igual a 0'),
];

// Validaciones para movimientos
exports.validateMovement = [
  body('referencia')
    .trim()
    .notEmpty().withMessage('La referencia es obligatoria'),
  
  body('tipo')
    .notEmpty().withMessage('El tipo es obligatorio')
    .isIn(['ingreso', 'egreso']).withMessage('El tipo debe ser ingreso o egreso'),
  
  body('cantidad')
    .notEmpty().withMessage('La cantidad es obligatoria')
    .isInt({ min: 1 }).withMessage('La cantidad debe ser un número entero mayor a 0'),
  
  body('costoUnitario')
    .optional()
    .isFloat({ min: 0 }).withMessage('El costo unitario debe ser un número mayor o igual a 0'),
  
  body('nota')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La nota no puede exceder 500 caracteres'),
];

