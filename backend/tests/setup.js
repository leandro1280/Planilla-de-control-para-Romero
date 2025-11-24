/**
 * Archivo de configuración global de tests
 * Este archivo se ejecuta antes de todos los tests
 */

// Configurar variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing-only';

const mongoose = require('mongoose');

// Setup antes de todos los tests
beforeAll(async () => {
  const mongoURI = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI;
  if (mongoURI) {
    try {
      await mongoose.connect(mongoURI, {
        connectTimeoutMS: 10000
      });
      console.log('✅ Conectado a MongoDB para tests');
    } catch (error) {
      console.warn('⚠️ No se pudo conectar a MongoDB para tests:', error.message);
      console.warn('⚠️ Algunos tests pueden fallar sin conexión a DB');
    }
  }
}, 30000); // Timeout de 30 segundos

// Cleanup después de todos los tests
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('✅ Conexión a MongoDB cerrada');
  }
}, 10000);

// Limpiar colecciones después de cada test suite (opcional)
afterEach(async () => {
  // Desactivado por defecto - activar con CLEAN_TEST_DB=true si se necesita
  if (process.env.CLEAN_TEST_DB === 'true' && mongoose.connection.readyState === 1) {
    try {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }
    } catch (error) {
      // Ignorar errores de limpieza
    }
  }
});
