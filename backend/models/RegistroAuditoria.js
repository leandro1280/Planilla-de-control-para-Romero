const mongoose = require('mongoose');

const RegistroAuditoriaSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    accion: {
        type: String,
        required: true,
        enum: ['CREAR', 'MODIFICAR', 'ELIMINAR', 'LOGIN', 'LOGOUT', 'OTRO']
    },
    entidad: {
        type: String,
        required: true,
        // Ej: 'Producto', 'Mantenimiento', 'Usuario'
    },
    entidadId: {
        type: mongoose.Schema.Types.ObjectId,
        // No es required porque puede ser una acción general (ej. login)
    },
    detalles: {
        type: mongoose.Schema.Types.Mixed,
        // Aquí guardaremos qué cambió (ej: { stockAnterior: 10, stockNuevo: 5 })
    },
    ip: {
        type: String
    },
    fecha: {
        type: Date,
        default: Date.now
    }
});

// Índices para búsquedas rápidas
RegistroAuditoriaSchema.index({ usuario: 1, fecha: -1 });
RegistroAuditoriaSchema.index({ entidad: 1, entidadId: 1 });

module.exports = mongoose.model('RegistroAuditoria', RegistroAuditoriaSchema);
