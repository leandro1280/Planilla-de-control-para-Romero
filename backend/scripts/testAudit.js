require('dotenv').config();
const mongoose = require('mongoose');
const RegistroAuditoria = require('../models/RegistroAuditoria');
const connectDB = require('../config/database');

const verificarAuditoria = async () => {
    try {
        await connectDB();

        console.log('🔍 Buscando últimos registros de auditoría...');

        const logs = await RegistroAuditoria.find()
            .sort({ fecha: -1 })
            .limit(5)
            .populate('usuario', 'nombre email');

        if (logs.length === 0) {
            console.log('⚠️ No hay registros de auditoría aún. (Esto es normal si no has usado el sistema todavía)');
        } else {
            console.log(`✅ Se encontraron ${logs.length} registros recientes:`);
            logs.forEach(log => {
                console.log('------------------------------------------------');
                console.log(`📅 Fecha: ${log.fecha.toLocaleString()}`);
                console.log(`👤 Usuario: ${log.usuario ? log.usuario.nombre : 'Desconocido'}`);
                console.log(`action Acción: ${log.accion} en ${log.entidad}`);
                console.log(`📝 Detalles:`, JSON.stringify(log.detalles, null, 2));
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error verificando auditoría:', error);
        process.exit(1);
    }
};

verificarAuditoria();
