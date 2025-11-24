const mongoose = require('mongoose');
const { initDatabase } = require('../utils/initDB');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      console.error(`❌ Error: La variable de entorno MONGODB_URI no está definida`);
      console.warn(`⚠️  El servidor continuará ejecutándose, pero algunas funciones pueden no estar disponibles`);
      return;
    }

    console.log(`🔌 Conectando a MongoDB...`);
    
    // Opciones de conexión con timeouts mejorados
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 segundos para seleccionar servidor
      socketTimeoutMS: 45000, // 45 segundos timeout de socket
      connectTimeoutMS: 10000, // 10 segundos para conectar
      maxPoolSize: 10, // Mantener hasta 10 conexiones
      minPoolSize: 2, // Mantener al menos 2 conexiones
      maxIdleTimeMS: 30000, // Cerrar conexiones inactivas después de 30 segundos
      retryWrites: true,
      retryReads: true
    };
    
    const conn = await mongoose.connect(mongoURI, options);

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    console.log(`📦 Base de datos: ${conn.connection.name}`);

    // Inicializar base de datos con datos por defecto (no bloqueante)
    initDatabase().catch(err => {
      console.error(`⚠️  Error inicializando base de datos: ${err.message}`);
      console.warn(`⚠️  El servidor continuará ejecutándose`);
    });

    // Manejar eventos de conexión de MongoDB
    mongoose.connection.on('error', (err) => {
      console.error(`❌ Error de MongoDB: ${err.message}`);
      console.warn(`⚠️  El servidor continuará ejecutándose, pero algunas funciones pueden no estar disponibles`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn(`⚠️  MongoDB desconectado. Intentando reconectar...`);
    });

    mongoose.connection.on('reconnected', () => {
      console.log(`✅ MongoDB reconectado`);
    });

  } catch (error) {
    console.error(`❌ Error conectando a MongoDB: ${error.message}`);
    console.warn(`⚠️  El servidor continuará ejecutándose, pero algunas funciones pueden no estar disponibles`);
    console.warn(`⚠️  Se intentará reconectar automáticamente cuando MongoDB esté disponible`);
    
    // NO hacer process.exit(1) - permitir que el servidor siga corriendo
    // Intentar reconectar después de un tiempo
    setTimeout(() => {
      console.log(`🔄 Intentando reconectar a MongoDB...`);
      connectDB();
    }, 30000); // Intentar cada 30 segundos
  }
};

module.exports = connectDB;

