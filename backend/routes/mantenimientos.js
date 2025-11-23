const express = require('express');
const { protect, canCreate, canDelete } = require('../middleware/auth');
const {
  getMaintenances,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  getProductsForMaintenance
} = require('../controllers/maintenanceController');

const router = express.Router();

router.use(protect);

router.get('/', getMaintenances);
router.get('/productos', getProductsForMaintenance);
router.post('/', canCreate, createMaintenance);
router.put('/:id', canCreate, updateMaintenance);
router.delete('/:id', canDelete, deleteMaintenance);

module.exports = router;

