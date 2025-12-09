const express = require('express');
const router = express.Router();
const { protect, authorize, canCreate } = require('../middleware/auth');
const machineController = require('../controllers/machineController');

// Rutas públicas (requieren autenticación)
router.get('/', protect, machineController.getMachines);
router.get('/qr/:codigo', protect, machineController.getMachineByCode);
router.get('/nueva', protect, canCreate, machineController.renderNewMachine);
router.get('/editar/:id', protect, canCreate, machineController.renderEditMachine);

// API routes (estas rutas se montan en /maquinas, así que la ruta completa será /maquinas/api/...)
router.get('/api/qr/:codigo', protect, machineController.getMachineByCodeAPI);
router.get('/api/productos', protect, machineController.getProductsForRepuestos);

// Rutas de creación/edición (solo supervisor y admin)
router.post('/', protect, canCreate, machineController.createMachine);
router.put('/:id', protect, canCreate, machineController.updateMachine);
router.delete('/:id', protect, authorize('administrador'), machineController.deleteMachine);

module.exports = router;

