const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  referencia: {
    type: String,
    required: [true, 'La referencia es obligatoria'],
    unique: true, // unique ya crea un índice automáticamente
    trim: true,
    uppercase: true,
    maxlength: [100, 'La referencia no puede exceder 100 caracteres']
  },
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [200, 'El nombre no puede exceder 200 caracteres']
  },
  equipo: {
    type: String,
    trim: true,
    maxlength: [200, 'El equipo no puede exceder 200 caracteres']
  },
  existencia: {
    type: Number,
    required: [true, 'La existencia es obligatoria'],
    min: [0, 'La existencia no puede ser negativa'],
    default: 0
  },
  detalle: {
    type: String,
    trim: true,
    maxlength: [500, 'El detalle no puede exceder 500 caracteres']
  },
  tipo: {
    type: String,
    trim: true,
    maxlength: [50, 'El tipo no puede exceder 50 caracteres']
  },
  costoUnitario: {
    type: Number,
    min: [0, 'El costo unitario no puede ser negativo'],
    default: 0
  },
  codigoFabricante: {
    type: String,
    trim: true,
    maxlength: [200, 'El código de fabricante no puede exceder 200 caracteres'],
    default: null
  },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actualizadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Índices para búsquedas rápidas (referencia ya tiene índice único, no duplicar)
productSchema.index({ tipo: 1 });
productSchema.index({ existencia: 1 });

module.exports = mongoose.model('Product', productSchema);

