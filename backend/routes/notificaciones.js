const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// Todas las rutas requieren autenticación y ser administrador
router.use(protect);
router.use(authorize('administrador'));

// Obtener notificaciones
router.get('/', notificationController.getNotifications);

// Marcar notificación como leída
router.put('/:id/leer', notificationController.markAsRead);

// Marcar todas como leídas
router.put('/leer-todas', notificationController.markAllAsRead);

module.exports = router;

