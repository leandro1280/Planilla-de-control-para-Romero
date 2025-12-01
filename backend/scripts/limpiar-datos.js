/**
 * Script para limpiar datos de la base de datos
 * Borra: Movimientos, Mantenimientos, Notificaciones, Historial de Productos, Auditoría
 * Mantiene: Productos, Usuarios
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// Importar modelos
const Movement = require('../models/Movement');
const Maintenance = require('../models/Maintenance');
const Notification = require('../models/Notification');
const ProductHistory = require('../models/ProductHistory');
const RegistroAuditoria = require('../models/RegistroAuditoria');
const Product = require('../models/Product');
const User = require('../models/User');

const limpiarDatos = async () => {
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

    // Contar registros antes de borrar
    console.log('📊 Contando registros existentes...\n');
    const conteos = {
      movimientos: await Movement.countDocuments(),
      mantenimientos: await Maintenance.countDocuments(),
      notificaciones: await Notification.countDocuments(),
      historial: await ProductHistory.countDocuments(),
      auditoria: await RegistroAuditoria.countDocuments(),
      productos: await Product.countDocuments(),
      usuarios: await User.countDocuments()
    };

    console.log('📋 RESUMEN DE DATOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📦 Productos:           ${conteos.productos} (SE MANTIENEN)`);
    console.log(`👥 Usuarios:            ${conteos.usuarios} (SE MANTIENEN)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📥 Movimientos:         ${conteos.movimientos} (SE BORRARÁN)`);
    console.log(`🔧 Mantenimientos:      ${conteos.mantenimientos} (SE BORRARÁN)`);
    console.log(`🔔 Notificaciones:     ${conteos.notificaciones} (SE BORRARÁN)`);
    console.log(`📜 Historial Productos: ${conteos.historial} (SE BORRARÁN)`);
    console.log(`📝 Registros Auditoría: ${conteos.auditoria} (SE BORRARÁN)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Verificar si hay datos para borrar
    const totalBorrar = conteos.movimientos + conteos.mantenimientos + 
                        conteos.notificaciones + conteos.historial + conteos.auditoria;

    if (totalBorrar === 0) {
      console.log('✅ No hay datos para borrar. La base de datos ya está limpia.');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Pedir confirmación
    console.log('⚠️  ADVERTENCIA: Esta operación NO se puede deshacer.');
    console.log(`⚠️  Se borrarán ${totalBorrar} registros en total.\n`);

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

    console.log('\n🗑️  Iniciando limpieza de datos...\n');

    // Borrar colecciones
    const resultados = {};

    // 1. Borrar Movimientos
    if (conteos.movimientos > 0) {
      console.log('📥 Borrando movimientos...');
      const resultado = await Movement.deleteMany({});
      resultados.movimientos = resultado.deletedCount;
      console.log(`   ✅ ${resultado.deletedCount} movimientos borrados`);
    }

    // 2. Borrar Mantenimientos
    if (conteos.mantenimientos > 0) {
      console.log('🔧 Borrando mantenimientos...');
      const resultado = await Maintenance.deleteMany({});
      resultados.mantenimientos = resultado.deletedCount;
      console.log(`   ✅ ${resultado.deletedCount} mantenimientos borrados`);
    }

    // 3. Borrar Notificaciones
    if (conteos.notificaciones > 0) {
      console.log('🔔 Borrando notificaciones...');
      const resultado = await Notification.deleteMany({});
      resultados.notificaciones = resultado.deletedCount;
      console.log(`   ✅ ${resultado.deletedCount} notificaciones borradas`);
    }

    // 4. Borrar Historial de Productos
    if (conteos.historial > 0) {
      console.log('📜 Borrando historial de productos...');
      const resultado = await ProductHistory.deleteMany({});
      resultados.historial = resultado.deletedCount;
      console.log(`   ✅ ${resultado.deletedCount} registros de historial borrados`);
    }

    // 5. Borrar Registros de Auditoría
    if (conteos.auditoria > 0) {
      console.log('📝 Borrando registros de auditoría...');
      const resultado = await RegistroAuditoria.deleteMany({});
      resultados.auditoria = resultado.deletedCount;
      console.log(`   ✅ ${resultado.deletedCount} registros de auditoría borrados`);
    }

    // Resumen final
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ LIMPIEZA COMPLETADA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📦 Productos:           ${await Product.countDocuments()} (mantenidos)`);
    console.log(`👥 Usuarios:            ${await User.countDocuments()} (mantenidos)`);
    console.log(`📥 Movimientos:         ${await Movement.countDocuments()} (borrados)`);
    console.log(`🔧 Mantenimientos:      ${await Maintenance.countDocuments()} (borrados)`);
    console.log(`🔔 Notificaciones:     ${await Notification.countDocuments()} (borradas)`);
    console.log(`📜 Historial Productos: ${await ProductHistory.countDocuments()} (borrado)`);
    console.log(`📝 Registros Auditoría: ${await RegistroAuditoria.countDocuments()} (borrados)`);
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
  limpiarDatos();
}

module.exports = limpiarDatos;

