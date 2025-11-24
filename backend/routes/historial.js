const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getHistorialProducto,
  getHistorialProductoAPI
} = require('../controllers/historialController');

router.use(protect);

router.get('/productos/:id', getHistorialProducto);
router.get('/api/productos/:id', getHistorialProductoAPI);

module.exports = router;

