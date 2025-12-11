const express = require('express');
const { protect, canCreate, canDelete, authorize, blockOperarios } = require('../middleware/auth');
const {
  getMaintenances,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  getProductsForMaintenance
} = require('../controllers/maintenanceController');

const router = express.Router();

router.use(protect);
router.use(blockOperarios); // Bloquear acceso de operarios a mantenimientos

router.get('/', getMaintenances);
router.get('/productos', getProductsForMaintenance);
router.post('/', canCreate, createMaintenance);
router.put('/:id', authorize('administrador'), updateMaintenance);
router.delete('/:id', canDelete, deleteMaintenance);

module.exports = router;

