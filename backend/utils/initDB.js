const User = require('../models/User');
const Product = require('../models/Product');

// Usuarios iniciales según los permisos especificados
const usuariosIniciales = [
  {
    nombre: 'Sergio Franco',
    email: 'sergio.franco@romero.com',
    password: process.env.ADMIN_PASSWORD || 'Admin123!', // Se recomienda usar variable de entorno
    rol: 'administrador'
  },
  {
    nombre: 'Nahuel Romero',
    email: 'nahuel.romero@romero.com',
    password: process.env.ADMIN_PASSWORD || 'Admin123!',
    rol: 'administrador'
  },
  {
    nombre: 'Escuela Técnica',
    email: 'escuela@romero.com',
    password: process.env.ADMIN_PASSWORD || 'Admin123!',
    rol: 'administrador'
  },
  {
    nombre: 'Guillermo Kleimbielen',
    email: 'guillermo.kleimbielen@romero.com',
    password: process.env.USER_PASSWORD || 'User1123!',
    rol: 'visor'
  },
  {
    nombre: 'Javier Speroni',
    email: 'javier.speroni@romero.com',
    password: process.env.USER_PASSWORD || 'User1123!',
    rol: 'visor'
  }
];

// Productos iniciales
const productosIniciales = [
  {
    referencia: 'CAD-40-SIMPLE',
    nombre: 'ASA 40 simple',
    equipo: 'Varias máquinas',
    existencia: 12,
    detalle: '',
    tipo: 'Cadena',
    costoUnitario: 12500,
    creadoPor: null
  },
  {
    referencia: 'CAD-50-SIMPLE',
    nombre: 'ASA 50 simple',
    equipo: 'Transportador horno',
    existencia: 8,
    detalle: '',
    tipo: 'Cadena',
    costoUnitario: 14700,
    creadoPor: null
  },
  {
    referencia: 'CAD-S55',
    nombre: 'ASA S55 simple',
    equipo: 'Transportador horno',
    existencia: 2,
    detalle: '',
    tipo: 'Cadena',
    costoUnitario: 13800,
    creadoPor: null
  },
  {
    referencia: 'CAD-80X2',
    nombre: 'ASA 80 doble',
    equipo: 'Amasadora',
    existencia: 6,
    detalle: '',
    tipo: 'Cadena',
    costoUnitario: 22400,
    creadoPor: null
  },
  {
    referencia: 'CAD-ASA80X2',
    nombre: 'Cadena ASA 80 doble',
    equipo: 'Divisora',
    existencia: 14,
    detalle: '',
    tipo: 'Cadena',
    costoUnitario: 23150,
    creadoPor: null
  },
  {
    referencia: 'CAD-06B-2',
    nombre: '06-B2 doble',
    equipo: 'Divisora L-GA3000',
    existencia: 4,
    detalle: '',
    tipo: 'Cadena',
    costoUnitario: 8500,
    creadoPor: null
  },
  {
    referencia: 'UNI-CAD-40X1 C/ALTEA',
    nombre: 'Unión cadena ASA 40 con aleta',
    equipo: 'Transportador',
    existencia: 3,
    detalle: '',
    tipo: 'Unión',
    costoUnitario: 4600,
    creadoPor: null
  },
  {
    referencia: 'PERNO-ESTIBA',
    nombre: 'Pernos para bandejas Estibador',
    equipo: 'Estibador',
    existencia: 9,
    detalle: '',
    tipo: 'Perno',
    costoUnitario: 1200,
    creadoPor: null
  },
  {
    referencia: 'ROD-GY1103KRRB3',
    nombre: 'GY1103KRRB3',
    equipo: 'Rodamiento especial',
    existencia: 5,
    detalle: '',
    tipo: 'Rodamiento',
    costoUnitario: 19800,
    creadoPor: null
  }
];

exports.initDatabase = async () => {
  try {
    // Verificar si ya hay usuarios
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();

    let usuariosCreados = 0;
    let productosCreados = 0;

    // Crear usuarios si no existen
    if (userCount === 0) {
      console.log('📝 Inicializando usuarios...');

      for (const userData of usuariosIniciales) {
        try {
          const existeUsuario = await User.findOne({ email: userData.email });
          if (!existeUsuario) {
            const user = await User.create(userData);
            console.log(`✅ Usuario creado: ${user.nombre} (${user.email})`);
            usuariosCreados++;
          }
        } catch (error) {
          console.log(`⚠️  Usuario ${userData.email} ya existe o error: ${error.message}`);
        }
      }
    }

    // Crear productos si no existen (independientemente de si hay usuarios)
    if (productCount === 0) {
      console.log('📝 Inicializando productos...');

      // Obtener el primer administrador para asignar como creador
      let admin = await User.findOne({ rol: 'administrador' });

      // Si no hay admin, usar el primer usuario o null
      if (!admin) {
        admin = await User.findOne();
      }

      for (const productData of productosIniciales) {
        try {
          const existeProducto = await Product.findOne({ referencia: productData.referencia });
          if (!existeProducto) {
            productData.creadoPor = admin ? admin._id : null;
            productData.actualizadoPor = admin ? admin._id : null;
            const product = await Product.create(productData);
            console.log(`✅ Producto creado: ${product.referencia}`);
            productosCreados++;
          } else {
            console.log(`⚠️  Producto ${productData.referencia} ya existe`);
          }
        } catch (error) {
          console.log(`⚠️  Error creando producto ${productData.referencia}: ${error.message}`);
        }
      }
    }

    if (usuariosCreados > 0 || productosCreados > 0) {
      console.log(`✅ Base de datos inicializada: ${usuariosCreados} usuarios, ${productosCreados} productos`);
      if (usuariosCreados > 0) {
        console.log('⚠️  IMPORTANTE: Cambia las contraseñas de los usuarios en producción');
      }
    } else {
      console.log(`📊 Base de datos ya tiene ${userCount} usuarios y ${productCount} productos`);
    }
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error.message);
    console.error('Stack:', error.stack);
  }
};

