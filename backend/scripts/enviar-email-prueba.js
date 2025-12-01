/**
 * Script para enviar un email de prueba de alerta de stock bajo
 * Uso: node scripts/enviar-email-prueba.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { enviarAlertaStockBajo, enviarAlertaMantenimiento } = require('../services/servicioEmail');
const Product = require('../models/Product');
const Maintenance = require('../models/Maintenance');

const destinatario = 'pc1manromero@gmail.com';

async function enviarPrueba() {
  try {
    console.log('📧 Iniciando envío de email de prueba...');
    console.log(`📬 Destinatario: ${destinatario}`);

    // Conectar a MongoDB
    if (!mongoose.connection.readyState) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/romero';
      await mongoose.connect(mongoUri);
      console.log('✅ Conectado a MongoDB');
    }

    // Intentar obtener productos reales con stock bajo
    let productosStockBajo = await Product.find({ existencia: { $lte: 10 } })
      .limit(10)
      .select('referencia nombre tipo existencia costoUnitario')
      .lean();

    console.log(`📦 Productos con stock bajo encontrados: ${productosStockBajo.length}`);

    // Si no hay productos con stock bajo, usar datos de prueba
    if (productosStockBajo.length === 0) {
      console.log('⚠️ No hay productos con stock bajo, usando datos de prueba...');
      productosStockBajo = [
        {
          referencia: 'PRUEBA-001',
          nombre: 'Filtro de Aceite Premium',
          tipo: 'Repuesto',
          existencia: 2,
          costoUnitario: 1500
        },
        {
          referencia: 'PRUEBA-002',
          nombre: 'Cadena ASA 50 Simple',
          tipo: 'Cadena',
          existencia: 0,
          costoUnitario: 2500
        },
        {
          referencia: 'PRUEBA-003',
          nombre: 'Rodamiento Industrial',
          tipo: 'Repuesto',
          existencia: 5,
          costoUnitario: 3200
        },
        {
          referencia: 'PRUEBA-004',
          nombre: 'Correa de Transmisión',
          tipo: 'Repuesto',
          existencia: 8,
          costoUnitario: 1800
        }
      ];
    }

    // Enviar email de stock bajo
    console.log('📤 Enviando email de alerta de stock bajo...');
    const resultadoStock = await enviarAlertaStockBajo(productosStockBajo, destinatario, 4, 10);

    if (resultadoStock) {
      console.log('✅ Email de stock bajo enviado correctamente!');
    } else {
      console.log('❌ Error al enviar email de stock bajo');
    }

    // También enviar email de mantenimiento de prueba
    console.log('📤 Enviando email de alerta de mantenimiento...');
    const mantenimientosPrueba = [
      {
        equipo: 'Horno Industrial 1',
        producto: { nombre: 'Filtro de Aceite Premium' },
        fechaVencimiento: new Date(Date.now() + 24 * 60 * 60 * 1000) // Mañana
      },
      {
        equipo: 'Amasadora Principal',
        producto: { nombre: 'Cadena ASA 50 Simple' },
        fechaVencimiento: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    ];

    const resultadoMantenimiento = await enviarAlertaMantenimiento(mantenimientosPrueba, destinatario);

    if (resultadoMantenimiento) {
      console.log('✅ Email de mantenimiento enviado correctamente!');
    } else {
      console.log('❌ Error al enviar email de mantenimiento');
    }

    console.log('\n✅ Proceso completado!');
    console.log(`📬 Revisa el buzón de: ${destinatario}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Ejecutar
enviarPrueba();

