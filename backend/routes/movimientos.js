const express = require('express');
const router = express.Router();
const { protect, canViewMovements } = require('../middleware/auth');
const movimientosController = require('../controllers/movimientosController');

// Todas las rutas requieren autenticación y bloquean operarios
router.use(protect);
router.use(canViewMovements);

// Vista principal de movimientos
router.get('/', movimientosController.getMovements);

// Descargar planilla
router.get('/descargar', movimientosController.downloadMovements);

module.exports = router;

