const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Movement = require('../models/Movement');

const clearData = async () => {
  try {
    // Verificar URI
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI no está definida en el archivo .env');
    }

    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado exitosamente');

    // 1. Eliminar Movimientos (opcional, pero recomendado para mantener consistencia)
    console.log('🗑️  Eliminando historial de movimientos...');
    const resultMov = await Movement.deleteMany({});
    console.log(`   -> ${resultMov.deletedCount} movimientos eliminados.`);

    // 2. Eliminar Productos
    console.log('🗑️  Eliminando todos los productos...');
    const resultProd = await Product.deleteMany({});
    console.log(`   -> ${resultProd.deletedCount} productos eliminados.`);

    console.log('✨ Limpieza completada exitosamente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

clearData();

