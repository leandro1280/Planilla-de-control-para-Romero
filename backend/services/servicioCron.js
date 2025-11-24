const cron = require('node-cron');
const Maintenance = require('../models/Maintenance');
const { enviarAlertaMantenimiento } = require('./servicioEmail');

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
    } catch (error) {
        console.error('❌ Error iniciando tareas programadas:', error.message);
        // No lanzar el error para que el servidor siga funcionando
    }
};

module.exports = {
    iniciarTareasProgramadas
};
