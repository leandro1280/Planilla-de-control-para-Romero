const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  tipo: {
    type: String,
    required: true,
    enum: ['producto_creado', 'producto_actualizado', 'movimiento_creado', 'usuario_creado'],
    index: true
  },
  mensaje: {
    type: String,
    required: true
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referencia: {
    type: String,
    required: false
  },
  leido: {
    type: Boolean,
    default: false,
    index: true
  },
  datos: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Índice compuesto para búsquedas rápidas
notificationSchema.index({ leido: 1, createdAt: -1 });
notificationSchema.index({ usuario: 1, leido: 1 });

module.exports = mongoose.model('Notification', notificationSchema);

