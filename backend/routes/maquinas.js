const express = require('express');
const router = express.Router();
const { protect, authorize, canCreate, canCreateMachine } = require('../middleware/auth');
const machineController = require('../controllers/machineController');

// Rutas públicas (requieren autenticación - todos los usuarios pueden ver)
router.get('/', protect, machineController.getMachines);
// Ruta QR accesible para todos los usuarios autenticados (operarios, supervisores, administradores)
router.get('/qr/:codigo', protect, machineController.getMachineByCode);
// Crear/editar máquinas solo para administradores
router.get('/nueva', protect, canCreateMachine, machineController.renderNewMachine);
router.get('/editar/:id', protect, canCreateMachine, machineController.renderEditMachine);

// API routes (estas rutas se montan en /maquinas, así que la ruta completa será /maquinas/api/...)
router.get('/api/qr/:codigo', protect, machineController.getMachineByCodeAPI);
router.get('/api/productos', protect, machineController.getProductsForRepuestos);

// Rutas de creación/edición (solo administradores)
router.post('/', protect, canCreateMachine, machineController.createMachine);
router.put('/:id', protect, canCreateMachine, machineController.updateMachine);
router.delete('/:id', protect, canCreateMachine, machineController.deleteMachine);

module.exports = router;

