const Maintenance = require('../models/Maintenance');
const Product = require('../models/Product');
const Machine = require('../models/Machine');
const Movement = require('../models/Movement');
const { createNotificationForAdmins } = require('./notificationController');
const { registrarAuditoria } = require('../middleware/auditoria');

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
      .populate('maquina', 'codigo nombre ubicacion')
      .populate('tecnico', 'nombre email')
      .populate('repuestosUtilizados.producto', 'referencia nombre existencia')
      .sort({ fechaInstalacion: -1 })
      .skip(salto)
      .limit(limite)
      .lean();

    // Obtener equipos únicos para el filtro
    const equipos = await Maintenance.distinct('equipo').lean();
    const equiposFiltrados = equipos.filter(e => e && e.trim() !== '').sort();

    // Obtener TODOS los productos para el formulario (mostrar todos, marcar los sin stock)
    // Ordenar primero por tipo (alfabético), luego por nombre (alfabético)
    const productos = await Product.find({})
      .sort({ tipo: 1, nombre: 1 })
      .select('referencia nombre tipo existencia')
      .lean();

    // Obtener tipos únicos de productos para el filtro
    const tiposUnicos = await Product.distinct('tipo').lean();
    const tiposFiltrados = tiposUnicos.filter(t => t && t.trim() !== '').sort();

    // Obtener máquinas para el formulario
    const maquinas = await Machine.find({ activo: true })
      .sort({ nombre: 1 })
      .select('codigo nombre ubicacion')
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
      tipos: tiposFiltrados,
      maquinas,
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
// @access  Private (administrador, supervisor)
exports.createMaintenance = async (req, res) => {
  try {
    const {
      maquinaId,
      productoId,
      tipo,
      equipo,
      fechaInstalacion,
      fechaVencimiento,
      horasVidaUtil,
      observaciones,
      costo,
      repuestosUtilizados
    } = req.body;

    let maquina = null;
    let producto = null;
    let referencia = '';

    // Validar máquina o producto
    if (maquinaId) {
      maquina = await Machine.findById(maquinaId);
      if (!maquina) {
        return res.status(404).json({
          success: false,
          message: 'Máquina no encontrada'
        });
      }
      referencia = maquina.codigo;
    } else if (productoId) {
      producto = await Product.findById(productoId);
      if (!producto) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }
      referencia = producto.referencia.toUpperCase().trim();
    } else {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar una máquina o un producto'
      });
    }

    // Procesar repuestos utilizados
    const repuestosArray = [];
    let costoTotalRepuestos = 0;

    if (repuestosUtilizados && Array.isArray(repuestosUtilizados)) {
      for (const repuesto of repuestosUtilizados) {
        if (repuesto.producto && repuesto.cantidad) {
          const prodRepuesto = await Product.findById(repuesto.producto);
          if (prodRepuesto) {
            const cantidad = parseInt(repuesto.cantidad);
            const costoUnitario = parseFloat(repuesto.costoUnitario) || prodRepuesto.costoUnitario || 0;
            
            repuestosArray.push({
              producto: repuesto.producto,
              cantidad: cantidad,
              costoUnitario: costoUnitario
            });

            costoTotalRepuestos += cantidad * costoUnitario;

            // Descontar del stock
            if (prodRepuesto.existencia >= cantidad) {
              prodRepuesto.existencia -= cantidad;
              await prodRepuesto.save();

              // Registrar movimiento de egreso
              await Movement.create({
                referencia: prodRepuesto.referencia,
                tipo: 'egreso',
                cantidad: cantidad,
                costoUnitario: costoUnitario,
                producto: prodRepuesto._id,
                usuario: req.user._id,
                tipoProducto: prodRepuesto.tipo,
                nota: `Mantenimiento: ${observaciones || 'Sin observaciones'}`
              });
            }
          }
        }
      }
    }

    // Crear el mantenimiento
    const maintenanceData = {
      maquina: maquinaId || null,
      producto: productoId || null,
      referencia: referencia,
      tipo: tipo || 'preventivo',
      equipo: equipo ? equipo.trim() : (maquina ? maquina.nombre : ''),
      fechaInstalacion: fechaInstalacion ? new Date(fechaInstalacion) : new Date(),
      tipoFrecuencia: req.body.tipoFrecuencia || 'horas',
      intervaloDias: req.body.intervaloDias ? parseInt(req.body.intervaloDias) : null,
      horasVidaUtil: req.body.horasVidaUtil ? parseInt(req.body.horasVidaUtil) : null,
      observaciones: observaciones ? observaciones.trim() : '',
      tecnico: req.user._id,
      costo: costo ? parseFloat(costo) : (costoTotalRepuestos > 0 ? costoTotalRepuestos : null),
      estado: 'activo',
      repuestosUtilizados: repuestosArray
    };

    // Calcular fecha de vencimiento
    if (fechaVencimiento) {
      // Si se envía fechaVencimiento explícitamente, usarla (modo manual)
      maintenanceData.fechaVencimiento = new Date(fechaVencimiento);
    } else {
      // Si no se envía, recalcular según el tipo de frecuencia
      if (maintenanceData.tipoFrecuencia === 'fecha' && maintenanceData.intervaloDias) {
        const fechaInst = new Date(maintenanceData.fechaInstalacion);
        maintenanceData.fechaVencimiento = new Date(fechaInst.setDate(fechaInst.getDate() + maintenanceData.intervaloDias));
      } else if (maintenanceData.tipoFrecuencia === 'horas' && maintenanceData.horasVidaUtil) {
        // Calcular días basándose en horas
        const horasDiarias = req.body.horasDiarias ? parseFloat(req.body.horasDiarias) : 12;
        if (horasDiarias > 0) {
          const diasHastaCambio = Math.ceil(maintenanceData.horasVidaUtil / horasDiarias);
          const fechaInst = new Date(maintenanceData.fechaInstalacion);
          maintenanceData.fechaVencimiento = new Date(fechaInst.setDate(fechaInst.getDate() + diasHastaCambio));
        }
      }
    }

    const maintenance = await Maintenance.create(maintenanceData);

    // Registrar auditoría
    await registrarAuditoria(req, 'CREAR', 'Mantenimiento', maintenance._id, {
      referencia: referencia,
      maquina: maquina ? maquina.nombre : null,
      producto: producto ? producto.nombre : null,
      tipo: tipo,
      equipo: equipo || (maquina ? maquina.nombre : ''),
      estado: 'activo',
      repuestosUtilizados: repuestosArray.length
    });

    // Crear notificación para administradores
    const descripcion = maquina 
      ? `Mantenimiento ${tipo} en máquina ${maquina.codigo} - ${maquina.nombre}`
      : `Mantenimiento ${tipo} en ${producto.referencia} - ${producto.nombre}`;
    
    await createNotificationForAdmins(
      'Nuevo mantenimiento registrado',
      descripcion,
      req.user._id
    );

    const mensaje = repuestosArray.length > 0
      ? `Mantenimiento registrado correctamente. Se utilizaron ${repuestosArray.length} repuesto(s) y se descontó stock automáticamente.`
      : 'Mantenimiento registrado correctamente.';

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
// @access  Private (administrador, supervisor)
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
      tipoFrecuencia: req.body.tipoFrecuencia || maintenance.tipoFrecuencia,
      intervaloDias: req.body.intervaloDias ? parseInt(req.body.intervaloDias) : maintenance.intervaloDias,
      horasVidaUtil: req.body.horasVidaUtil ? parseInt(req.body.horasVidaUtil) : maintenance.horasVidaUtil,
      observaciones: req.body.observaciones !== undefined ? req.body.observaciones.trim() : maintenance.observaciones,
      costo: req.body.costo ? parseFloat(req.body.costo) : maintenance.costo,
      estado: req.body.estado || maintenance.estado
    };

    // Manejar fecha de vencimiento
    if (req.body.fechaVencimiento) {
      // Si se envía fechaVencimiento explícitamente, usarla (modo manual)
      updateData.fechaVencimiento = new Date(req.body.fechaVencimiento);
    } else {
      // Si no se envía, recalcular según el tipo de frecuencia
      if (updateData.tipoFrecuencia === 'fecha' && updateData.intervaloDias) {
        const fechaInst = new Date(updateData.fechaInstalacion);
        updateData.fechaVencimiento = new Date(fechaInst.setDate(fechaInst.getDate() + updateData.intervaloDias));
      } else if (updateData.tipoFrecuencia === 'horas' && updateData.horasVidaUtil) {
        // Calcular días basándose en horas (asumiendo 12 horas diarias por defecto)
        const horasDiarias = req.body.horasDiarias ? parseFloat(req.body.horasDiarias) : 12;
        if (horasDiarias > 0) {
          const diasHastaCambio = Math.ceil(updateData.horasVidaUtil / horasDiarias);
          const fechaInst = new Date(updateData.fechaInstalacion);
          updateData.fechaVencimiento = new Date(fechaInst.setDate(fechaInst.getDate() + diasHastaCambio));
        }
      }
    }

    // Guardar datos anteriores para auditoría
    const cambios = {};
    if (maintenance.estado !== updateData.estado) {
      cambios.estadoAnterior = maintenance.estado;
      cambios.estadoNuevo = updateData.estado;
    }
    if (maintenance.equipo !== updateData.equipo) {
      cambios.equipoAnterior = maintenance.equipo;
      cambios.equipoNuevo = updateData.equipo;
    }

    maintenance = await Maintenance.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).populate('producto', 'referencia nombre tipo').populate('tecnico', 'nombre email');

    // Registrar auditoría
    await registrarAuditoria(req, 'MODIFICAR', 'Mantenimiento', maintenance._id, {
      referencia: maintenance.referencia,
      cambios: Object.keys(cambios).length > 0 ? cambios : undefined
    });

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

    // Registrar auditoría antes de eliminar
    await registrarAuditoria(req, 'ELIMINAR', 'Mantenimiento', maintenance._id, {
      referencia: maintenance.referencia,
      equipo: maintenance.equipo,
      estado: maintenance.estado
    });

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

