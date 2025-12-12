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
// Los operarios pueden ver mantenimientos, pero no crearlos
// Solo administradores pueden crear mantenimientos
router.get('/', getMaintenances);
router.get('/productos', getProductsForMaintenance);
router.post('/', authorize('administrador'), createMaintenance);
router.put('/:id', authorize('administrador'), updateMaintenance);
router.delete('/:id', canDelete, deleteMaintenance);

module.exports = router;

