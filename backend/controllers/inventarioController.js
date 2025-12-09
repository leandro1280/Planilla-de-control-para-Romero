const Product = require('../models/Product');
const Movement = require('../models/Movement');
const XLSX = require('xlsx');
const { createNotificationForAdmins } = require('./notificationController');
const { registrarAuditoria } = require('../middleware/auditoria');
const { guardarVersionProducto } = require('./historialController');
const { sanitizeExcelData } = require('../middleware/validateExcel');

// @desc    Buscar producto por código (referencia o código de fabricante)
// @route   GET /inventario/productos/buscar
// @access  Private
exports.buscarProductoPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.query;

    if (!codigo || codigo.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Código es requerido'
      });
    }

    const codigoLimpio = codigo.trim();

    // Buscar por referencia (exacta, case insensitive)
    // O por código de fabricante (exacta o parcial)
    // O si el código contiene la referencia en una URL
    let producto = await Product.findOne({
      $or: [
        { referencia: { $regex: new RegExp(`^${codigoLimpio.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { codigoFabricante: codigoLimpio },
        { codigoFabricante: { $regex: codigoLimpio.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
      ]
    }).lean();

    // Si no se encuentra y el código parece ser una URL, extraer posible referencia
    if (!producto && codigoLimpio.includes('/')) {
      const partes = codigoLimpio.split('/');
      const posibleReferencia = partes[partes.length - 1] || partes[partes.length - 2];
      if (posibleReferencia && posibleReferencia.length > 3) {
        producto = await Product.findOne({
          $or: [
            { referencia: { $regex: new RegExp(`^${posibleReferencia.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
            { codigoFabricante: posibleReferencia }
          ]
        }).lean();
      }
    }

    // Si aún no se encuentra, buscar si el código contiene alguna referencia conocida
    if (!producto && codigoLimpio.length > 5) {
      // Buscar productos cuyas referencias estén contenidas en el código escaneado
      const todosProductos = await Product.find({}).select('referencia codigoFabricante').lean();
      const productoEncontrado = todosProductos.find(p => {
        const ref = (p.referencia || '').toUpperCase();
        const codFab = (p.codigoFabricante || '').toUpperCase();
        const codigoUpper = codigoLimpio.toUpperCase();
        return (ref && codigoUpper.includes(ref)) || (codFab && codigoUpper.includes(codFab));
      });

      if (productoEncontrado) {
        producto = await Product.findById(productoEncontrado._id).lean();
      }
    }

    if (producto) {
      return res.status(200).json({
        success: true,
        producto: producto
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado',
        codigo: codigoLimpio
      });
    }
  } catch (error) {
    console.error('Error al buscar producto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al buscar producto'
    });
  }
};

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

    // Filtro de búsqueda avanzada (múltiples campos)
    if (busqueda) {
      // Buscar en múltiples campos: referencia, nombre, equipo, detalle, tipo, código de fabricante
      query.$or = [
        { referencia: { $regex: busqueda, $options: 'i' } },
        { nombre: { $regex: busqueda, $options: 'i' } },
        { equipo: { $regex: busqueda, $options: 'i' } },
        { detalle: { $regex: busqueda, $options: 'i' } },
        { tipo: { $regex: busqueda, $options: 'i' } },
        { codigoFabricante: { $regex: busqueda, $options: 'i' } }
      ];
    }
    
    // Filtro por rango de stock (avanzado - opcional, para uso futuro)
    const { stockMin, stockMax } = req.query;
    if (stockMin !== undefined || stockMax !== undefined) {
      if (!query.existencia) query.existencia = {};
      if (stockMin !== undefined) query.existencia.$gte = parseInt(stockMin);
      if (stockMax !== undefined) query.existencia.$lte = parseInt(stockMax);
    }
    
    // Filtro por rango de costo (avanzado - opcional, para uso futuro)
    const { costoMin, costoMax } = req.query;
    if (costoMin !== undefined || costoMax !== undefined) {
      if (!query.costoUnitario) query.costoUnitario = {};
      if (costoMin !== undefined) query.costoUnitario.$gte = parseFloat(costoMin);
      if (costoMax !== undefined) query.costoUnitario.$lte = parseFloat(costoMax);
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

    // Obtener productos paginados con información de usuarios
    const products = await Product.find(query)
      .populate('creadoPor', 'nombre email')
      .populate('actualizadoPor', 'nombre email')
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

    // Construir baseUrl con los filtros actuales
    const queryParams = {};
    if (busqueda) queryParams.busqueda = busqueda;
    if (tipo && tipo !== 'todos') queryParams.tipo = tipo;
    if (stock && stock !== 'todos') queryParams.stock = stock;
    
    const baseUrl = '/inventario';
    const queryString = new URLSearchParams(queryParams).toString();
    const baseUrlWithParams = queryString ? `${baseUrl}?${queryString}` : baseUrl;

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
        hasta: Math.min(salto + limite, totalProductos),
        baseUrl: baseUrlWithParams,
        queryParams: queryParams
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
// @access  Private (administrador, supervisor)
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

    // Guardar versión inicial del producto
    await guardarVersionProducto(product, req.user._id, {}, 'Creación inicial');

    // Registrar auditoría
    await registrarAuditoria(req, 'CREAR', 'Producto', product._id, {
      referencia: product.referencia,
      nombre: product.nombre,
      tipo: product.tipo,
      existencia: product.existencia,
      costoUnitario: product.costoUnitario
    });

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
// @access  Private (administrador, supervisor)
exports.updateProduct = async (req, res) => {
  try {
    console.log('📝 Actualizando producto:', req.params.id);
    console.log('📦 Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Preparar datos de actualización
    const updateData = {};
    
    // Validar y preparar cada campo
    if (req.body.nombre !== undefined) {
      const nombre = req.body.nombre.trim();
      if (!nombre || nombre.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El nombre es obligatorio',
          errors: [{ field: 'nombre', message: 'El nombre no puede estar vacío' }]
        });
      }
      if (nombre.length > 200) {
        return res.status(400).json({
          success: false,
          message: 'El nombre excede el límite de caracteres',
          errors: [{ field: 'nombre', message: 'El nombre no puede exceder 200 caracteres' }]
        });
      }
      updateData.nombre = nombre;
    }
    
    if (req.body.equipo !== undefined) {
      const equipo = req.body.equipo.trim() || '';
      if (equipo.length > 200) {
        return res.status(400).json({
          success: false,
          message: 'El equipo excede el límite de caracteres',
          errors: [{ field: 'equipo', message: 'El equipo no puede exceder 200 caracteres' }]
        });
      }
      updateData.equipo = equipo;
    }
    
    if (req.body.existencia !== undefined) {
      const existencia = parseInt(req.body.existencia);
      if (isNaN(existencia) || existencia < 0) {
        return res.status(400).json({
          success: false,
          message: 'La existencia debe ser un número mayor o igual a 0',
          errors: [{ field: 'existencia', message: 'La existencia no puede ser negativa' }]
        });
      }
      updateData.existencia = existencia;
    }
    
    if (req.body.detalle !== undefined) {
      const detalle = req.body.detalle.trim() || '';
      if (detalle.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'El detalle excede el límite de caracteres',
          errors: [{ field: 'detalle', message: 'El detalle no puede exceder 500 caracteres' }]
        });
      }
      updateData.detalle = detalle;
    }
    
    if (req.body.tipo !== undefined) {
      const tipoValue = req.body.tipo;
      if (tipoValue === null || tipoValue === 'null' || (typeof tipoValue === 'string' && tipoValue.trim() === '')) {
        updateData.tipo = null;
      } else {
        const tipo = tipoValue.trim();
        if (tipo.length > 50) {
          return res.status(400).json({
            success: false,
            message: 'El tipo excede el límite de caracteres',
            errors: [{ field: 'tipo', message: 'El tipo no puede exceder 50 caracteres' }]
          });
        }
        updateData.tipo = tipo;
      }
    }
    
    if (req.body.costoUnitario !== undefined) {
      const costoValue = req.body.costoUnitario;
      if (costoValue === null || costoValue === '' || costoValue === 'null') {
        updateData.costoUnitario = null;
      } else {
        const costo = parseFloat(costoValue);
        if (isNaN(costo) || costo < 0) {
          return res.status(400).json({
            success: false,
            message: 'El costo unitario debe ser un número mayor o igual a 0',
            errors: [{ field: 'costoUnitario', message: 'El costo unitario no puede ser negativo' }]
          });
        }
        updateData.costoUnitario = costo;
      }
    }
    
    if (req.body.codigoFabricante !== undefined) {
      const codigoValue = req.body.codigoFabricante;
      if (codigoValue === null || codigoValue === '' || codigoValue === 'null' || (typeof codigoValue === 'string' && codigoValue.trim() === '')) {
        updateData.codigoFabricante = null;
      } else {
        const codigo = codigoValue.trim();
        if (codigo.length > 200) {
          return res.status(400).json({
            success: false,
            message: 'El código de fabricante excede el límite de caracteres',
            errors: [{ field: 'codigoFabricante', message: 'El código de fabricante no puede exceder 200 caracteres' }]
          });
        }
        updateData.codigoFabricante = codigo;
      }
    }
    
    updateData.actualizadoPor = req.user._id;

    console.log('🔄 Datos a actualizar:', JSON.stringify(updateData, null, 2));

    // Usar findOneAndUpdate con setDefaultsOnInsert: false para no afectar campos no enviados
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id, 
      { $set: updateData },
      {
        new: true,
        runValidators: true,
        setDefaultsOnInsert: false
      }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'No se pudo actualizar el producto'
      });
    }

    // Calcular cambios detallados - solo para campos que se actualizaron
    const cambios = {};
    const campos = ['nombre', 'equipo', 'existencia', 'detalle', 'tipo', 'costoUnitario', 'codigoFabricante'];
    
    campos.forEach(campo => {
      // Solo comparar si el campo está en updateData (fue enviado para actualizar)
      if (updateData.hasOwnProperty(campo)) {
        const valorAnterior = product[campo];
        const valorNuevo = updateData[campo];
        
        // Comparar valores (manejar null/undefined correctamente)
        const anterior = valorAnterior !== undefined && valorAnterior !== null ? valorAnterior : null;
        const nuevo = valorNuevo !== undefined && valorNuevo !== null ? valorNuevo : null;
        
        if (anterior !== nuevo) {
          cambios[campo] = {
            anterior: anterior,
            nuevo: nuevo
          };
        }
      }
    });

    // Guardar versión histórica si hay cambios (no bloquear si falla)
    if (Object.keys(cambios).length > 0) {
      try {
        await guardarVersionProducto(updatedProduct, req.user._id, cambios);
      } catch (histError) {
        console.error('⚠️ Error guardando historial (no crítico):', histError);
        // Continuar aunque falle el historial
      }
    }

    // Registrar auditoría con detalles de cambios (no bloquear si falla)
    try {
      await registrarAuditoria(req, 'MODIFICAR', 'Producto', updatedProduct._id, {
        referencia: updatedProduct.referencia,
        nombre: updatedProduct.nombre,
        cambios
      });
    } catch (auditError) {
      console.error('⚠️ Error registrando auditoría (no crítico):', auditError);
      // Continuar aunque falle la auditoría
    }

    console.log('✅ Producto actualizado exitosamente');
    res.status(200).json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    console.error('❌ Error al actualizar producto:', error);
    console.error('Error stack:', error.stack);
    
    // Si es un error de validación de Mongoose, extraer mensajes más detallados
    let errorMessage = error.message || 'Error desconocido al actualizar producto';
    let errorDetails = [];
    
    if (error.name === 'ValidationError') {
      errorDetails = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message,
        path: error.errors[key].path
      }));
      errorMessage = errorDetails.map(e => e.message).join(', ');
    } else if (error.name === 'CastError') {
      errorMessage = 'ID de producto inválido';
    } else if (error.code === 11000) {
      errorMessage = 'Ya existe un producto con esa referencia';
    }
    
    res.status(400).json({
      success: false,
      message: errorMessage,
      errors: errorDetails.length > 0 ? errorDetails : undefined,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
        message: `No se puede eliminar este producto porque tiene ${movements.length} movimiento(s) asociado(s) en el historial. Para mantener la integridad de los datos, solo se pueden eliminar productos sin movimientos.`
      });
    }

    // Registrar auditoría antes de eliminar
    await registrarAuditoria(req, 'ELIMINAR', 'Producto', product._id, {
      referencia: product.referencia,
      nombre: product.nombre,
      tipo: product.tipo,
      existenciaFinal: product.existencia,
      costoUnitario: product.costoUnitario
    });

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
// @access  Private (administrador, supervisor)
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

    // Registrar auditoría
    await registrarAuditoria(req, 'CREAR', 'Movimiento', movimiento._id, {
      referencia: product.referencia,
      tipo: tipo,
      cantidad: cantidadNum,
      nuevaExistencia: nuevaExistencia,
      costoUnitario: movimiento.costoUnitario,
      costoTotal: movimiento.costoTotal
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

// @desc    Exportar inventario a Excel
// @route   GET /inventario/exportar
// @access  Private
exports.exportToExcel = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ referencia: 1 }).lean();

    const datos = products.map(p => ({
      Referencia: p.referencia,
      Nombre: p.nombre,
      Equipo: p.equipo || '',
      Existencia: p.existencia,
      Tipo: p.tipo || '',
      'Costo Unitario': p.costoUnitario || 0,
      'Valor Total': (p.existencia * (p.costoUnitario || 0))
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datos);

    // Ajustar ancho de columnas
    const wscols = [
      { wch: 20 }, // Referencia
      { wch: 40 }, // Nombre
      { wch: 20 }, // Equipo
      { wch: 10 }, // Existencia
      { wch: 15 }, // Tipo
      { wch: 15 }, // Costo Unitario
      { wch: 15 }  // Valor Total
    ];
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const fecha = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Disposition', `attachment; filename=inventario_${fecha}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(buffer);
  } catch (error) {
    console.error('Error exportando excel:', error);
    res.status(500).send('Error al generar el archivo Excel');
  }
};

