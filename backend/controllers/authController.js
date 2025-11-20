const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { createNotificationForAdmins } = require('./notificationController');

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
      rol: rol || 'usuario_comun',
      creadoPor: req.user ? req.user._id : null
    });

    if (user) {
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
  console.log('\n═══════════════════════════════════════');
  console.log('🔐 LOGIN REQUEST RECIBIDA');
  console.log('═══════════════════════════════════════');
  console.log('📋 REQ.BODY:', JSON.stringify(req.body, null, 2));
  
  try {
    // El email ya viene normalizado del middleware de validación
    const { email, password } = req.body;
    
    console.log('\n📥 DATOS RECIBIDOS:');
    console.log('   📧 Email:', email);
    console.log('   🔑 Password:', password);
    console.log('   📏 Password length:', password?.length || 0);
    console.log('   🔍 Email type:', typeof email);
    console.log('   🔍 Password type:', typeof password);

    // Validar email y password
    if (!email || !password) {
      console.log('\n❌ VALIDACIÓN FALLIDA:');
      console.log('   Email vacío:', !email);
      console.log('   Password vacío:', !password);
      return res.status(400).json({
        success: false,
        message: 'Por favor ingrese email y contraseña'
      });
    }

    // Normalizar email (por si acaso)
    const emailNormalizado = (email || '').toLowerCase().trim();
    console.log('\n🔄 NORMALIZACIÓN:');
    console.log('   Email original:', email);
    console.log('   Email normalizado:', emailNormalizado);

    // Verificar usuario y contraseña
    console.log('\n🔍 BUSCANDO USUARIO EN BD...');
    console.log('   Query 1 (normalizado):', { email: emailNormalizado });
    
    let user = await User.findOne({ email: emailNormalizado }).select('+password');
    
    if (!user) {
      console.log('   ❌ No encontrado con email normalizado');
      console.log('   Query 2 (original del req.body):', { email: email });
      
      // Intentar buscar con el email original del req.body
      user = await User.findOne({ email: email }).select('+password');
      
      if (!user) {
        console.log('   ❌ No encontrado con email original');
        console.log('   Query 3 (case-insensitive): Buscando todos los usuarios...');
        
        // Buscar todos los usuarios para debug
        const allUsers = await User.find({}).select('email');
        console.log('   📋 Usuarios en BD:');
        allUsers.forEach(u => {
          console.log(`      - "${u.email}" (igual?: ${u.email === emailNormalizado}, igual case?: ${u.email.toLowerCase() === emailNormalizado})`);
        });
        
        console.log('\n❌ USUARIO NO ENCONTRADO');
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      } else {
        console.log('   ✅ Usuario encontrado con email original:', user.email);
      }
    } else {
      console.log('   ✅ Usuario encontrado con email normalizado');
    }

    console.log('\n✅ USUARIO ENCONTRADO:');
    console.log('   ID:', user._id);
    console.log('   Nombre:', user.nombre);
    console.log('   Email:', user.email);
    console.log('   Rol:', user.rol);
    console.log('   Activo:', user.activo);
    console.log('   Password hash (primeros 30 chars):', user.password?.substring(0, 30) + '...');

    if (!user.activo) {
      console.log('\n❌ USUARIO INACTIVO');
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo'
      });
    }

    // Verificar contraseña
    console.log('\n🔐 VERIFICANDO CONTRASEÑA...');
    console.log('   Contraseña recibida:', password);
    console.log('   Hash en BD:', user.password?.substring(0, 30) + '...');
    
    const passwordMatch = await user.matchPassword(password);
    console.log('   Resultado de matchPassword:', passwordMatch);
    
    if (!passwordMatch) {
      console.log('\n❌ CONTRASEÑA INCORRECTA');
      console.log('   Email:', emailNormalizado);
      console.log('   Contraseña recibida:', password);
      console.log('   Longitud:', password.length);
      
      // Intentar con diferentes variantes
      console.log('   🔍 Probando variantes...');
      const variants = [
        password.trim(),
        password.trim() + ' ',
        ' ' + password.trim(),
      ];
      
      for (const variant of variants) {
        if (variant !== password) {
          const match = await user.matchPassword(variant);
          console.log(`   Variante "${variant}": ${match ? '✅ MATCH' : '❌ No match'}`);
        }
      }
      
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    console.log('\n✅ CONTRASEÑA CORRECTA');
    console.log(`✅ LOGIN EXITOSO: ${user.nombre} (${user.email})`);

    const token = generateToken(user._id);
    console.log('   Token generado (primeros 30 chars):', token?.substring(0, 30) + '...');

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });
    console.log('   Cookie configurada');

    const responseData = {
      success: true,
      data: {
        _id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        token
      }
    };
    
    console.log('\n📤 ENVIANDO RESPUESTA EXITOSA');
    console.log('═══════════════════════════════════════\n');
    
    res.status(200).json(responseData);
  } catch (error) {
    console.log('\n💥 ERROR EN LOGIN:');
    console.error('   Error:', error);
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    console.log('═══════════════════════════════════════\n');
    
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Logout usuario
// @route   POST /auth/logout
// @route   GET /auth/logout
// @access  Private
exports.logout = async (req, res) => {
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

