const Maintenance = require('../models/Maintenance');
const Product = require('../models/Product');
const { createNotificationForAdmins } = require('./notificationController');

// @desc    Obtener productos para el formulario
// @route   GET /mantenimientos/productos
// @access  Private
exports.getProductsForMaintenance = async (req, res) => {
  try {
    const productos = await Product.find({ existencia: { $gt: 0 } })
      .sort({ referencia: 1 })
      .select('referencia nombre tipo existencia')
      .lean();

    res.json({
      success: true,
      productos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos'
    });
  }
};

// @desc    Obtener todos los mantenimientos
// @route   GET /mantenimientos
// @access  Private
exports.getMaintenances = async (req, res) => {
  try {
    const { estado, equipo, referencia, pagina = 1, porPagina = 20 } = req.query;
    const paginaActual = parseInt(pagina);
    const limite = parseInt(porPagina);
    const salto = (paginaActual - 1) * limite;

    const query = {};

    // Filtro por estado
    if (estado && estado !== 'todos') {
      query.estado = estado;
    }

    // Filtro por equipo
    if (equipo && equipo.trim() !== '') {
      query.equipo = { $regex: equipo, $options: 'i' };
    }

    // Filtro por referencia
    if (referencia && referencia.trim() !== '') {
      query.referencia = { $regex: referencia, $options: 'i' };
    }

    // Contar total de mantenimientos con los filtros aplicados
    const totalMaintenances = await Maintenance.countDocuments(query);
    const totalPaginas = Math.ceil(totalMaintenances / limite);

    // Obtener mantenimientos paginados
    const maintenances = await Maintenance.find(query)
      .populate('producto', 'referencia nombre tipo existencia')
      .populate('tecnico', 'nombre email')
      .sort({ fechaInstalacion: -1 })
      .skip(salto)
      .limit(limite)
      .lean();

    // Obtener equipos únicos para el filtro
    const equipos = await Maintenance.distinct('equipo').lean();
    const equiposFiltrados = equipos.filter(e => e && e.trim() !== '').sort();

    // Obtener TODOS los productos para el formulario (mostrar todos, marcar los sin stock)
    const productos = await Product.find({})
      .sort({ referencia: 1 })
      .select('referencia nombre tipo existencia')
      .lean();

    res.render('mantenimientos/index', {
      title: 'Mantenimientos Preventivos - Romero Panificados',
      currentPage: 'mantenimientos',
      usuario: {
        _id: req.user._id,
        nombre: req.user.nombre,
        email: req.user.email,
        rol: req.user.rol
      },
      maintenances,
      productos,
      equipos: equiposFiltrados,
      paginaActual,
      totalPaginas,
      totalMaintenances,
      estadoFiltro: estado || 'todos',
      equipoFiltro: equipo || '',
      referenciaFiltro: referencia || ''
    });
  } catch (error) {
    console.error('Error al obtener mantenimientos:', error);
    res.status(500).render('error', {
      message: 'Error al cargar los mantenimientos',
      error: req.app.get('env') === 'development' ? error : {}
    });
  }
};

// @desc    Crear nuevo mantenimiento
// @route   POST /mantenimientos
// @access  Private (administrador, visor)
exports.createMaintenance = async (req, res) => {
  try {
    const {
      productoId,
      tipo,
      equipo,
      fechaInstalacion,
      fechaVencimiento,
      horasVidaUtil,
      observaciones,
      costo
    } = req.body;

    // Validar que el producto existe
    const producto = await Product.findById(productoId);
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Si no hay stock, permitir igual pero no descontar
    const tieneStock = producto.existencia > 0;

    // Crear el mantenimiento
    const maintenanceData = {
      producto: productoId,
      referencia: producto.referencia.toUpperCase().trim(),
      tipo: tipo || 'preventivo',
      equipo: equipo ? equipo.trim() : '',
      fechaInstalacion: fechaInstalacion ? new Date(fechaInstalacion) : new Date(),
      fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
      horasVidaUtil: horasVidaUtil ? parseInt(horasVidaUtil) : null,
      observaciones: observaciones ? observaciones.trim() : '',
      tecnico: req.user._id,
      costo: costo ? parseFloat(costo) : null,
      estado: 'activo'
    };

    const maintenance = await Maintenance.create(maintenanceData);

    // Descontar 1 unidad del stock del producto solo si tiene stock
    if (tieneStock) {
      producto.existencia -= 1;
      await producto.save();
    }

    // Crear notificación para administradores
    await createNotificationForAdmins(
      'Nuevo mantenimiento registrado',
      `Se instaló ${producto.referencia} - ${producto.nombre} en ${equipo || 'equipo no especificado'}`,
      req.user._id
    );

    const mensaje = tieneStock 
      ? 'Mantenimiento registrado correctamente. Stock descontado automáticamente (1 unidad).'
      : 'Mantenimiento registrado. ⚠️ NOTA: El producto no tenía stock disponible, no se descontó stock del inventario.';

    res.status(201).json({
      success: true,
      data: maintenance,
      message: mensaje
    });
  } catch (error) {
    console.error('Error al crear mantenimiento:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al registrar el mantenimiento'
    });
  }
};

// @desc    Actualizar mantenimiento
// @route   PUT /mantenimientos/:id
// @access  Private (administrador, visor)
exports.updateMaintenance = async (req, res) => {
  try {
    let maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: 'Mantenimiento no encontrado'
      });
    }

    const updateData = {
      tipo: req.body.tipo || maintenance.tipo,
      equipo: req.body.equipo !== undefined ? req.body.equipo.trim() : maintenance.equipo,
      fechaInstalacion: req.body.fechaInstalacion ? new Date(req.body.fechaInstalacion) : maintenance.fechaInstalacion,
      fechaVencimiento: req.body.fechaVencimiento ? new Date(req.body.fechaVencimiento) : maintenance.fechaVencimiento,
      horasVidaUtil: req.body.horasVidaUtil ? parseInt(req.body.horasVidaUtil) : maintenance.horasVidaUtil,
      observaciones: req.body.observaciones !== undefined ? req.body.observaciones.trim() : maintenance.observaciones,
      costo: req.body.costo ? parseFloat(req.body.costo) : maintenance.costo,
      estado: req.body.estado || maintenance.estado
    };

    maintenance = await Maintenance.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).populate('producto', 'referencia nombre tipo').populate('tecnico', 'nombre email');

    res.status(200).json({
      success: true,
      data: maintenance
    });
  } catch (error) {
    console.error('Error al actualizar mantenimiento:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar el mantenimiento'
    });
  }
};

// @desc    Eliminar mantenimiento
// @route   DELETE /mantenimientos/:id
// @access  Private (administrador)
exports.deleteMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: 'Mantenimiento no encontrado'
      });
    }

    // Si el mantenimiento está activo, devolver el stock al inventario
    if (maintenance.estado === 'activo') {
      const producto = await Product.findById(maintenance.producto);
      if (producto) {
        producto.existencia += 1;
        await producto.save();
      }
    }

    await Maintenance.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Mantenimiento eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar mantenimiento:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al eliminar el mantenimiento'
    });
  }
};

