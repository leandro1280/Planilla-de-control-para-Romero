const mongoose = require('mongoose');
const { initDatabase } = require('../utils/initDB');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('La variable de entorno MONGODB_URI no está definida');
    }

    console.log(`🔌 Conectando a MongoDB...`);
    const conn = await mongoose.connect(mongoURI);

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    console.log(`📦 Base de datos: ${conn.connection.name}`);

    // Inicializar base de datos con datos por defecto
    await initDatabase();
  } catch (error) {
    console.error(`❌ Error conectando a MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

