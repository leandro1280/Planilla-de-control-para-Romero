const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configuración
const MONGODB_URI = process.env.MONGODB_URI;
const BACKUP_DIR = path.join(__dirname, '../backups');

// Asegurar que el directorio de backups existe
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Función para hacer backup
async function hacerBackup() {
  try {
    console.log('🔄 Iniciando backup de la base de datos...');

    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    const fecha = new Date();
    const fechaStr = fecha.toISOString().split('T')[0];
    const horaStr = fecha.toTimeString().split(' ')[0].replace(/:/g, '-');
    const backupFileName = `backup_${fechaStr}_${horaStr}.json`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    const backup = {
      fecha: fecha.toISOString(),
      version: '1.0',
      colecciones: {}
    };

    // Hacer backup de cada colección
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`📦 Haciendo backup de: ${collectionName}`);
      
      const data = await db.collection(collectionName).find({}).toArray();
      backup.colecciones[collectionName] = data;
      
      console.log(`✅ ${collectionName}: ${data.length} documentos`);
    }

    // Guardar backup en archivo JSON
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.log(`✅ Backup guardado en: ${backupPath}`);

    // Limpiar backups antiguos (mantener solo los últimos 30 días)
    limpiarBackupsAntiguos();

    console.log('✅ Backup completado exitosamente');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error haciendo backup:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Función para limpiar backups antiguos
function limpiarBackupsAntiguos() {
  try {
    const archivos = fs.readdirSync(BACKUP_DIR);
    const ahora = new Date();
    const diasRetencion = 30;
    const fechaLimite = new Date(ahora.getTime() - diasRetencion * 24 * 60 * 60 * 1000);

    let eliminados = 0;
    archivos.forEach(archivo => {
      if (archivo.startsWith('backup_') && archivo.endsWith('.json')) {
        const archivoPath = path.join(BACKUP_DIR, archivo);
        const stats = fs.statSync(archivoPath);
        
        if (stats.mtime < fechaLimite) {
          fs.unlinkSync(archivoPath);
          eliminados++;
          console.log(`🗑️  Eliminado backup antiguo: ${archivo}`);
        }
      }
    });

    if (eliminados > 0) {
      console.log(`✅ ${eliminados} backup(s) antiguo(s) eliminado(s)`);
    }
  } catch (error) {
    console.error('⚠️  Error limpiando backups antiguos:', error.message);
  }
}

// Ejecutar backup
hacerBackup();

