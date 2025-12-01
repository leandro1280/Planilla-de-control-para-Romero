const Machine = require('../models/Machine');
const Product = require('../models/Product');
const Maintenance = require('../models/Maintenance');
const Movement = require('../models/Movement');
const { registrarAuditoria } = require('../middleware/auditoria');
const { createNotificationForAdmins } = require('./notificationController');

// @desc    Obtener todas las máquinas
// @route   GET /maquinas
// @access  Private
exports.getMachines = async (req, res) => {
  try {
    const { busqueda, pagina = 1, porPagina = 20 } = req.query;
    const paginaActual = parseInt(pagina);
    const limite = parseInt(porPagina);
    const salto = (paginaActual - 1) * limite;

    const query = { activo: true };

    // Búsqueda por código, nombre, ubicación
    if (busqueda && busqueda.trim() !== '') {
      query.$or = [
        { codigo: { $regex: busqueda, $options: 'i' } },
        { nombre: { $regex: busqueda, $options: 'i' } },
        { ubicacion: { $regex: busqueda, $options: 'i' } },
        { marca: { $regex: busqueda, $options: 'i' } },
        { modelo: { $regex: busqueda, $options: 'i' } }
      ];
    }

    const totalMaquinas = await Machine.countDocuments(query);
    const totalPaginas = Math.ceil(totalMaquinas / limite);

    const maquinas = await Machine.find(query)
      .populate('repuestos.producto', 'referencia nombre existencia tipo costoUnitario')
      .populate('creadoPor', 'nombre email')
      .sort({ nombre: 1 })
      .skip(salto)
      .limit(limite)
      .lean();

    res.render('maquinas/index', {
      title: 'Gestión de Máquinas - Romero Panificados',
      currentPage: 'maquinas',
      usuario: {
        _id: req.user._id,
        nombre: req.user.nombre,
        email: req.user.email,
        rol: req.user.rol
      },
      maquinas,
      totalMaquinas,
      paginaActual,
      totalPaginas,
      busqueda: busqueda || '',
      maquinas,
      paginaActual,
      totalPaginas,
      totalMaquinas,
      busqueda: busqueda || ''
    });
  } catch (error) {
    console.error('Error al obtener máquinas:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al cargar las máquinas',
      layout: 'main'
    });
  }
};

// @desc    Obtener máquina por código (para QR)
// @route   GET /maquinas/qr/:codigo
// @access  Private
exports.getMachineByCode = async (req, res) => {
  try {
    const { codigo } = req.params;
    
    const maquina = await Machine.findOne({ codigo: codigo.toUpperCase(), activo: true })
      .populate('repuestos.producto', 'referencia nombre existencia tipo costoUnitario')
      .populate('creadoPor', 'nombre email')
      .lean();

    if (!maquina) {
      return res.status(404).render('error', {
        title: 'Máquina no encontrada',
        message: `No se encontró una máquina con el código: ${codigo}`,
        layout: 'main'
      });
    }

    // Obtener últimos mantenimientos
    const ultimosMantenimientos = await Maintenance.find({ maquina: maquina._id })
      .populate('tecnico', 'nombre email')
      .populate('repuestosUtilizados.producto', 'referencia nombre')
      .sort({ fechaInstalacion: -1 })
      .limit(10)
      .lean();

    // Obtener estadísticas de mantenimientos
    const stats = {
      total: await Maintenance.countDocuments({ maquina: maquina._id }),
      preventivos: await Maintenance.countDocuments({ maquina: maquina._id, tipo: 'preventivo' }),
      correctivos: await Maintenance.countDocuments({ maquina: maquina._id, tipo: 'correctivo' }),
      activos: await Maintenance.countDocuments({ maquina: maquina._id, estado: 'activo' })
    };

    res.render('maquinas/detalle', {
      title: `${maquina.nombre} - Detalle`,
      currentPage: 'maquinas',
      usuario: {
        _id: req.user._id,
        nombre: req.user.nombre,
        email: req.user.email,
        rol: req.user.rol
      },
      maquina,
      ultimosMantenimientos,
      stats
    });
  } catch (error) {
    console.error('Error al obtener máquina:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al cargar la máquina',
      layout: 'main'
    });
  }
};

// @desc    Obtener máquina por código (API JSON)
// @route   GET /api/maquinas/qr/:codigo
// @access  Private
exports.getMachineByCodeAPI = async (req, res) => {
  try {
    const { codigo } = req.params;
    
    const maquina = await Machine.findOne({ codigo: codigo.toUpperCase(), activo: true })
      .populate('repuestos.producto', 'referencia nombre existencia tipo costoUnitario')
      .lean();

    if (!maquina) {
      return res.status(404).json({
        success: false,
        message: `No se encontró una máquina con el código: ${codigo}`
      });
    }

    // Obtener últimos mantenimientos
    const ultimosMantenimientos = await Maintenance.find({ maquina: maquina._id })
      .populate('tecnico', 'nombre email')
      .populate('repuestosUtilizados.producto', 'referencia nombre')
      .sort({ fechaInstalacion: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      data: {
        maquina,
        ultimosMantenimientos
      }
    });
  } catch (error) {
    console.error('Error al obtener máquina:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar la máquina'
    });
  }
};

// @desc    Renderizar formulario de nueva máquina
// @route   GET /maquinas/nueva
// @access  Private (solo supervisor y admin)
exports.renderNewMachine = async (req, res) => {
  try {
    const productos = await Product.find({ existencia: { $gt: 0 } })
      .sort({ referencia: 1 })
      .select('referencia nombre existencia tipo')
      .lean();

    res.render('maquinas/nueva', {
      title: 'Nueva Máquina - Romero Panificados',
      currentPage: 'maquinas',
      usuario: {
        _id: req.user._id,
        nombre: req.user.nombre,
        email: req.user.email,
        rol: req.user.rol
      },
      productos
    });
  } catch (error) {
    console.error('Error al cargar formulario:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al cargar el formulario',
      layout: 'main'
    });
  }
};

