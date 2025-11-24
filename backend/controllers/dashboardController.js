const Product = require('../models/Product');
const Movement = require('../models/Movement');
const User = require('../models/User');
const Maintenance = require('../models/Maintenance');

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
      movimientosRecientes,
      productosCriticosLista,
      proximosMantenimientos,
      mantenimientosVencidos,
      mantenimientosProximos
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

