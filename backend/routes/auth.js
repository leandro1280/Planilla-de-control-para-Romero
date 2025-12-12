const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validateRegister, validateLogin, handleValidationErrors } = require('../utils/validators');
const authController = require('../controllers/authController');

// Rutas públicas
router.get('/login', authController.renderLogin);
router.post('/login', validateLogin, handleValidationErrors, authController.login);

// Rutas de registro (solo administradores pueden crear usuarios)
router.get('/register', protect, authorize('administrador'), authController.renderRegister);
router.post('/register', protect, authorize('administrador'), validateRegister, handleValidationErrors, authController.register);

// Rutas protegidas
router.post('/logout', protect, authController.logout);
router.get('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);

// Ruta para cambiar contraseña
router.get('/cambiar-password', protect, authController.renderCambiarPassword);
router.put('/cambiar-password', protect, require('../utils/validators').validateCambiarPassword, require('../utils/validators').handleValidationErrors, authController.cambiarPassword);

// Rutas de gestión de usuarios (solo administradores)
const usuariosController = require('../controllers/usuariosController');
router.get('/usuarios', protect, authorize('administrador'), usuariosController.getUsuarios);
router.put('/usuarios/:id', protect, authorize('administrador'), usuariosController.updateUsuario);
router.post('/usuarios/:id/reset-password', protect, authorize('administrador'), usuariosController.resetPassword);
router.delete('/usuarios/:id', protect, authorize('administrador'), usuariosController.deleteUsuario);

module.exports = router;

