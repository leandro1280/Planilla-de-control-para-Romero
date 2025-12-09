const express = require('express');
const { protect, canCreate, canDelete } = require('../middleware/auth');
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
    buscarProductoPorCodigo
} = require('../controllers/inventarioController');

const router = express.Router();

router.use(protect);

router.get('/', getProducts);
router.get('/exportar', exportToExcel);
router.get('/productos/buscar', buscarProductoPorCodigo);
router.post('/importar', upload.single('archivo'), validateExcelFile, importFromExcel);
router.post('/productos', canCreate, validateProduct, handleValidationErrors, createProduct);
router.put('/productos/:id', canCreate, validateUpdateProduct, handleValidationErrors, updateProduct);
router.delete('/productos/:id', canDelete, deleteProduct);
router.post('/movimientos', canCreate, validateMovement, handleValidationErrors, createMovement);

module.exports = router;
