const User = require('../models/User');
const Product = require('../models/Product');

// Usuarios iniciales según los permisos especificados
const usuariosIniciales = [
  {
    nombre: 'Sergio Franco',
    email: 'sergio.franco@romero.com',
    password: 'Admin123!', // Cambiar en producción
    rol: 'administrador'
  },
  {
    nombre: 'Nahuel Romero',
    email: 'nahuel.romero@romero.com',
    password: 'Admin123!', // Cambiar en producción
    rol: 'administrador'
  },
  {
    nombre: 'Escuela Técnica',
    email: 'escuela@romero.com',
    password: 'Admin123!', // Cambiar en producción
    rol: 'administrador'
  },
  {
    nombre: 'Guillermo Kleimbielen',
    email: 'guillermo.kleimbielen@romero.com',
    password: 'User1123!', // Cambiar en producción
    rol: 'visor'
  },
  {
    nombre: 'Javier Speroni',
    email: 'javier.speroni@romero.com',
    password: 'User1123!', // Cambiar en producción
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
    
    if (userCount === 0) {
      console.log('📝 Inicializando base de datos...');
      
      // Crear usuarios
      for (const userData of usuariosIniciales) {
        const user = await User.create(userData);
        console.log(`✅ Usuario creado: ${user.nombre} (${user.email})`);
      }
      
      // Obtener el primer administrador para asignar como creador
      const admin = await User.findOne({ rol: 'administrador' });
      
      // Crear productos
      for (const productData of productosIniciales) {
        productData.creadoPor = admin._id;
        productData.actualizadoPor = admin._id;
        const product = await Product.create(productData);
        console.log(`✅ Producto creado: ${product.referencia}`);
      }
      
      console.log('✅ Base de datos inicializada correctamente');
      console.log('⚠️  IMPORTANTE: Cambia las contraseñas de los usuarios en producción');
    } else {
      console.log(`📊 Base de datos ya tiene ${userCount} usuarios`);
    }
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error.message);
  }
};

