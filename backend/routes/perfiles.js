const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getPerfiles } = require('../controllers/perfilesController');

// Todas las rutas requieren autenticación
router.use(protect);

router.get('/', getPerfiles);

module.exports = router;

