require('dotenv').config();
const { enviarAlertaMantenimiento } = require('../services/servicioEmail');

const probarEmail = async () => {
    console.log('📧 Iniciando prueba de envío de correo...');

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('❌ Error: Faltan credenciales de correo en .env');
        return;
    }

    const destinatario = process.env.EMAIL_ALERT_TO || process.env.EMAIL_USER;
    console.log(`📨 Intentando enviar a: ${destinatario}`);

    // Datos de prueba simulando un mantenimiento que vence mañana
    const mantenimientosPrueba = [
        {
            equipo: 'Horno Rotativo (PRUEBA)',
            producto: { nombre: 'Pan Francés' },
            fechaVencimiento: new Date(Date.now() + 24 * 60 * 60 * 1000) // Mañana
        }
    ];

    const resultado = await enviarAlertaMantenimiento(mantenimientosPrueba, destinatario);

    if (resultado) {
        console.log('✅ ¡Correo enviado con éxito! Revisa tu bandeja de entrada.');
    } else {
        console.log('❌ Falló el envío del correo. Revisa la consola para ver el error.');
    }
};

probarEmail();
