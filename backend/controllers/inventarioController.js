const Product = require('../models/Product');
const Movement = require('../models/Movement');
const { createNotificationForAdmins } = require('./notificationController');

// @desc    Obtener todos los productos
// @route   GET /inventario
// @access  Private
exports.getProducts = async (req, res) => {
  try {
    const { busqueda, tipo, stock, pagina = 1, porPagina = 20 } = req.query;
    const paginaActual = parseInt(pagina);
    const limite = parseInt(porPagina);
    const salto = (paginaActual - 1) * limite;
    
    const query = {};
    
    // Filtro de búsqueda
    if (busqueda) {
      query.$or = [
        { referencia: { $regex: busqueda, $options: 'i' } },
        { nombre: { $regex: busqueda, $options: 'i' } },
        { equipo: { $regex: busqueda, $options: 'i' } },
        { detalle: { $regex: busqueda, $options: 'i' } }
      ];
    }
    
    // Filtro por tipo
    if (tipo && tipo !== 'todos') {
      query.tipo = tipo;
    }
    
    // Filtro por stock
    if (stock === 'sin-stock') {
      query.existencia = { $eq: 0 };
    } else if (stock === 'criticos') {
      query.existencia = { $lte: 4 };
    } else if (stock === 'bajo') {
      query.existencia = { $lt: 10, $gt: 4 };
    }
    
    // Contar total de productos con los filtros aplicados
    const totalProductos = await Product.countDocuments(query);
    const totalPaginas = Math.ceil(totalProductos / limite);
    
    // Obtener productos paginados
    const products = await Product.find(query)
      .sort({ referencia: 1 })
      .skip(salto)
      .limit(limite)
      .lean();
    
    // Obtener TODOS los productos (sin paginación) para el selector del formulario
    const todosLosProductos = await Product.find({}).sort({ referencia: 1 }).select('referencia nombre').lean();
    
    // Extraer tipos únicos de TODOS los productos (no solo los filtrados) para el selector
    const todosLosTipos = await Product.find({}).select('tipo').lean();
    const tipos = [...new Set(todosLosTipos.map(p => p.tipo).filter(Boolean))].sort();
    
    console.log(`📊 Inventario - Productos encontrados: ${totalProductos}, Mostrando: ${products.length}, Página: ${paginaActual}/${totalPaginas}`);
    
    res.render('inventario/index', {
      title: 'Inventario - Romero Panificados',
      currentPage: 'inventario',
      products: products || [],
      todosLosProductos: todosLosProductos || [], // Para el selector del formulario
      tipos: tipos || [],
      usuario: {
        nombre: req.user.nombre,
        email: req.user.email,
        rol: req.user.rol
      },
      busqueda: busqueda || '',
      tipoFiltro: tipo || 'todos',
      stockFiltro: stock || 'todos',
      paginacion: {
        paginaActual: paginaActual,
        totalPaginas: totalPaginas,
        totalProductos: totalProductos,
        tieneAnterior: paginaActual > 1,
        tieneSiguiente: paginaActual < totalPaginas,
        desde: salto + 1,
        hasta: Math.min(salto + limite, totalProductos)
      }
    });
  } catch (error) {
    res.status(500).render('error', {
      title: 'Error',
      message: error.message
    });
  }
};

// @desc    Crear producto
// @route   POST /inventario/productos
// @access  Private (administrador, visor)
exports.createProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      referencia: req.body.referencia.toUpperCase(),
      existencia: parseInt(req.body.existencia) || 0,
      costoUnitario: parseFloat(req.body.costoUnitario) || 0,
      creadoPor: req.user._id
    };
    
    const product = await Product.create(productData);
    
    // Crear notificación para administradores
    await createNotificationForAdmins(
      'producto_creado',
      `${req.user.nombre} creó el producto ${product.referencia} - ${product.nombre}`,
      {
        productoId: product._id.toString(),
        referencia: product.referencia,
        nombre: product.nombre
      },
      product.referencia
    );
    
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'La referencia ya existe'
      });
    }
    
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Actualizar producto
// @route   PUT /inventario/productos/:id
// @access  Private (administrador, visor)
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    const updateData = {
      ...req.body,
      referencia: req.body.referencia ? req.body.referencia.toUpperCase() : product.referencia,
      existencia: req.body.existencia !== undefined ? parseInt(req.body.existencia) : product.existencia,
      costoUnitario: req.body.costoUnitario !== undefined ? parseFloat(req.body.costoUnitario) : product.costoUnitario,
      actualizadoPor: req.user._id
    };
    
    product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Eliminar producto
