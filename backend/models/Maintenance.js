const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  referencia: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  tipo: {
    type: String,
    enum: {
      values: ['preventivo', 'correctivo', 'instalacion'],
      message: 'El tipo debe ser preventivo, correctivo o instalacion'
    },
    required: true,
    default: 'preventivo'
  },
  equipo: {
    type: String,
    trim: true,
    maxlength: [200, 'El equipo no puede exceder 200 caracteres']
  },
  fechaInstalacion: {
    type: Date,
    required: true,
    default: Date.now
  },
  fechaVencimiento: {
    type: Date,
    required: false
  },
  horasVidaUtil: {
    type: Number,
    min: [0, 'Las horas de vida útil no pueden ser negativas'],
    default: null
  },
  tipoFrecuencia: {
    type: String,
    enum: {
      values: ['horas', 'fecha'],
      message: 'El tipo de frecuencia debe ser horas o fecha'
    },
    default: 'horas'
  },
  intervaloDias: {
    type: Number,
    min: [1, 'El intervalo debe ser al menos 1 día'],
    required: false
  },
  observaciones: {
    type: String,
    trim: true,
    maxlength: [1000, 'Las observaciones no pueden exceder 1000 caracteres']
  },
  tecnico: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  costo: {
    type: Number,
    min: [0, 'El costo no puede ser negativo'],
    default: null
  },
  estado: {
    type: String,
    enum: {
      values: ['activo', 'completado', 'cancelado'],
      message: 'El estado debe ser activo, completado o cancelado'
    },
    default: 'activo'
  }
}, {
  timestamps: true
});

// Índices para búsquedas
maintenanceSchema.index({ producto: 1 });
maintenanceSchema.index({ referencia: 1 });
maintenanceSchema.index({ equipo: 1 });
maintenanceSchema.index({ fechaInstalacion: -1 });
maintenanceSchema.index({ estado: 1 });
maintenanceSchema.index({ tecnico: 1 });

module.exports = mongoose.model('Maintenance', maintenanceSchema);

