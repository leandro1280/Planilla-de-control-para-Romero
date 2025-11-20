require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// URI de MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sirleo1280_db_user:Frida1280@romero.gdd47wm.mongodb.net/romero_stock';

// Función para probar login
async function testLogin() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB conectado\n');

    // Credenciales de prueba
    const testCredentials = [
      { email: 'admin@romero.com', password: '123456' },
      { email: 'admin@romerito.com', password: '123456' },
      { email: 'sergio.franco@romero.com', password: 'Admin123!' },
    ];

    for (const cred of testCredentials) {
      console.log(`\n🔍 Probando: ${cred.email}`);
      
      const emailNormalizado = cred.email.toLowerCase().trim();
      const user = await User.findOne({ email: emailNormalizado }).select('+password');
      
      if (!user) {
        console.log(`   ❌ Usuario no encontrado`);
        continue;
      }
      
      console.log(`   ✅ Usuario encontrado: ${user.nombre}`);
      console.log(`   📧 Email en BD: ${user.email}`);
      console.log(`   👤 Rol: ${user.rol}`);
      console.log(`   🟢 Activo: ${user.activo}`);
      console.log(`   🔐 Password hash: ${user.password.substring(0, 20)}...`);
      
      const passwordMatch = await user.matchPassword(cred.password);
      console.log(`   ${passwordMatch ? '✅' : '❌'} Contraseña: ${passwordMatch ? 'VÁLIDA' : 'INVÁLIDA'}`);
    }

    console.log('\n📊 Todos los usuarios en la BD:');
    const allUsers = await User.find().select('email nombre rol activo');
    allUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.nombre}) - ${user.rol} - ${user.activo ? 'Activo' : 'Inactivo'}`);
    });

    console.log('\n✨ Proceso completado\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar
testLogin();

