const express = require('express');
const router = express.Router();
const { protect, blockOperarios } = require('../middleware/auth');

router.use(protect);
router.use(blockOperarios); // Bloquear acceso de operarios a estadísticas

// Vista de estadísticas avanzadas
router.get('/', (req, res) => {
  res.render('estadisticas/index', {
    title: 'Estadísticas Avanzadas - Romero Panificados',
    currentPage: 'estadisticas',
    usuario: {
      nombre: req.user.nombre,
      email: req.user.email,
      rol: req.user.rol
    }
  });
});

module.exports = router;

