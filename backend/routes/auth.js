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

module.exports = router;