// @desc    Crear nueva máquina
// @route   POST /maquinas
// @access  Private (solo supervisor y admin)
exports.createMachine = async (req, res) => {
  try {
    const {
      codigo,
      nombre,
      descripcion,
      ubicacion,
      marca,
      modelo,
      numeroSerie,
      repuestos,
      mantenimientosProgramados
    } = req.body;

    // Verificar que el código no exista
    const maquinaExistente = await Machine.findOne({ codigo: codigo.toUpperCase() });
    if (maquinaExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una máquina con ese código'
      });
    }

    // Procesar repuestos
    const repuestosArray = [];
    if (repuestos && Array.isArray(repuestos)) {
      for (const repuesto of repuestos) {
        if (repuesto.producto && repuesto.cantidadRequerida) {
          repuestosArray.push({
            producto: repuesto.producto,
            cantidadRequerida: parseInt(repuesto.cantidadRequerida),
            descripcion: repuesto.descripcion || ''
          });
        }
      }
    }

    // Procesar mantenimientos programados
    const mantenimientosArray = [];
    if (mantenimientosProgramados && Array.isArray(mantenimientosProgramados)) {
      for (const mantenimiento of mantenimientosProgramados) {
        if (mantenimiento.tipo && mantenimiento.frecuencia) {
          mantenimientosArray.push({
            tipo: mantenimiento.tipo,
            frecuencia: {
              tipo: mantenimiento.frecuencia.tipo || 'dias',
              valor: parseInt(mantenimiento.frecuencia.valor) || 30
            },
            descripcion: mantenimiento.descripcion || ''
          });
        }
      }
    }

    const maquina = await Machine.create({
      codigo: codigo.toUpperCase(),
      nombre,
      descripcion,
      ubicacion,
      marca,
      modelo,
      numeroSerie,
      repuestos: repuestosArray,
      mantenimientosProgramados: mantenimientosArray,
      creadoPor: req.user._id
    });

    // Registrar auditoría
    await registrarAuditoria(req, 'CREAR', 'Máquina', maquina._id, {
      codigo: maquina.codigo,
      nombre: maquina.nombre
    });

    res.status(201).json({
      success: true,
      message: 'Máquina creada correctamente',
      data: {
        _id: maquina._id,
        codigo: maquina.codigo,
        nombre: maquina.nombre
      }
    });
  } catch (error) {
    console.error('Error al crear máquina:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear la máquina'
    });
  }
};

// @desc    Actualizar máquina
// @route   PUT /maquinas/:id
// @access  Private (solo supervisor y admin)
exports.updateMachine = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Procesar repuestos si vienen
    if (updateData.repuestos && Array.isArray(updateData.repuestos)) {
      updateData.repuestos = updateData.repuestos
        .filter(r => r.producto && r.cantidadRequerida)
        .map(r => ({
          producto: r.producto,
          cantidadRequerida: parseInt(r.cantidadRequerida),
          descripcion: r.descripcion || ''
        }));
    }

    // Procesar mantenimientos programados si vienen
    if (updateData.mantenimientosProgramados && Array.isArray(updateData.mantenimientosProgramados)) {
      updateData.mantenimientosProgramados = updateData.mantenimientosProgramados
        .filter(m => m.tipo && m.frecuencia)
        .map(m => ({
          tipo: m.tipo,
          frecuencia: {
            tipo: m.frecuencia.tipo || 'dias',
            valor: parseInt(m.frecuencia.valor) || 30
          },
          descripcion: m.descripcion || ''
        }));
    }

    updateData.actualizadoPor = req.user._id;

    const maquina = await Machine.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('repuestos.producto', 'referencia nombre existencia tipo');

    if (!maquina) {
      return res.status(404).json({
        success: false,
        message: 'Máquina no encontrada'
      });
    }

    // Registrar auditoría
    await registrarAuditoria(req, 'MODIFICAR', 'Máquina', maquina._id, {
      codigo: maquina.codigo,
      nombre: maquina.nombre
    });

    res.json({
      success: true,
      message: 'Máquina actualizada correctamente',
      data: maquina
    });
  } catch (error) {
    console.error('Error al actualizar máquina:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar la máquina'
    });
  }
};

// @desc    Eliminar máquina (soft delete)
// @route   DELETE /maquinas/:id
// @access  Private (solo admin)
exports.deleteMachine = async (req, res) => {
  try {
    const { id } = req.params;

    const maquina = await Machine.findById(id);

    if (!maquina) {
      return res.status(404).json({
        success: false,
        message: 'Máquina no encontrada'
      });
    }

    // Soft delete
    maquina.activo = false;
    maquina.actualizadoPor = req.user._id;
    await maquina.save();

    // Registrar auditoría
    await registrarAuditoria(req, 'ELIMINAR', 'Máquina', maquina._id, {
      codigo: maquina.codigo,
      nombre: maquina.nombre
    });

    res.json({
      success: true,
      message: 'Máquina eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar máquina:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al eliminar la máquina'
    });
  }
};

// @desc    Obtener productos disponibles para repuestos
// @route   GET /api/maquinas/productos
// @access  Private
exports.getProductsForRepuestos = async (req, res) => {
  try {
    const productos = await Product.find({ existencia: { $gt: 0 } })
      .sort({ referencia: 1 })
      .select('referencia nombre existencia tipo costoUnitario')
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