// @desc    Verificar mantenimientos próximos a vencer
// @access  Internal
exports.checkUpcomingMaintenances = async () => {
  try {
    const hoy = new Date();
    const tresDiasDespues = new Date();
    tresDiasDespues.setDate(hoy.getDate() + 3);

    // Buscar mantenimientos activos que vencen pronto (en los próximos 3 días) o ya vencieron
    // y que NO tengan una notificación reciente (esto es más complejo, por ahora simplificamos)
    const mantenimientos = await Maintenance.find({
      estado: 'activo',
      fechaVencimiento: { $lte: tresDiasDespues }
    }).populate('producto');

    for (const mant of mantenimientos) {
      // Aquí podríamos verificar si ya se envió notificación hoy para no spammear
      // Por simplicidad, asumimos que el sistema de notificaciones maneja duplicados o aceptamos el spam diario

      const diasRestantes = Math.ceil((new Date(mant.fechaVencimiento) - hoy) / (1000 * 60 * 60 * 24));
      let mensaje = '';

      if (diasRestantes < 0) {
        mensaje = `El mantenimiento para ${mant.producto.nombre} (${mant.equipo}) venció hace ${Math.abs(diasRestantes)} días.`;
      } else if (diasRestantes === 0) {
        mensaje = `El mantenimiento para ${mant.producto.nombre} (${mant.equipo}) vence HOY.`;
      } else {
        mensaje = `El mantenimiento para ${mant.producto.nombre} (${mant.equipo}) vence en ${diasRestantes} días.`;
      }

      await createNotificationForAdmins(
        'Alerta de Mantenimiento',
        mensaje,
        null // Sistema
      );
    }
  } catch (error) {
    console.error('Error verificando mantenimientos:', error);
  }
};

