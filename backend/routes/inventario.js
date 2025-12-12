const express = require('express');
const { protect, canCreate, canDelete, canManageInventory, canCreateEgress } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validateProduct, validateUpdateProduct, validateMovement, handleValidationErrors } = require('../utils/validators');
const { validateExcelFile } = require('../middleware/validateExcel');
const {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    createMovement,
    exportToExcel,
    importFromExcel,
    buscarProductoPorCodigo,
    downloadProduct
} = require('../controllers/inventarioController');

const router = express.Router();

router.use(protect);

router.get('/', getProducts);
router.get('/exportar', exportToExcel);
router.get('/productos/buscar', buscarProductoPorCodigo);
router.get('/productos/:id/descargar', downloadProduct);
router.post('/importar', upload.single('archivo'), validateExcelFile, importFromExcel);
// Crear/modificar productos solo para administradores y supervisores
router.post('/productos', canManageInventory, validateProduct, handleValidationErrors, createProduct);
router.put('/productos/:id', canManageInventory, validateUpdateProduct, handleValidationErrors, updateProduct);
router.delete('/productos/:id', canDelete, deleteProduct);
// Movimientos: todos pueden hacer egresos, solo admin/supervisor pueden hacer ingresos
router.post('/movimientos', canCreateEgress, validateMovement, handleValidationErrors, createMovement);

module.exports = router;
