require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// URI de MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sirleo1280_db_user:Frida1280@romero.gdd47wm.mongodb.net/romero_stock';

// Usuarios de prueba
const usuariosPrueba = [
  // Administradores
  {
    nombre: 'Admin Prueba',
    email: 'admin@romero.com',
    password: 'Admin123!', // Cambiado para que coincida con el formato
    rol: 'administrador'
  },
  {
    nombre: 'Admin ',
    email: 'admin@romerito.com',
    password: '123456',
    rol: 'administrador'
  },
  {
    nombre: 'Sergio Franco',
    email: 'sergio.franco@romero.com',
    password: 'Admin123!',
    rol: 'administrador'
  },
  {
    nombre: 'Nahuel Romero',
    email: 'nahuel.romero@romero.com',
    password: 'Admin123!',
    rol: 'administrador'
  },
  {
    nombre: 'Escuela Técnica',
    email: 'escuela@romero.com',
    password: 'Admin123!',
    rol: 'administrador'
  },
  
  // Usuarios Nivel 1
  {
    nombre: 'Usuario1 Prueba',
    email: 'usuario1@romero.com',
    password: 'User1123!',
    rol: 'supervisor'
  },
  {
    nombre: 'Guillermo Kleimbielen',
    email: 'guillermo.kleimbielen@romero.com',
    password: 'User1123!',
    rol: 'supervisor'
  },
  {
    nombre: 'Javier Speroni',
    email: 'javier.speroni@romero.com',
    password: 'User1123!',
    rol: 'supervisor'
  },
  
  // Usuarios Comunes
  {
    nombre: 'Usuario Común Prueba',
    email: 'usuario.comun@romero.com',
    password: 'UserCom123!',
    rol: 'operario'
  },
  {
    nombre: 'Operario 1',
    email: 'operario1@romero.com',
    password: 'Oper123!',
    rol: 'operario'
  },
  {
    nombre: 'Operario 2',
    email: 'operario2@romero.com',
    password: 'Oper123!',
    rol: 'operario'
  }
];

// Función para crear usuarios
async function seedUsers() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB conectado\n');

    console.log('📝 Creando usuarios de prueba...\n');

    let creados = 0;
    let existentes = 0;
    let errores = 0;

    for (const usuarioData of usuariosPrueba) {
      try {
        // Verificar si el usuario ya existe
        const existe = await User.findOne({ email: usuarioData.email });
        
        if (existe) {
          console.log(`⚠️  Usuario ya existe: ${usuarioData.email} (${usuarioData.rol})`);
          existentes++;
        } else {
          // Crear usuario
          const usuario = await User.create(usuarioData);
          console.log(`✅ Usuario creado: ${usuario.nombre} (${usuario.email}) - ${usuario.rol}`);
          creados++;
        }
      } catch (error) {
        console.error(`❌ Error creando ${usuarioData.email}:`, error.message);
        errores++;
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`   ✅ Creados: ${creados}`);
    console.log(`   ⚠️  Existentes: ${existentes}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log(`   📦 Total procesados: ${usuariosPrueba.length}\n`);

    // Listar usuarios por rol
    console.log('👥 Usuarios por rol:');
    const adminCount = await User.countDocuments({ rol: 'administrador' });
    const supervisorCount = await User.countDocuments({ rol: 'supervisor' });
    const operarioCount = await User.countDocuments({ rol: 'operario' });
    
    console.log(`   👑 Administradores: ${adminCount}`);
    console.log(`   👨‍💼 Supervisores: ${supervisorCount}`);
    console.log(`   👷 Operarios: ${operarioCount}\n`);

    console.log('✨ Proceso completado\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar
seedUsers();

