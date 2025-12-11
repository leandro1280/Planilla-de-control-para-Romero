const express = require('express');
const router = express.Router();
const { protect, blockOperarios } = require('../middleware/auth');
const {
  getEstadisticasAvanzadas,
  getPrediccionStock
} = require('../controllers/estadisticasController');

router.use(protect);
router.use(blockOperarios); // Bloquear acceso de operarios a estadísticas

router.get('/avanzadas', getEstadisticasAvanzadas);
router.get('/prediccion-stock', getPrediccionStock);

module.exports = router;

