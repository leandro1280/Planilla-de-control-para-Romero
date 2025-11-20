const express = require('express');
const router = express.Router();
const { protect, canCreate, canDelete } = require('../middleware/auth');
const { validateProduct, validateMovement, handleValidationErrors } = require('../utils/validators');
const inventarioController = require('../controllers/inventarioController');

// Todas las rutas requieren autenticación
router.use(protect);

// Vista principal del inventario
router.get('/', inventarioController.getProducts);

// Exportar a Excel
router.get('/exportar', inventarioController.exportToExcel);

// CRUD de productos
router.post('/productos', canCreate, validateProduct, handleValidationErrors, inventarioController.createProduct);
router.put('/productos/:id', canCreate, validateProduct, handleValidationErrors, inventarioController.updateProduct);
router.delete('/productos/:id', canDelete, inventarioController.deleteProduct);

// Crear movimiento
router.post('/movimientos', canCreate, validateMovement, handleValidationErrors, inventarioController.createMovement);

module.exports = router;

