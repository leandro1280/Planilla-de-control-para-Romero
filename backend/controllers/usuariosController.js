const User = require('../models/User');
const { registrarAuditoria } = require('../middleware/auditoria');
const { createNotificationForAdmins } = require('./notificationController');

// @desc    Obtener todos los usuarios
// @route   GET /auth/usuarios
// @access  Private (solo administrador)
exports.getUsuarios = async (req, res) => {
  // Timeout de 8 segundos
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.error('⏱️ Timeout en usuarios después de 8 segundos');
      return res.status(503).render('error', {
        title: 'Timeout',
        message: 'La consulta de usuarios está tardando demasiado. Por favor intenta nuevamente.',
        layout: 'main'
      });
    }
  }, 8000);

  try {
    // Helper para agregar timeout a promesas
    const withTimeout = (promise, ms) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout después de ${ms}ms`)), ms)
        )
      ]);
    };

    // Query con timeout
    const usuarios = await withTimeout(
      User.find({})
        .populate('creadoPor', 'nombre email')
        .sort({ createdAt: -1 })
        .lean(),
      6000 // 6 segundos máximo
    );

    clearTimeout(timeout);

    res.render('auth/usuarios', {
      title: 'Gestión de Usuarios - Romero Panificados',
      currentPage: 'usuarios',
      usuarios: usuarios || [],
      usuario: {
        _id: req.user._id.toString(),
        nombre: req.user.nombre,
        email: req.user.email,
        rol: req.user.rol
      }
    });
  } catch (error) {
    clearTimeout(timeout);
    console.error('Error al obtener usuarios:', error);
    
    if (!res.headersSent) {
      res.status(500).render('error', {
        title: 'Error',
        message: error.message || 'Error al cargar los usuarios. Por favor intenta nuevamente.',
        layout: 'main'
      });
    }
  }
};

// @desc    Actualizar usuario (activar/desactivar, cambiar rol)
// @route   PUT /auth/usuarios/:id
// @access  Private (solo administrador)
exports.updateUsuario = async (req, res) => {
  try {
    const { activo, rol } = req.body;
    const usuarioId = req.params.id;

    // No permitir que un admin se desactive a sí mismo
    if (usuarioId === req.user._id.toString() && activo === false) {
      return res.status(400).json({
        success: false,
        message: 'No puedes desactivar tu propio usuario'
      });
    }

    const updateData = {};
    if (activo !== undefined) updateData.activo = activo === true || activo === 'true';
    if (rol) updateData.rol = rol;

    const usuario = await User.findByIdAndUpdate(
      usuarioId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Registrar auditoría
    await registrarAuditoria(req, 'MODIFICAR', 'Usuario', usuario._id, {
      email: usuario.email,
      nombre: usuario.nombre,
      cambios: {
        activo: updateData.activo,
        rol: updateData.rol
      }
    });

    // Crear notificación
    await createNotificationForAdmins(
      'usuario_modificado',
      `${req.user.nombre} ${activo === false || activo === 'false' ? 'desactivó' : 'activó'} a ${usuario.nombre}`,
      {
        usuarioId: usuario._id.toString(),
        nombre: usuario.nombre,
        email: usuario.email
      }
    );

    res.status(200).json({
      success: true,
      data: usuario
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar el usuario'
    });
  }
};

// @desc    Eliminar usuario
// @route   DELETE /auth/usuarios/:id
// @access  Private (solo administrador)
exports.deleteUsuario = async (req, res) => {
  try {
    const usuarioId = req.params.id;

    // No permitir que un admin se elimine a sí mismo
    if (usuarioId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propio usuario'
      });
    }

    const usuario = await User.findById(usuarioId);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Guardar datos para auditoría antes de eliminar
    const usuarioData = {
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol
    };

    // Registrar auditoría antes de eliminar
    await registrarAuditoria(req, 'ELIMINAR', 'Usuario', usuario._id, usuarioData);

    // Eliminar usuario
    await User.findByIdAndDelete(usuarioId);

    // Crear notificación
    await createNotificationForAdmins(
      'usuario_eliminado',
      `${req.user.nombre} eliminó al usuario: ${usuarioData.nombre}`,
      {
        nombre: usuarioData.nombre,
        email: usuarioData.email
      }
    );

    res.status(200).json({
      success: true,
      message: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al eliminar el usuario'
    });
  }
};

