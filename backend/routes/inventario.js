const express = require('express');
const { protect, canCreate, canDelete } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validateProduct, validateMovement } = require('../utils/validators');
const {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    createMovement,
    exportToExcel,
    importFromExcel
} = require('../controllers/inventarioController');

const router = express.Router();

router.use(protect);

router.get('/', getProducts);
router.get('/exportar', exportToExcel);
router.post('/importar', upload.single('archivo'), importFromExcel);
router.post('/productos', canCreate, validateProduct, createProduct);
router.put('/productos/:id', canCreate, validateProduct, updateProduct);
router.delete('/productos/:id', canDelete, deleteProduct);
router.post('/movimientos', canCreate, validateMovement, createMovement);

module.exports = router;
