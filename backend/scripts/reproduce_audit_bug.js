require('dotenv').config();
const mongoose = require('mongoose');
const RegistroAuditoria = require('../models/RegistroAuditoria');

async function reproduce() {
    try {
        console.log('🔌 Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado');

        console.log('📝 Intentando guardar registro de auditoría sin usuario (simulando fallo)...');

        const log = new RegistroAuditoria({
            accion: 'LOGIN',
            entidad: 'Usuario',
            // usuario: null, // Intencionalmente omitido o null
            ip: '127.0.0.1',
            detalles: { intento: 'fallido' }
        });

        await log.save();
        console.log('✅ Registro guardado exitosamente (Inesperado si el bug existe)');
    } catch (error) {
        console.log('❌ Error esperado al guardar:', error.message);
        if (error.errors && error.errors.usuario) {
            console.log('   👉 Causa: El campo "usuario" es requerido.');
        }
    } finally {
        await mongoose.disconnect();
    }
}

reproduce();
