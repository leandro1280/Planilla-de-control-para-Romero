const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configuración
const MONGODB_URI = process.env.MONGODB_URI;
const BACKUP_DIR = path.join(__dirname, '../backups');

// Función para restaurar backup
async function restaurarBackup(archivoBackup) {
  try {
    if (!archivoBackup) {
      console.error('❌ Debes especificar el archivo de backup a restaurar');
      console.log('📋 Archivos de backup disponibles:');
      
      const archivos = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
        .sort()
        .reverse();
      
      archivos.forEach((archivo, index) => {
        const archivoPath = path.join(BACKUP_DIR, archivo);
        const stats = fs.statSync(archivoPath);
        console.log(`  ${index + 1}. ${archivo} (${stats.mtime.toLocaleString()})`);
      });
      
      process.exit(1);
    }

    const backupPath = path.join(BACKUP_DIR, archivoBackup);
    
    if (!fs.existsSync(backupPath)) {
      console.error(`❌ El archivo de backup no existe: ${backupPath}`);
      process.exit(1);
    }

    console.log('🔄 Iniciando restauración de backup...');
    console.log(`📁 Archivo: ${archivoBackup}`);

    // Leer backup
    const backupContent = fs.readFileSync(backupPath, 'utf8');
    const backup = JSON.parse(backupContent);

    console.log(`📅 Fecha del backup: ${backup.fecha}`);
    console.log(`📦 Colecciones a restaurar: ${Object.keys(backup.colecciones).length}`);

    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;

    // Restaurar cada colección
    for (const [collectionName, data] of Object.entries(backup.colecciones)) {
      console.log(`📦 Restaurando: ${collectionName} (${data.length} documentos)`);
      
      // Limpiar colección existente
      await db.collection(collectionName).deleteMany({});
      
      // Insertar datos del backup
      if (data.length > 0) {
        await db.collection(collectionName).insertMany(data);
      }
      
      console.log(`✅ ${collectionName} restaurada`);
    }

    console.log('✅ Restauración completada exitosamente');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error restaurando backup:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Obtener archivo de backup desde argumentos
const archivoBackup = process.argv[2];
restaurarBackup(archivoBackup);

