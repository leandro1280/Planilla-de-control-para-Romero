/**
 * Script para limpiar usuarios excepto sergio.franco@romero.com
 * Mantiene solo el usuario administrador especificado
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// Importar modelo
const User = require('../models/User');

const limpiarUsuarios = async () => {
  try {
    // Conectar a MongoDB
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('❌ Error: MONGODB_URI no está definida en las variables de entorno');
      process.exit(1);
    }

    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
    console.log('✅ Conectado a MongoDB\n');

    // Email del usuario a mantener
    const emailMantener = 'sergio.franco@romero.com';

    // Verificar que el usuario a mantener existe
    const usuarioMantener = await User.findOne({ email: emailMantener.toLowerCase() });
    
    if (!usuarioMantener) {
      console.error(`❌ Error: No se encontró el usuario ${emailMantener}`);
      console.error('   No se puede proceder sin este usuario.');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`✅ Usuario a mantener encontrado: ${usuarioMantener.nombre} (${usuarioMantener.email})`);
    console.log(`   Rol: ${usuarioMantener.rol}\n`);

    // Contar usuarios antes de borrar
    const totalUsuarios = await User.countDocuments();
    const usuariosABorrar = totalUsuarios - 1; // Menos el que mantenemos

    console.log('📊 RESUMEN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👥 Total de usuarios:     ${totalUsuarios}`);
    console.log(`✅ Usuario a mantener:    ${usuarioMantener.nombre} (${usuarioMantener.email})`);
    console.log(`🗑️  Usuarios a borrar:     ${usuariosABorrar}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (usuariosABorrar === 0) {
      console.log('✅ No hay usuarios para borrar. Solo existe el usuario administrador.');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Listar usuarios que se van a borrar
    const usuariosBorrar = await User.find({ 
      email: { $ne: emailMantener.toLowerCase() } 
    }).select('nombre email rol');

    console.log('📋 Usuarios que se borrarán:');
    usuariosBorrar.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.nombre} (${u.email}) - ${u.rol}`);
    });
    console.log('');

    // Pedir confirmación
    console.log('⚠️  ADVERTENCIA: Esta operación NO se puede deshacer.');
    console.log(`⚠️  Se borrarán ${usuariosABorrar} usuarios.\n`);

    // En modo no interactivo (si se pasa --yes), proceder sin confirmación
    const args = process.argv.slice(2);
    const autoConfirm = args.includes('--yes') || args.includes('-y');

    if (!autoConfirm) {
      console.log('❓ ¿Estás seguro de que quieres continuar?');
      console.log('   Presiona Ctrl+C para cancelar o Enter para continuar...\n');
      
      // Esperar entrada del usuario (solo en modo interactivo)
      await new Promise((resolve) => {
        process.stdin.once('data', () => resolve());
      });
    }

    console.log('\n🗑️  Iniciando limpieza de usuarios...\n');

    // Borrar usuarios excepto el especificado
    const resultado = await User.deleteMany({ 
      email: { $ne: emailMantener.toLowerCase() } 
    });

    console.log(`✅ ${resultado.deletedCount} usuarios borrados exitosamente\n`);

    // Verificar resultado final
    const usuariosRestantes = await User.countDocuments();
    const usuarioFinal = await User.findOne({ email: emailMantener.toLowerCase() });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ LIMPIEZA COMPLETADA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👥 Usuarios restantes:     ${usuariosRestantes}`);
    console.log(`✅ Usuario mantenido:      ${usuarioFinal.nombre} (${usuarioFinal.email})`);
    console.log(`   Rol:                     ${usuarioFinal.rol}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Cerrar conexión
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    console.log('✅ Proceso completado exitosamente\n');

  } catch (error) {
    console.error('\n❌ Error durante la limpieza:', error.message);
    console.error(error.stack);
    
    // Intentar cerrar conexión
    try {
      await mongoose.connection.close();
    } catch (e) {
      // Ignorar errores al cerrar
    }
    
    process.exit(1);
  }
};

// Ejecutar script
if (require.main === module) {
  limpiarUsuarios();
}

module.exports = limpiarUsuarios;

