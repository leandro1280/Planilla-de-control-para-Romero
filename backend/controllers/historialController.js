const Product = require('../models/Product');
const ProductHistory = require('../models/ProductHistory');
const RegistroAuditoria = require('../models/RegistroAuditoria');

// @desc    Obtener historial de cambios de un producto
// @route   GET /historial/productos/:id
// @access  Private
exports.getHistorialProducto = async (req, res) => {
  try {
    const productoId = req.params.id;

    // Verificar que el producto existe
    const producto = await Product.findById(productoId).lean();
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Obtener historial completo del producto
    const historial = await ProductHistory.find({ productoId })
      .populate('modificadoPor', 'nombre email')
      .sort({ version: -1 })
      .lean();

    // Obtener registros de auditoría relacionados
    const auditoria = await RegistroAuditoria.find({
      entidad: 'Producto',
      entidadId: productoId,
      accion: { $in: ['CREAR', 'MODIFICAR', 'ELIMINAR'] }
    })
      .populate('usuario', 'nombre email')
      .sort({ fecha: -1 })
      .limit(50)
      .lean();

    // Combinar y enriquecer datos
    const historialCompleto = historial.map((h, index) => {
      const siguiente = historial[index + 1]; // Versión anterior
      return {
        ...h,
        cambiosDetallados: calcularDiferencias(siguiente?.data || null, h.data)
      };
    });

    res.render('historial/producto', {
      title: `Historial - ${producto.referencia}`,
      currentPage: 'historial',
      producto,
      historial: historialCompleto,
      auditoria,
      usuario: {
        nombre: req.user.nombre,
        email: req.user.email,
        rol: req.user.rol
      }
    });
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al cargar el historial',
      layout: 'main'
    });
  }
};

// @desc    API: Obtener historial de cambios de un producto (JSON)
// @route   GET /api/historial/productos/:id
// @access  Private
exports.getHistorialProductoAPI = async (req, res) => {
  try {
    const productoId = req.params.id;

    const historial = await ProductHistory.find({ productoId })
      .populate('modificadoPor', 'nombre email')
      .sort({ version: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      data: historial
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper para calcular diferencias entre versiones
function calcularDiferencias(versionAnterior, versionNueva) {
  if (!versionAnterior) {
    return {
      esCreacion: true,
      cambios: Object.keys(versionNueva).map(campo => ({
        campo,
        valorAnterior: null,
        valorNuevo: versionNueva[campo],
        tipoCambio: 'creado'
      }))
    };
  }

  const cambios = [];
  const campos = ['nombre', 'equipo', 'existencia', 'detalle', 'tipo', 'costoUnitario', 'codigoFabricante'];

  campos.forEach(campo => {
    const anterior = versionAnterior[campo];
    const nuevo = versionNueva[campo];

    if (anterior !== nuevo && (anterior !== undefined || nuevo !== undefined)) {
      cambios.push({
        campo,
        valorAnterior: anterior !== undefined ? anterior : null,
        valorNuevo: nuevo !== undefined ? nuevo : null,
        tipoCambio: anterior === undefined ? 'agregado' : nuevo === undefined ? 'eliminado' : 'modificado'
      });
    }
  });

  return {
    esCreacion: false,
    cambios
  };
}

// Helper para guardar versión histórica (usado en middleware)
exports.guardarVersionProducto = async (producto, usuarioId, cambios, motivo = null) => {
  try {
    // Obtener última versión
    const ultimaVersion = await ProductHistory.findOne({ productoId: producto._id })
      .sort({ version: -1 })
      .lean();

    const nuevaVersion = (ultimaVersion?.version || 0) + 1;

    // Crear snapshot de datos
    const snapshot = {
      referencia: producto.referencia,
      nombre: producto.nombre,
      equipo: producto.equipo || null,
      existencia: producto.existencia || 0,
      detalle: producto.detalle || null,
      tipo: producto.tipo || null,
      costoUnitario: producto.costoUnitario || null,
      codigoFabricante: producto.codigoFabricante || null
    };

    await ProductHistory.create({
      productoId: producto._id,
      version: nuevaVersion,
      data: snapshot,
      modificadoPor: usuarioId,
      cambios: cambios || {},
      motivo: motivo || null
    });

    return true;
  } catch (error) {
    console.error('Error guardando versión histórica:', error);
    return false;
  }
};