// @desc    Importar productos desde Excel
// @route   POST /inventario/importar
// @access  Private (administrador)
exports.importFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se subió ningún archivo'
      });
    }

    // Configuración segura de XLSX para mitigar vulnerabilidades
    const workbook = XLSX.read(req.file.buffer, { 
      type: 'buffer',
      cellText: false, // No procesar texto de celdas innecesariamente (mitiga ReDoS)
      cellDates: false, // No procesar fechas (reduce complejidad)
      sheetStubs: false, // No procesar stubs vacíos
      dense: false // No usar formato denso (más seguro)
    });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // range: 1 salta la primera fila (índice 0) y usa la fila 2 (índice 1) como encabezados
    const data = XLSX.utils.sheet_to_json(sheet, { range: 1 });

    if (!data || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El archivo está vacío o no tiene datos válidos'
      });
    }

    let creados = 0;
    let actualizados = 0;
    let errores = 0;
    const erroresDetalle = [];

    for (const row of data) {
      try {
        // Mapear columnas según lo especificado
        const referencia = (row['REFERENCIA'] || row['Referencia'] || '').toString().toUpperCase().trim();

        if (!referencia) continue;

        const productData = {
          referencia: referencia,
          nombre: row['DESCRIPCIÓN DE PRODUCTO'] || row['Nombre'] || '',
          equipo: row['EQUIPO DONDE SE APLICA'] || row['Equipo'] || '',
          existencia: parseInt(row['DISPONIBLES'] || row['Existencia'] || 0),
          detalle: row['DETALLE'] || row['Detalle'] || '',
          tipo: row['TIPO'] || row['Tipo'] || 'General',
          // Si quieres capturar costo si viene en el excel:
          // costoUnitario: parseFloat(row['COSTO'] || 0), 
          actualizadoPor: req.user._id
        };

        // Buscar si existe
        let product = await Product.findOne({ referencia: referencia });

        if (product) {
          // Actualizar (upsert logic)
          product.nombre = productData.nombre || product.nombre;
          product.equipo = productData.equipo || product.equipo;
          // Actualizamos existencia solo si es válida en el excel? O sumamos? 
          // Generalmente en importación masiva de inventario inicial se sobrescribe.
          if (!isNaN(productData.existencia)) {
            product.existencia = productData.existencia;
          }
          product.detalle = productData.detalle || product.detalle;
          product.tipo = productData.tipo || product.tipo;
          product.actualizadoPor = req.user._id;

          await product.save();
          actualizados++;
        } else {
          // Crear nuevo
          productData.creadoPor = req.user._id;
          await Product.create(productData);
          creados++;
        }
      } catch (error) {
        errores++;
        erroresDetalle.push(`Ref: ${row['REFERENCIA']} - Error: ${error.message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: `Importación finalizada`,
      stats: {
        creados,
        actualizados,
        errores
      },
      erroresDetalle
    });

  } catch (error) {
    console.error('Error importando excel:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el archivo: ' + error.message
    });
  }
};