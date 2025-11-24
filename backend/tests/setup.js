const mongoose = require('mongoose');

// Configurar entorno de pruebas
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// Limpiar base de datos de prueba después de cada test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

module.exports = {
  setupTestDB: async () => {
    const mongoURI = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI_TEST o MONGODB_URI debe estar configurado');
    }
    await mongoose.connect(mongoURI);
  },
  closeTestDB: async () => {
    await mongoose.connection.close();
  }
};

