const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

// Todas las rutas del dashboard requieren autenticación
router.get('/', protect, dashboardController.renderDashboard);

module.exports = router;

