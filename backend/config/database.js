const mongoose = require('mongoose');
const { initDatabase } = require('../utils/initDB');

const connectDB = async () => {
  try {
    // Asegurarse de que la URI incluya el nombre de la base de datos
    const defaultURI = 'mongodb+srv://sirleo1280_db_user:Frida1280@romero.gdd47wm.mongodb.net/romero_stock?retryWrites=true&w=majority';
    const mongoURI = process.env.MONGODB_URI || defaultURI;
    
    console.log(`🔌 Conectando a MongoDB...`);
    const conn = await mongoose.connect(mongoURI);

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    console.log(`📦 Base de datos: ${conn.connection.name}`);
    console.log(`📦 Base de datos: ${conn.connection.name}`);
    
    // Inicializar base de datos con datos por defecto
    await initDatabase();
  } catch (error) {
    console.error(`❌ Error conectando a MongoDB: ${error.message}`);
    console.error(`   URI usada: ${process.env.MONGODB_URI ? '[desde env]' : '[por defecto]'}`);
    process.exit(1);
  }
};

module.exports = connectDB;

