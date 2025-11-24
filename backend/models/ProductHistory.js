const mongoose = require('mongoose');

// Modelo para guardar versiones históricas de productos
const productHistorySchema = new mongoose.Schema({
  productoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  version: {
    type: Number,
    required: true
  },
  // Snapshots de todos los campos del producto
  data: {
    referencia: String,
    nombre: String,
    equipo: String,
    existencia: Number,
    detalle: String,
    tipo: String,
    costoUnitario: Number,
    codigoFabricante: String
  },
  // Quién hizo el cambio
  modificadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Qué cambió específicamente
  cambios: {
    type: mongoose.Schema.Types.Mixed,
    // Ejemplo: { existencia: { anterior: 10, nuevo: 15 }, nombre: { anterior: 'X', nuevo: 'Y' } }
  },
  // Motivo del cambio (opcional)
  motivo: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Índices
productHistorySchema.index({ productoId: 1, version: -1 });
productHistorySchema.index({ modificadoPor: 1, createdAt: -1 });

module.exports = mongoose.model('ProductHistory', productHistorySchema);

