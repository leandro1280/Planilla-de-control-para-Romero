const Product = require('../models/Product');
const Movement = require('../models/Movement');
const User = require('../models/User');
const Maintenance = require('../models/Maintenance');
const Machine = require('../models/Machine');

const { checkUpcomingMaintenances } = require('./maintenanceController');

// @desc    Renderizar dashboard
// @route   GET /dashboard
// @access  Private
exports.renderDashboard = async (req, res) => {
  try {
    // Verificar notificaciones de mantenimiento
    await checkUpcomingMaintenances();

    const usuario = req.user;

    // Estadísticas rápidas
    const totalProductos = await Product.countDocuments();
    const productosCriticos = await Product.countDocuments({ existencia: { $lte: 4 } });
    const productosBajoStock = await Product.countDocuments({ existencia: { $lt: 10, $gt: 4 } });

    // Movimientos recientes
    const movimientosRecientes = await Movement.find()
      .populate('usuario', 'nombre email')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Productos con stock crítico
    const productosCriticosLista = await Product.find({ existencia: { $lte: 4 } })
      .sort({ existencia: 1 })
      .limit(10)
      .lean();

    // Próximos mantenimientos (activos, ordenados por fecha de vencimiento)
    const proximosMantenimientos = await Maintenance.find({ estado: 'activo' })
      .populate('producto', 'nombre referencia')
      .populate('tecnico', 'nombre email')
      .sort({ fechaVencimiento: 1 })
      .limit(10)
      .lean();

    // Mantenimientos vencidos (fechaVencimiento en el pasado)
    const ahora = new Date();
    const mantenimientosVencidos = await Maintenance.find({
      estado: 'activo',
      fechaVencimiento: { $lt: ahora }
    })
      .populate('producto', 'nombre referencia')
      .populate('tecnico', 'nombre email')
      .sort({ fechaVencimiento: 1 })
      .limit(10)
      .lean();

    // Mantenimientos próximos a vencer (próximos 7 días)
    const en7Dias = new Date();
    en7Dias.setDate(en7Dias.getDate() + 7);
    const mantenimientosProximos = await Maintenance.find({
      estado: 'activo',
      fechaVencimiento: { $gte: ahora, $lte: en7Dias }
    })
      .populate('producto', 'nombre referencia')
      .populate('tecnico', 'nombre email')
      .sort({ fechaVencimiento: 1 })
      .lean();

    // Estadísticas de movimientos del mes
    const fechaInicioMes = new Date();
    fechaInicioMes.setDate(1);
    fechaInicioMes.setHours(0, 0, 0, 0);

    const movimientosMes = await Movement.find({
      createdAt: { $gte: fechaInicioMes }
    }).lean();

    const ingresosMes = movimientosMes
      .filter(m => m.tipo === 'ingreso')
      .reduce((acc, m) => acc + m.cantidad, 0);

    const egresosMes = movimientosMes
      .filter(m => m.tipo === 'egreso')
      .reduce((acc, m) => acc + m.cantidad, 0);

    // Tipos de productos más utilizados
    const productosConTipo = await Product.find({ tipo: { $exists: true, $ne: '' } }).lean();
    const tiposContador = {};
    productosConTipo.forEach(p => {
      if (p.tipo) {
        tiposContador[p.tipo] = (tiposContador[p.tipo] || 0) + 1;
      }
    });

    // Estadísticas mensuales de los últimos 6 meses (para comparativas)
    const estadisticasMensuales = [];
    for (let i = 5; i >= 0; i--) {
      const fechaMes = new Date();
      fechaMes.setMonth(fechaMes.getMonth() - i);
      fechaMes.setDate(1);
      fechaMes.setHours(0, 0, 0, 0);
      const finMes = new Date(fechaMes);
      finMes.setMonth(finMes.getMonth() + 1);
      finMes.setDate(0);
      finMes.setHours(23, 59, 59, 999);

      const movimientosMesAnterior = await Movement.find({
        createdAt: { $gte: fechaMes, $lte: finMes }
      }).lean();

      const ingresosMesAnterior = movimientosMesAnterior
        .filter(m => m.tipo === 'ingreso')
        .reduce((acc, m) => acc + m.cantidad, 0);
      const egresosMesAnterior = movimientosMesAnterior
        .filter(m => m.tipo === 'egreso')
        .reduce((acc, m) => acc + m.cantidad, 0);
      const inversionMesAnterior = movimientosMesAnterior
        .filter(m => m.tipo === 'ingreso')
        .reduce((acc, m) => acc + (m.costoTotal || 0), 0);
      const consumoMesAnterior = movimientosMesAnterior
        .filter(m => m.tipo === 'egreso')
        .reduce((acc, m) => acc + (m.costoTotal || 0), 0);

      estadisticasMensuales.push({
        mes: fechaMes.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }),
        ingresos: ingresosMesAnterior,
        egresos: egresosMesAnterior,
        inversion: inversionMesAnterior,
        consumo: consumoMesAnterior
      });
    }

    // Calcular tendencias (comparar mes actual con mes anterior)
    const mesAnterior = estadisticasMensuales[estadisticasMensuales.length - 2] || {};
    const mesActual = estadisticasMensuales[estadisticasMensuales.length - 1] || {};
    const tendencias = {
      ingresos: mesAnterior.ingresos ? 
        ((mesActual.ingresos - mesAnterior.ingresos) / mesAnterior.ingresos * 100).toFixed(1) : 0,
      egresos: mesAnterior.egresos ? 
        ((mesActual.egresos - mesAnterior.egresos) / mesAnterior.egresos * 100).toFixed(1) : 0,
      inversion: mesAnterior.inversion ? 
        ((mesActual.inversion - mesAnterior.inversion) / mesAnterior.inversion * 100).toFixed(1) : 0,
      consumo: mesAnterior.consumo ? 
        ((mesActual.consumo - mesAnterior.consumo) / mesAnterior.consumo * 100).toFixed(1) : 0
    };

    // Obtener productos y máquinas para QR codes (últimos 20)
    const productosParaQR = await Product.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .select('referencia nombre')
      .lean();

    const maquinasParaQR = await Machine.find({ activo: true })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('codigo nombre')
      .lean();

    res.render('dashboard/index', {
      title: 'Dashboard - Sistema de Gestión Interna',
      currentPage: 'dashboard',
      usuario: {
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      },
      stats: {
        totalProductos,
        productosCriticos,
        productosBajoStock,
        ingresosMes,
        egresosMes,
        tiposContador
      },
      estadisticasMensuales,
      tendencias,
      movimientosRecientes,
      productosCriticosLista,
      proximosMantenimientos,
      mantenimientosVencidos,
      mantenimientosProximos,
      productosParaQR,
      maquinasParaQR
    });
  } catch (error) {
    console.error('Error renderizando dashboard:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al cargar el dashboard',
      layout: 'main'
    });
  }
};

