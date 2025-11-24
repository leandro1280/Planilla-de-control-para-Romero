/**
 * Archivo principal de configuración de tests
 * Configuración de Jest y helpers globales
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
      await mongoose.connect(mongoURI);
    } catch (error) {
      console.warn('⚠️ No se pudo conectar a MongoDB para tests:', error.message);
    }
  }
}, 30000); // Aumentar timeout a 30 segundos

// Cleanup después de todos los tests
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}, 10000);

// Limpiar colecciones después de cada test suite
afterEach(async () => {
  if (process.env.CLEAN_TEST_DB === 'true' && mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});

// Test básico para que Jest no se queje
describe('Configuración de Tests', () => {
  test('Debería configurar el entorno de tests correctamente', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBeDefined();
  });
});

