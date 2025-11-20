const Notification = require('../models/Notification');
const User = require('../models/User');

// Función auxiliar para crear notificación para administradores
exports.createNotificationForAdmins = async (tipo, mensaje, datos = {}, referencia = null) => {
  try {
    // Buscar todos los administradores activos
    const administradores = await User.find({ rol: 'administrador', activo: true });
    
    if (administradores.length === 0) {
      return;
    }
    
    // Crear notificación para cada administrador
    const notificaciones = administradores.map(admin => ({
      tipo,
      mensaje,
      usuario: admin._id,
      referencia,
      datos,
      leido: false
    }));
    
    await Notification.insertMany(notificaciones);
  } catch (error) {
    console.error('Error creando notificaciones:', error);
  }
};

// @desc    Obtener notificaciones del usuario
// @route   GET /api/notificaciones
// @access  Private (administrador)
exports.getNotifications = async (req, res) => {
  try {
    const { limite = 20, noLeidas = false } = req.query;
    
    const query = { usuario: req.user._id };
    
    if (noLeidas === 'true') {
      query.leido = false;
    }
    
    const notificaciones = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limite))
      .lean();
    
    const noLeidasCount = await Notification.countDocuments({
      usuario: req.user._id,
      leido: false
    });
    
    res.status(200).json({
      success: true,
      data: {
        notificaciones,
        noLeidas: noLeidasCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Marcar notificación como leída
// @route   PUT /api/notificaciones/:id/leer
// @access  Private (administrador)
exports.markAsRead = async (req, res) => {
  try {
    const notificacion = await Notification.findOne({
      _id: req.params.id,
      usuario: req.user._id
    });
    
    if (!notificacion) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }
    
    notificacion.leido = true;
    await notificacion.save();
    
    res.status(200).json({
      success: true,
      data: notificacion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Marcar todas las notificaciones como leídas
// @route   PUT /api/notificaciones/leer-todas
// @access  Private (administrador)
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { usuario: req.user._id, leido: false },
      { leido: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

