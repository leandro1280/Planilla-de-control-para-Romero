const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getEstadisticasAvanzadas,
  getPrediccionStock
} = require('../controllers/estadisticasController');

router.use(protect);

router.get('/avanzadas', getEstadisticasAvanzadas);
router.get('/prediccion-stock', getPrediccionStock);

module.exports = router;

