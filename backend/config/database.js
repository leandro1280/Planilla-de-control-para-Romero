const mongoose = require('mongoose');
const { initDatabase } = require('../utils/initDB');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://sirleo1280_db_user:Frida1280@romero.gdd47wm.mongodb.net/', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    
    // Inicializar base de datos con datos por defecto
    await initDatabase();
  } catch (error) {
    console.error(`❌ Error conectando a MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

