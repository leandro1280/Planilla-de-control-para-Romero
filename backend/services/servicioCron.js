const cron = require('node-cron');
const Maintenance = require('../models/Maintenance');
const Product = require('../models/Product');
const { enviarAlertaMantenimiento, enviarAlertaStockBajo } = require('./servicioEmail');

/**
 * Inicializa las tareas programadas del sistema
 */
const iniciarTareasProgramadas = () => {
    try {
        console.log('⏰ Iniciando servicio de tareas programadas (Cron)...');

        // Tarea: Verificar mantenimientos que vencen mañana
        // Se ejecuta todos los días a las 08:00 AM
        cron.schedule('0 8 * * *', async () => {
            console.log('🔍 Ejecutando verificación diaria de mantenimientos...');
            try {
                // Verificar si MongoDB está conectado
                const mongoose = require('mongoose');
                if (mongoose.connection.readyState !== 1) {
                    console.warn('⚠️ MongoDB no está conectado, saltando tarea programada');
                    return;
                }

                const hoy = new Date();
                const manana = new Date(hoy);
                manana.setDate(hoy.getDate() + 1);

                // Ajustar al inicio y fin del día de mañana para buscar en ese rango
                manana.setHours(0, 0, 0, 0);
                const finManana = new Date(manana);
                finManana.setHours(23, 59, 59, 999);

                // Buscar mantenimientos activos que venzan mañana (con timeout)
                const mantenimientosPorVencer = await Promise.race([
                    Maintenance.find({
                        estado: 'activo',
                        fechaVencimiento: {
                            $gte: manana,
                            $lte: finManana
                        }
                    }).populate('producto', 'nombre').lean(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout en búsqueda de mantenimientos')), 5000)
                    )
                ]);

                if (mantenimientosPorVencer.length > 0) {
                    console.log(`⚠️ Se encontraron ${mantenimientosPorVencer.length} mantenimientos que vencen mañana.`);

                    // Enviar correo al administrador (o al correo configurado)
                    // NOTA: El destinatario debería venir de la configuración o de los usuarios admin
                    const destinatario = process.env.EMAIL_ALERT_TO || process.env.EMAIL_USER;

                    if (destinatario) {
                        await enviarAlertaMantenimiento(mantenimientosPorVencer, destinatario);
                    } else {
                        console.warn('⚠️ No hay destinatario configurado para alertas (EMAIL_ALERT_TO).');
                    }
                } else {
                    console.log('✅ No hay mantenimientos que venzan mañana.');
                }

            } catch (error) {
                console.error('❌ Error en la tarea programada de mantenimientos:', error.message);
                // No lanzar el error para que no afecte el servidor
            }
        });

        // Tarea: Verificar stock bajo y enviar alertas
        // Se ejecuta todos los días a las 09:00 AM
        cron.schedule('0 9 * * *', async () => {
            console.log('🔍 Ejecutando verificación diaria de stock bajo...');
            try {
                // Verificar si MongoDB está conectado
                const mongoose = require('mongoose');
                if (mongoose.connection.readyState !== 1) {
                    console.warn('⚠️ MongoDB no está conectado, saltando verificación de stock');
                    return;
                }

                // Umbrales configurables desde .env (default: 4 crítico, 10 bajo)
                const umbralCritico = parseInt(process.env.STOCK_UMBRAL_CRITICO || '4');
                const umbralBajo = parseInt(process.env.STOCK_UMBRAL_BAJO || '10');

                // Buscar productos con stock bajo (con timeout)
                const productosStockBajo = await Promise.race([
                    Product.find({
                        existencia: { $lt: umbralBajo }
                    }).select('referencia nombre tipo existencia costoUnitario').lean(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout en búsqueda de productos')), 5000)
                    )
                ]);

                if (productosStockBajo.length > 0) {
                    console.log(`⚠️ Se encontraron ${productosStockBajo.length} productos con stock bajo.`);

                    // Enviar correo al administrador (o al correo configurado)
                    const destinatario = process.env.EMAIL_ALERT_TO || process.env.EMAIL_USER;

                    if (destinatario) {
                        await enviarAlertaStockBajo(productosStockBajo, destinatario, umbralCritico, umbralBajo);
                    } else {
                        console.warn('⚠️ No hay destinatario configurado para alertas (EMAIL_ALERT_TO).');
                    }
                } else {
                    console.log('✅ No hay productos con stock bajo.');
                }

            } catch (error) {
                console.error('❌ Error en la tarea programada de stock:', error.message);
                // No lanzar el error para que no afecte el servidor
            }
        });

        // Tarea: Backup automático diario
        // Se ejecuta todos los días a las 2:00 AM
        cron.schedule('0 2 * * *', async () => {
            console.log('🔄 Ejecutando backup automático diario...');
            try {
                const mongoose = require('mongoose');
                if (mongoose.connection.readyState !== 1) {
                    console.warn('⚠️ MongoDB no está conectado, saltando backup');
                    return;
                }

                // Ejecutar script de backup en un proceso separado
                const { exec } = require('child_process');
                const path = require('path');
                const backupScript = path.join(__dirname, '../scripts/backup.js');
                
                exec(`node "${backupScript}"`, (error, stdout, stderr) => {
                    if (error) {
                        console.error('❌ Error ejecutando backup automático:', error.message);
                        return;
                    }
                    if (stderr) {
                        console.error('⚠️ Advertencias en backup:', stderr);
                    }
                    console.log('✅ Backup automático completado');
                    console.log(stdout);
                });
            } catch (error) {
                console.error('❌ Error en backup automático:', error.message);
                // No lanzar el error para que no afecte el servidor
            }
        });
    } catch (error) {
        console.error('❌ Error iniciando tareas programadas:', error.message);
        // No lanzar el error para que el servidor siga funcionando
    }
};

module.exports = {
    iniciarTareasProgramadas
};
