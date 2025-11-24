const mongoose = require('mongoose');
const { initDatabase } = require('../utils/initDB');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      logger.error('La variable de entorno MONGODB_URI no está definida');
      
      // En producción, esto es crítico y debe detener el servidor
      if (process.env.NODE_ENV === 'production') {
        logger.error('CRÍTICO: Sin conexión a base de datos, el servidor no puede funcionar');
        logger.warn('Cerrando servidor en 5 segundos...');
        setTimeout(() => {
          process.exit(1);
        }, 5000);
        return;
      }
      
      // En desarrollo/test, solo advertir
      logger.warn('El servidor continuará ejecutándose, pero algunas funciones pueden no estar disponibles');
      return;
    }

    logger.info('Conectando a MongoDB...');
    
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

    logger.info('MongoDB conectado', {
      host: conn.connection.host,
      database: conn.connection.name
    });

    // Inicializar base de datos con datos por defecto (no bloqueante)
    initDatabase().catch(err => {
      logger.error('Error inicializando base de datos', err);
      logger.warn('El servidor continuará ejecutándose');
    });

    // Manejar eventos de conexión de MongoDB
    mongoose.connection.on('error', (err) => {
      logger.error('Error de MongoDB', err);
      logger.warn('El servidor continuará ejecutándose, pero algunas funciones pueden no estar disponibles');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB desconectado. Intentando reconectar...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconectado');
    });

  } catch (error) {
    logger.error('Error conectando a MongoDB', error);
    logger.warn('El servidor continuará ejecutándose, pero algunas funciones pueden no estar disponibles');
    logger.warn('Se intentará reconectar automáticamente cuando MongoDB esté disponible');
    
    // NO hacer process.exit(1) - permitir que el servidor siga corriendo
    // Intentar reconectar después de un tiempo
    setTimeout(() => {
      logger.info('Intentando reconectar a MongoDB...');
      connectDB();
    }, 30000); // Intentar cada 30 segundos
  }
};

module.exports = connectDB;

