const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { createNotificationForAdmins } = require('./notificationController');
const { registrarAuditoria } = require('../middleware/auditoria');

// @desc    Registrar usuario
// @route   POST /auth/register
// @access  Public (solo administrador puede crear)
exports.register = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya existe'
      });
    }

    // Crear usuario
    const user = await User.create({
      nombre,
      email,
      password,
      rol: rol || 'operario',
      creadoPor: req.user ? req.user._id : null
    });

    if (user) {
      // Registrar auditoría
      await registrarAuditoria(req, 'CREAR', 'Usuario', user._id, {
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      });

      // Crear notificación para otros administradores (si no es el mismo que está creando)
      if (req.user && req.user._id.toString() !== user._id.toString()) {
        await createNotificationForAdmins(
          'usuario_creado',
          `${req.user.nombre} creó un nuevo usuario: ${user.nombre} (${user.rol})`,
          {
            usuarioId: user._id.toString(),
            nombre: user.nombre,
            email: user.email,
            rol: user.rol
          }
        );
      }

      // No generar token ni cookie para el nuevo usuario
      // Solo retornar éxito ya que el admin ya está logueado
      return res.status(201).json({
        success: true,
        message: 'Usuario creado correctamente',
        warning: 'IMPORTANTE: Recuerde informar al usuario su contraseña. Si la olvida, NO podrá recuperarla. El usuario podrá cambiarla después de iniciar sesión.',
        data: {
          _id: user._id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Datos de usuario inválidos'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login usuario
// @route   POST /auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar email y password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingrese email y contraseña'
      });
    }

    // Normalizar email
    const emailNormalizado = (email || '').toLowerCase().trim();

    // Verificar usuario y contraseña
    const user = await User.findOne({ email: emailNormalizado }).select('+password');

    if (!user || !user.activo) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const passwordMatch = await user.matchPassword(password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Establecer req.user temporalmente para la auditoría
    req.user = user;

    // Registrar auditoría de login
    await registrarAuditoria(req, 'LOGIN', 'Usuario', user._id, {
      email: user.email,
      rol: user.rol
    });

    const token = generateToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });

    // Si el usuario tiene passwordResetRequired, guardarlo en la sesión para mostrar aviso
    if (user.passwordResetRequired) {
      res.cookie('passwordResetRequired', 'true', {
        httpOnly: false, // Necesario para que el cliente pueda leerlo
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        token
      }
    });
  } catch (error) {
    // No registrar detalles del error para evitar exposición de información sensible
    return res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// @desc    Logout usuario
// @route   POST /auth/logout
// @route   GET /auth/logout
// @access  Private
exports.logout = async (req, res) => {
  // Registrar auditoría de logout antes de limpiar
  if (req.user) {
    await registrarAuditoria(req, 'LOGOUT', 'Usuario', req.user._id, {
      email: req.user.email,
      rol: req.user.rol
    });
  }

  // Limpiar cookie
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  // Si es una petición AJAX/JSON, retornar JSON
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(200).json({
      success: true,
      message: 'Sesión cerrada correctamente'
    });
  }

  // Redirigir a login
  res.redirect('/auth/login');
};

// @desc    Obtener usuario actual
// @route   GET /auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Renderizar vistas
exports.renderLogin = (req, res) => {
  res.render('auth/login', {
    title: 'Login - Romero Panificados',
    layout: 'auth'
  });
};

exports.renderRegister = async (req, res) => {
  try {
    const usuario = req.user;

    res.render('auth/register', {
      title: 'Registro de Usuario - Romero Panificados',
      layout: 'main',
      currentPage: 'usuarios',
      usuario: {
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      },
      messages: {}
    });
  } catch (error) {
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al cargar la página de registro',
      layout: 'main'
    });
  }
};

// @desc    Cambiar contraseña del usuario actual
// @route   PUT /auth/cambiar-password
// @access  Private
exports.cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, nuevaPassword, confirmarPassword } = req.body;

    // Validaciones
    if (!passwordActual || !nuevaPassword || !confirmarPassword) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios'
      });
    }

    if (nuevaPassword !== confirmarPassword) {
      return res.status(400).json({
        success: false,
        message: 'Las contraseñas nuevas no coinciden'
      });
    }

    if (nuevaPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    // Validar formato de contraseña (mayúscula, minúscula, número)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(nuevaPassword)) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
      });
    }

    // Obtener usuario con contraseña
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
    const passwordMatch = await user.matchPassword(passwordActual);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'La contraseña actual es incorrecta'
      });
    }

    // Verificar que la nueva contraseña sea diferente
    const nuevaPasswordMatch = await user.matchPassword(nuevaPassword);
    if (nuevaPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe ser diferente a la actual'
      });
    }

    // Actualizar contraseña
    user.password = nuevaPassword;
    user.passwordResetRequired = false; // Marcar que ya no requiere reset
    await user.save();

    // Registrar auditoría
    await registrarAuditoria(req, 'MODIFICAR', 'Usuario', user._id, {
      email: user.email,
      nombre: user.nombre,
      cambio: 'Contraseña actualizada'
    });

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    // No registrar detalles del error para evitar exposición de información sensible
    return res.status(500).json({
      success: false,
      message: 'Error al cambiar la contraseña'
    });
  }
};

// @desc    Renderizar vista de cambio de contraseña
// @route   GET /auth/cambiar-password
// @access  Private
exports.renderCambiarPassword = (req, res) => {
  res.render('auth/cambiar-password', {
    title: 'Cambiar Contraseña - Romero Panificados',
    layout: 'main',
    currentPage: 'perfil',
    usuario: {
      nombre: req.user.nombre,
      email: req.user.email,
      rol: req.user.rol
    }
  });
};

