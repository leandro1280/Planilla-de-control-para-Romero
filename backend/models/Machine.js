const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: [true, 'El código de la máquina es obligatorio'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [100, 'El código no puede exceder 100 caracteres']
  },
  nombre: {
    type: String,
    required: [true, 'El nombre de la máquina es obligatorio'],
    trim: true,
    maxlength: [200, 'El nombre no puede exceder 200 caracteres']
  },
  descripcion: {
    type: String,
    trim: true,
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
  },
  ubicacion: {
    type: String,
    trim: true,
    maxlength: [200, 'La ubicación no puede exceder 200 caracteres']
  },
  marca: {
    type: String,
    trim: true,
    maxlength: [100, 'La marca no puede exceder 100 caracteres']
  },
  modelo: {
    type: String,
    trim: true,
    maxlength: [100, 'El modelo no puede exceder 100 caracteres']
  },
  numeroSerie: {
    type: String,
    trim: true,
    maxlength: [200, 'El número de serie no puede exceder 200 caracteres']
  },
  // Repuestos que utiliza esta máquina
  repuestos: [{
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    cantidadRequerida: {
      type: Number,
      min: [1, 'La cantidad requerida debe ser al menos 1'],
      default: 1
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [500, 'La descripción del repuesto no puede exceder 500 caracteres']
    }
  }],
  // Mantenimientos programados
  mantenimientosProgramados: [{
    tipo: {
      type: String,
      enum: ['preventivo', 'correctivo', 'instalacion'],
      default: 'preventivo'
    },
    frecuencia: {
      tipo: {
        type: String,
        enum: ['horas', 'dias', 'semanas', 'meses'],
        default: 'dias'
      },
      valor: {
        type: Number,
        min: [1, 'El valor de frecuencia debe ser al menos 1'],
        default: 30
      }
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [500, 'La descripción no puede exceder 500 caracteres']
    }
  }],
  activo: {
    type: Boolean,
    default: true
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

// Índices para búsquedas
machineSchema.index({ codigo: 1 });
machineSchema.index({ nombre: 1 });
machineSchema.index({ ubicacion: 1 });
machineSchema.index({ activo: 1 });

// Método para generar URL del QR
machineSchema.methods.getQRUrl = function() {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  return `${baseUrl}/maquinas/qr/${this.codigo}`;
};

// Método virtual para obtener el código QR
machineSchema.virtual('qrCode').get(function() {
  return this.codigo;
});

// Asegurar que los virtuals se incluyan en JSON
machineSchema.set('toJSON', { virtuals: true });
machineSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Machine', machineSchema);

