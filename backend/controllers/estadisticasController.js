const Product = require('../models/Product');
const Movement = require('../models/Movement');
const Maintenance = require('../models/Maintenance');

// @desc    Obtener estadísticas avanzadas
// @route   GET /api/estadisticas/avanzadas
// @access  Private
exports.getEstadisticasAvanzadas = async (req, res) => {
  try {
    const { periodo = 'mes', fechaDesde, fechaHasta } = req.query;

    // Calcular fechas según el período
    let inicio, fin;
    const ahora = new Date();

    if (fechaDesde && fechaHasta) {
      inicio = new Date(fechaDesde);
      fin = new Date(fechaHasta);
      fin.setHours(23, 59, 59, 999);
    } else {
      switch (periodo) {
        case 'semana':
          inicio = new Date(ahora);
          inicio.setDate(ahora.getDate() - 7);
          break;
        case 'mes':
          inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
          break;
        case 'trimestre':
          inicio = new Date(ahora.getFullYear(), ahora.getMonth() - 2, 1);
          break;
        case 'año':
          inicio = new Date(ahora.getFullYear(), 0, 1);
          break;
        default:
          inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      }
      fin = ahora;
    }

    // 1. Tendencias de consumo (productos más consumidos)
    const movimientos = await Movement.find({
      tipo: 'egreso',
      createdAt: { $gte: inicio, $lte: fin }
    })
      .populate('producto', 'referencia nombre tipo')
      .lean();

    const consumoPorProducto = {};
    movimientos.forEach(mov => {
      const ref = mov.referencia;
      if (!consumoPorProducto[ref]) {
        consumoPorProducto[ref] = {
          referencia: ref,
          nombre: mov.producto?.nombre || ref,
          tipo: mov.producto?.tipo || 'Sin tipo',
          cantidadTotal: 0,
          valorTotal: 0,
          movimientos: 0
        };
      }
      consumoPorProducto[ref].cantidadTotal += mov.cantidad || 0;
      consumoPorProducto[ref].valorTotal += mov.costoTotal || 0;
      consumoPorProducto[ref].movimientos += 1;
    });

    const productosMasMovidos = Object.values(consumoPorProducto)
      .sort((a, b) => b.cantidadTotal - a.cantidadTotal)
      .slice(0, 10);

    // 2. Análisis de costos por período
    const ingresos = await Movement.find({
      tipo: 'ingreso',
      createdAt: { $gte: inicio, $lte: fin }
    }).lean();

    const egresos = await Movement.find({
      tipo: 'egreso',
      createdAt: { $gte: inicio, $lte: fin }
    }).lean();

    const inversionTotal = ingresos.reduce((sum, m) => sum + (m.costoTotal || 0), 0);
    const consumoTotal = egresos.reduce((sum, m) => sum + (m.costoTotal || 0), 0);
    const unidadesIngresadas = ingresos.reduce((sum, m) => sum + (m.cantidad || 0), 0);
    const unidadesConsumidas = egresos.reduce((sum, m) => sum + (m.cantidad || 0), 0);

    // Análisis mensual (últimos 12 meses)
    const analisisMensual = [];
    for (let i = 11; i >= 0; i--) {
      const fechaMes = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const finMes = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const ingresosMes = await Movement.countDocuments({
        tipo: 'ingreso',
        createdAt: { $gte: fechaMes, $lte: finMes }
      });

      const egresosMes = await Movement.countDocuments({
        tipo: 'egreso',
        createdAt: { $gte: fechaMes, $lte: finMes }
      });

      const inversionMes = ingresos
        .filter(m => {
          const fecha = new Date(m.createdAt);
          return fecha >= fechaMes && fecha <= finMes;
        })
        .reduce((sum, m) => sum + (m.costoTotal || 0), 0);

      const consumoMes = egresos
        .filter(m => {
          const fecha = new Date(m.createdAt);
          return fecha >= fechaMes && fecha <= finMes;
        })
        .reduce((sum, m) => sum + (m.costoTotal || 0), 0);

      analisisMensual.push({
        mes: fechaMes.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }),
        ingresos: ingresosMes,
        egresos: egresosMes,
        inversion: inversionMes,
        consumo: consumoMes
      });
    }

    // 3. Productos con mayor rotación (índice de rotación)
    const productosConRotacion = await Product.find({}).lean();
    const rotacion = productosConRotacion.map(producto => {
      const movimientosProducto = movimientos.filter(m => m.referencia === producto.referencia);
      const consumoTotal = movimientosProducto.reduce((sum, m) => sum + (m.cantidad || 0), 0);
      const stockPromedio = producto.existencia; // Simplificado
      const indiceRotacion = stockPromedio > 0 ? (consumoTotal / stockPromedio).toFixed(2) : 0;

      return {
        referencia: producto.referencia,
        nombre: producto.nombre,
        tipo: producto.tipo,
        stockActual: producto.existencia,
        consumoTotal,
        indiceRotacion: parseFloat(indiceRotacion)
      };
    })
      .filter(p => p.consumoTotal > 0)
      .sort((a, b) => b.indiceRotacion - a.indiceRotacion)
      .slice(0, 10);

    // 4. Tendencias por tipo de producto
    const tendenciasPorTipo = {};
    Object.values(consumoPorProducto).forEach(prod => {
      const tipo = prod.tipo || 'Sin tipo';
      if (!tendenciasPorTipo[tipo]) {
        tendenciasPorTipo[tipo] = {
          tipo,
          cantidadTotal: 0,
          valorTotal: 0,
          productos: 0
        };
      }
      tendenciasPorTipo[tipo].cantidadTotal += prod.cantidadTotal;
      tendenciasPorTipo[tipo].valorTotal += prod.valorTotal;
      tendenciasPorTipo[tipo].productos += 1;
    });

    res.json({
      success: true,
      data: {
        periodo: {
          inicio: inicio.toISOString(),
          fin: fin.toISOString()
        },
        productosMasMovidos,
        analisisCostos: {
          inversionTotal,
          consumoTotal,
          balance: inversionTotal - consumoTotal,
          unidadesIngresadas,
          unidadesConsumidas
        },
        analisisMensual,
        productosConMayorRotacion: rotacion,
        tendenciasPorTipo: Object.values(tendenciasPorTipo).sort((a, b) => b.cantidadTotal - a.cantidadTotal)
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas avanzadas:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Predicción de stock basada en consumo histórico
// @route   GET /api/estadisticas/prediccion-stock
// @access  Private
exports.getPrediccionStock = async (req, res) => {
  try {
    const { dias = 30 } = req.query;
    const diasPrediccion = parseInt(dias);

    // Obtener consumo de los últimos 90 días
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - 90);

    const movimientos = await Movement.find({
      tipo: 'egreso',
      createdAt: { $gte: fechaInicio }
    })
      .populate('producto', 'referencia nombre tipo existencia')
      .lean();

    // Calcular consumo promedio diario por producto
    const consumoPromedio = {};
    movimientos.forEach(mov => {
      const ref = mov.referencia;
      if (!consumoPromedio[ref]) {
        consumoPromedio[ref] = {
          referencia: ref,
          producto: mov.producto,
          totalConsumido: 0,
          diasConMovimiento: new Set()
        };
      }
      consumoPromedio[ref].totalConsumido += mov.cantidad || 0;
      const fecha = new Date(mov.createdAt);
      consumoPromedio[ref].diasConMovimiento.add(fecha.toDateString());
    });

    // Calcular predicciones
    const predicciones = Object.values(consumoPromedio).map(item => {
      const diasActivos = item.diasConMovimiento.size || 1;
      const consumoDiarioPromedio = item.totalConsumido / diasActivos;
      const stockActual = item.producto?.existencia || 0;
      const diasRestantes = stockActual > 0 && consumoDiarioPromedio > 0 
        ? Math.floor(stockActual / consumoDiarioPromedio) 
        : null;
      const stockEstimadoEnX = consumoDiarioPromedio * diasPrediccion;

      return {
        referencia: item.referencia,
        nombre: item.producto?.nombre || item.referencia,
        tipo: item.producto?.tipo || 'Sin tipo',
        stockActual,
        consumoDiarioPromedio: parseFloat(consumoDiarioPromedio.toFixed(2)),
        diasRestantesEstimados: diasRestantes,
        stockEstimadoEnXDias: parseFloat(stockEstimadoEnX.toFixed(2)),
        necesitaReposicion: diasRestantes !== null && diasRestantes < diasPrediccion,
        urgencia: diasRestantes === null ? 'sin_consumo' : 
                  diasRestantes < 7 ? 'critica' : 
                  diasRestantes < diasPrediccion ? 'alta' : 'normal'
      };
    })
      .sort((a, b) => {
        // Ordenar por urgencia y luego por días restantes
        const urgenciaOrder = { critica: 0, alta: 1, normal: 2, sin_consumo: 3 };
        if (urgenciaOrder[a.urgencia] !== urgenciaOrder[b.urgencia]) {
          return urgenciaOrder[a.urgencia] - urgenciaOrder[b.urgencia];
        }
        return (a.diasRestantesEstimados || Infinity) - (b.diasRestantesEstimados || Infinity);
      });

    res.json({
      success: true,
      data: {
        predicciones,
        diasPrediccion,
        fechaPrediccion: new Date(Date.now() + diasPrediccion * 24 * 60 * 60 * 1000).toISOString()
      }
    });
  } catch (error) {
    console.error('Error obteniendo predicción de stock:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

