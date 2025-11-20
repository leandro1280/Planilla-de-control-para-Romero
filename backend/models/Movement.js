const mongoose = require('mongoose');

const movementSchema = new mongoose.Schema({
  referencia: {
    type: String,
    required: [true, 'La referencia es obligatoria'],
    trim: true,
    uppercase: true
  },
  tipo: {
    type: String,
    enum: {
      values: ['ingreso', 'egreso'],
      message: 'El tipo debe ser ingreso o egreso'
    },
    required: [true, 'El tipo es obligatorio']
  },
  cantidad: {
    type: Number,
    required: [true, 'La cantidad es obligatoria'],
    min: [1, 'La cantidad debe ser mayor a 0'],
    validate: {
      validator: Number.isInteger,
      message: 'La cantidad debe ser un número entero'
    }
  },
  costoUnitario: {
    type: Number,
    required: false,
    min: [0, 'El costo unitario no puede ser negativo'],
    default: null
  },
  costoTotal: {
    type: Number,
    required: false,
    min: [0, 'El costo total no puede ser negativo'],
    default: null
  },
  nota: {
    type: String,
    trim: true,
    maxlength: [500, 'La nota no puede exceder 500 caracteres']
  },
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tipoProducto: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Calcular costoTotal antes de guardar
movementSchema.pre('save', function(next) {
  if (this.costoUnitario !== null && this.costoUnitario !== undefined) {
    this.costoTotal = Math.round((this.costoUnitario * this.cantidad) * 100) / 100;
  } else {
    this.costoTotal = null;
  }
  next();
});

// Índices para búsquedas y reportes
movementSchema.index({ referencia: 1 });
movementSchema.index({ tipo: 1 });
movementSchema.index({ tipoProducto: 1 });
movementSchema.index({ createdAt: -1 });
movementSchema.index({ usuario: 1 });

module.exports = mongoose.model('Movement', movementSchema);

