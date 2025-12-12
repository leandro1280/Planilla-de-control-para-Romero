const Movement = require('../models/Movement');
const Product = require('../models/Product');
const XLSX = require('xlsx');

// @desc    Obtener movimientos
// @route   GET /movimientos
// @access  Private
exports.getMovements = async (req, res) => {
  try {
    const { busqueda, tipo, tipoProducto, referencia, mes, anio } = req.query;
    
    const query = {};
    
    // Filtros
    if (busqueda) {
      query.$or = [
        { referencia: { $regex: busqueda, $options: 'i' } },
        { nota: { $regex: busqueda, $options: 'i' } }
      ];
    }
    
    if (tipo && tipo !== 'todos') {
      query.tipo = tipo;
    }
    
    if (tipoProducto && tipoProducto !== 'todos') {
      query.tipoProducto = tipoProducto;
    }
    
    if (referencia && referencia !== 'todos') {
      query.referencia = referencia.toUpperCase();
    }
    
    // Filtros por fecha (mes y año)
    if (mes || anio) {
      query.createdAt = {};
      
      if (anio) {
        const anioNum = parseInt(anio);
        const inicioAnio = new Date(anioNum, 0, 1);
        const finAnio = new Date(anioNum, 11, 31, 23, 59, 59, 999);
        
        if (mes) {
          // Filtro por mes y año específicos
          const mesNum = parseInt(mes) - 1; // Los meses en JS van de 0-11
          const inicioMes = new Date(anioNum, mesNum, 1);
          const finMes = new Date(anioNum, mesNum + 1, 0, 23, 59, 59, 999);
          query.createdAt.$gte = inicioMes;
          query.createdAt.$lte = finMes;
        } else {
          // Solo por año
          query.createdAt.$gte = inicioAnio;
          query.createdAt.$lte = finAnio;
        }
      } else if (mes) {
        // Solo por mes (del año actual)
        const fechaActual = new Date();
        const anioActual = fechaActual.getFullYear();
        const mesNum = parseInt(mes) - 1;
        const inicioMes = new Date(anioActual, mesNum, 1);
        const finMes = new Date(anioActual, mesNum + 1, 0, 23, 59, 59, 999);
        query.createdAt.$gte = inicioMes;
        query.createdAt.$lte = finMes;
      }
    }
    
    const movements = await Movement.find(query)
      .populate('producto', 'nombre tipo')
      .populate('usuario', 'nombre email')
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();
    
    // Obtener productos y tipos para filtros
    const products = await Product.find().sort({ referencia: 1 });
    const tipos = [...new Set(products.map(p => p.tipo).filter(Boolean))].sort();
    const referencias = [...new Set(products.map(p => p.referencia))].sort();
    
    // Calcular estadísticas
    const stats = calculateStats(movements);
    
    // Obtener años disponibles de movimientos
    const añosDisponibles = await Movement.aggregate([
      {
        $group: {
          _id: { $year: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);
    const años = añosDisponibles.map(a => a._id.toString()).sort((a, b) => parseInt(b) - parseInt(a));
    
    res.render('movimientos/index', {
      currentPage: 'movimientos',
      usuario: {
        nombre: req.user.nombre,
        email: req.user.email,
        rol: req.user.rol
      },
      title: 'Movimientos - Romero Panificados',
      currentPage: 'movimientos',
      usuario: {
        _id: req.user._id,
        nombre: req.user.nombre,
        email: req.user.email,
        rol: req.user.rol
      },
      movements: movements || [],
      products,
      tipos,
      referencias,
      stats,
      busqueda: busqueda || '',
      tipoFiltro: tipo || 'todos',
      tipoProductoFiltro: tipoProducto || 'todos',
      referenciaFiltro: referencia || 'todos',
      mesFiltro: mes || '',
      anioFiltro: anio || '',
      años: años || [],
      meses: [
        { value: '1', label: 'Enero' },
        { value: '2', label: 'Febrero' },
        { value: '3', label: 'Marzo' },
        { value: '4', label: 'Abril' },
        { value: '5', label: 'Mayo' },
        { value: '6', label: 'Junio' },
        { value: '7', label: 'Julio' },
        { value: '8', label: 'Agosto' },
        { value: '9', label: 'Septiembre' },
        { value: '10', label: 'Octubre' },
        { value: '11', label: 'Noviembre' },
        { value: '12', label: 'Diciembre' }
      ]
    });
  } catch (error) {
    res.status(500).render('error', {
      title: 'Error',
      message: error.message
    });
  }
};

// @desc    Descargar planilla Excel
// @route   GET /movimientos/descargar
// @access  Private
exports.downloadMovements = async (req, res) => {
  try {
    const { formato, tipo, tipoProducto, referencia, desde, hasta } = req.query;
    
    const query = {};
    
    if (tipo && tipo !== 'todos') {
      query.tipo = tipo;
    }
    
    if (tipoProducto && tipoProducto !== 'todos') {
      query.tipoProducto = tipoProducto;
    }
    
    if (referencia && referencia !== 'todos') {
      query.referencia = referencia.toUpperCase();
    }
    
    if (desde || hasta) {
      query.createdAt = {};
      if (desde) query.createdAt.$gte = new Date(desde);
      if (hasta) query.createdAt.$lte = new Date(hasta);
    }
    
    const movements = await Movement.find(query)
      .populate('producto', 'nombre tipo equipo')
      .populate('usuario', 'nombre email')
      .sort({ createdAt: -1 });
    
    // Preparar datos para Excel
    const datos = movements.map(mov => ({
      'Fecha': new Date(mov.createdAt).toLocaleString('es-AR'),
      'Referencia': mov.referencia,
      'Producto': mov.producto?.nombre || '-',
      'Tipo': mov.tipo,
      'Cantidad': mov.cantidad,
      'Costo Unitario': mov.costoUnitario !== null && mov.costoUnitario !== undefined ? mov.costoUnitario : '-',
      'Costo Total': mov.costoTotal !== null && mov.costoTotal !== undefined ? mov.costoTotal : '-',
      'Tipo Producto': mov.tipoProducto || '-',
      'Equipo': mov.producto?.equipo || '-',
      'Nota': mov.nota || '-',
      'Usuario': mov.usuario?.nombre || '-'
    }));
    
    // Crear workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datos);
    
    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 20 }, // Fecha
      { wch: 15 }, // Referencia
      { wch: 30 }, // Producto
      { wch: 10 }, // Tipo
      { wch: 10 }, // Cantidad
      { wch: 15 }, // Costo Unitario
      { wch: 15 }, // Costo Total
      { wch: 15 }, // Tipo Producto
      { wch: 20 }, // Equipo
      { wch: 30 }, // Nota
      { wch: 20 }  // Usuario
    ];
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
    
    // Generar buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    // Enviar archivo
    const fecha = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=movimientos_${fecha}.xlsx`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Función auxiliar para calcular estadísticas
function calculateStats(movements) {
  const ingresos = movements.filter(m => m.tipo === 'ingreso');
  const egresos = movements.filter(m => m.tipo === 'egreso');
  
  const totalIngresos = ingresos.reduce((acc, m) => acc + m.cantidad, 0);
  const totalEgresos = egresos.reduce((acc, m) => acc + m.cantidad, 0);
  
  const totalInvertido = ingresos.reduce((acc, m) => acc + (m.costoTotal || 0), 0);
  const totalConsumido = egresos.reduce((acc, m) => acc + (m.costoTotal || 0), 0);
  
  // Agrupar por tipo de producto
  const porTipo = {};
  movements.forEach(mov => {
    const tipo = mov.tipoProducto || 'Sin tipo';
    if (!porTipo[tipo]) {
      porTipo[tipo] = { ingresos: 0, egresos: 0, invertido: 0, consumido: 0 };
    }
    if (mov.tipo === 'ingreso') {
      porTipo[tipo].ingresos += mov.cantidad;
      porTipo[tipo].invertido += (mov.costoTotal || 0);
    } else {
      porTipo[tipo].egresos += mov.cantidad;
      porTipo[tipo].consumido += (mov.costoTotal || 0);
    }
  });
  
  // Top egresos por referencia
  const egresosPorRef = {};
  egresos.forEach(e => {
    if (!egresosPorRef[e.referencia]) {
      egresosPorRef[e.referencia] = 0;
    }
    egresosPorRef[e.referencia] += e.cantidad;
  });
  
  const topEgresos = Object.entries(egresosPorRef)
    .map(([ref, cantidad]) => ({ referencia: ref, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 10);
  
  return {
    totalIngresos,
    totalEgresos,
    totalInvertido,
    totalConsumido,
    porTipo,
    topEgresos: topEgresos
  };
}

