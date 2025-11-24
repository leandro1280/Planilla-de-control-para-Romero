const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  generarPDFInventario,
  generarPDFMovimientos,
  generarPDFMantenimientos,
  generarPDFAuditoria
} = require('../controllers/reportesController');

// Todas las rutas requieren autenticación
router.use(protect);

// Reportes accesibles para todos los usuarios autenticados
router.get('/inventario', generarPDFInventario);
router.get('/movimientos', generarPDFMovimientos);
router.get('/mantenimientos', generarPDFMantenimientos);

// Auditoría solo para administradores
router.get('/auditoria', authorize('administrador'), generarPDFAuditoria);

module.exports = router;

