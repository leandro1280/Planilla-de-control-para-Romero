const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const auditoriaController = require('../controllers/auditoriaController');

// Todas las rutas requieren autenticación y rol de administrador
router.use(protect);
router.use(authorize('administrador'));

// @route   GET /auditoria
// @desc    Ver registros de auditoría
// @access  Private (solo administrador)
router.get('/', auditoriaController.getAuditoriaLogs);

module.exports = router;