// @route   DELETE /inventario/productos/:id
// @access  Private (administrador)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    // Verificar si hay movimientos asociados
    const movements = await Movement.find({ producto: product._id });
    if (movements.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un producto con movimientos asociados'
      });
    }
    
    await Product.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Producto eliminado correctamente'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Registrar movimiento
// @route   POST /inventario/movimientos
// @access  Private (administrador, visor)
exports.createMovement = async (req, res) => {
  try {
    const { referencia, tipo, cantidad, costoUnitario, nota } = req.body;
    
    // Buscar producto
    const product = await Product.findOne({ referencia: referencia.toUpperCase() });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    const cantidadNum = parseInt(cantidad);
    
    // El costo unitario es completamente opcional: puede ser null si no se conoce
    let costoNum = null;
    if (costoUnitario !== undefined && costoUnitario !== null && costoUnitario !== '') {
      const parsed = parseFloat(costoUnitario);
      if (!isNaN(parsed) && parsed >= 0) {
        costoNum = parsed;
      }
    }
    // Si no se proporciona costo, dejamos null (se puede agregar después)
    
    // Validar egreso
    if (tipo === 'egreso' && product.existencia < cantidadNum) {
      return res.status(400).json({
        success: false,
        message: 'No hay stock suficiente para realizar el egreso'
      });
    }
    
    // Calcular nuevo stock
    let nuevaExistencia;
    if (tipo === 'ingreso') {
      nuevaExistencia = product.existencia + cantidadNum;
      // Si es ingreso y se proporciona costo (y es mayor a 0), actualizar costo del producto
      if (costoUnitario !== undefined && costoUnitario !== null && costoUnitario !== '' && costoNum > 0) {
        product.costoUnitario = costoNum;
      }
    } else {
      nuevaExistencia = product.existencia - cantidadNum;
    }
    
    // Actualizar producto
    product.existencia = nuevaExistencia;
    product.actualizadoPor = req.user._id;
    // Solo actualizar el costo del producto si se proporciona un costo y es mayor a 0 (en ingresos)
    if (tipo === 'ingreso' && costoNum !== null && costoNum > 0) {
      product.costoUnitario = costoNum;
    }
    await product.save();
    
    // Crear movimiento (el costo puede ser null si no se proporciona)
    const movimiento = await Movement.create({
      referencia: product.referencia,
      tipo,
      cantidad: cantidadNum,
      costoUnitario: costoNum, // Puede ser null
      costoTotal: costoNum !== null ? Math.round((costoNum * cantidadNum) * 100) / 100 : null,
      nota: nota || '',
      producto: product._id,
      usuario: req.user._id,
      tipoProducto: product.tipo || ''
    });
    
    // Crear notificación para administradores
    const tipoMovimiento = tipo === 'ingreso' ? 'ingreso' : 'egreso';
    await createNotificationForAdmins(
      'movimiento_creado',
      `${req.user.nombre} registró un ${tipoMovimiento} de ${cantidadNum} unidades de ${product.referencia} - ${product.nombre}`,
      {
        movimientoId: movimiento._id.toString(),
        referencia: product.referencia,
        tipo: tipo,
        cantidad: cantidadNum,
        nuevaExistencia: nuevaExistencia
      },
      product.referencia
    );
    
    res.status(201).json({
      success: true,
      data: {
        movimiento,
        producto: product
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

