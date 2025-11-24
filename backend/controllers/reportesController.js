const PDFDocument = require('pdfkit');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const Product = require('../models/Product');
const Movement = require('../models/Movement');
const Maintenance = require('../models/Maintenance');
const RegistroAuditoria = require('../models/RegistroAuditoria');

// Configuración del renderizador de gráficos
const width = 600;
const height = 400;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

// Helper para formatear fechas
const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper para formatear moneda
const formatCurrency = (num) => {
  if (!num && num !== 0) return '$0.00';
  return `$${Number(num).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Helper para generar gráfico de distribución de productos por tipo
const generarGraficoDistribucion = async (productos) => {
  const tiposContador = {};
  productos.forEach(p => {
    const tipo = p.tipo || 'Sin tipo';
    tiposContador[tipo] = (tiposContador[tipo] || 0) + 1;
  });

  const labels = Object.keys(tiposContador);
  const data = Object.values(tiposContador);

  if (labels.length === 0) return null;

  const configuration = {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: 'Productos',
        data: data,
        backgroundColor: [
          '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
          '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#16a085',
          '#c0392b', '#2980b9', '#27ae60', '#d35400', '#8e44ad'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Distribución de Inventario por Tipo',
          font: { size: 16 }
        },
        legend: {
          position: 'bottom'
        }
      }
    }
  };

  try {
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    return imageBuffer;
  } catch (error) {
    console.error('Error generando gráfico:', error);
    return null;
  }
};

// Helper para generar gráfico de ingresos vs egresos
const generarGraficoIngresosEgresos = async (movimientos) => {
  const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + (m.cantidad || 0), 0);
  const egresos = movimientos.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + (m.cantidad || 0), 0);

  if (ingresos === 0 && egresos === 0) return null;

  const configuration = {
    type: 'bar',
    data: {
      labels: ['Ingresos', 'Egresos'],
      datasets: [{
        label: 'Unidades',
        data: [ingresos, egresos],
        backgroundColor: ['#28a745', '#dc3545']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Ingresos vs Egresos (Unidades)',
          font: { size: 16 }
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  };

  try {
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    return imageBuffer;
  } catch (error) {
    console.error('Error generando gráfico:', error);
    return null;
  }
};

// Helper para generar gráfico de inversión vs consumo
const generarGraficoInversionConsumo = async (movimientos) => {
  const invertido = movimientos.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + (m.costoTotal || 0), 0);
  const consumido = movimientos.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + (m.costoTotal || 0), 0);

  if (invertido === 0 && consumido === 0) return null;

  const configuration = {
    type: 'bar',
    data: {
      labels: ['Invertido', 'Consumido'],
      datasets: [{
        label: 'Monto ($)',
        data: [invertido, consumido],
        backgroundColor: ['#17a2b8', '#ffc107']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Inversión vs Consumo ($)',
          font: { size: 16 }
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  };

  try {
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    return imageBuffer;
  } catch (error) {
    console.error('Error generando gráfico:', error);
    return null;
  }
};

/**
 * Generar PDF de Inventario
 */
exports.generarPDFInventario = async (req, res) => {
  try {
    const { tipo, stock, busqueda } = req.query;

    const query = {};
    if (tipo && tipo !== 'todos') query.tipo = tipo;
    if (stock === 'sin-stock') query.existencia = { $eq: 0 };
    if (busqueda) {
      query.$or = [
        { referencia: { $regex: busqueda, $options: 'i' } },
        { nombre: { $regex: busqueda, $options: 'i' } },
        { equipo: { $regex: busqueda, $options: 'i' } }
      ];
    }

    const productos = await Product.find(query).sort({ referencia: 1 }).lean();

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Disposition', `attachment; filename=inventario_${new Date().toISOString().split('T')[0]}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    
    doc.pipe(res);

    // Encabezado
    doc.fontSize(20).text('Romero Panificados', { align: 'center' });
    doc.fontSize(16).text('Reporte de Inventario', { align: 'center' });
    doc.fontSize(10).text(`Generado: ${formatDate(new Date())}`, { align: 'center' });
    doc.moveDown();

    // Resumen
    const totalProductos = productos.length;
    const totalStock = productos.reduce((sum, p) => sum + (p.existencia || 0), 0);
    const valorTotal = productos.reduce((sum, p) => sum + (p.existencia * (p.costoUnitario || 0)), 0);
    const productosSinStock = productos.filter(p => p.existencia === 0).length;

    doc.fontSize(12).text(`Total de productos: ${totalProductos}`, { indent: 20 });
    doc.text(`Total en stock: ${totalStock} unidades`, { indent: 20 });
    doc.text(`Valor total del inventario: ${formatCurrency(valorTotal)}`, { indent: 20 });
    doc.text(`Productos sin stock: ${productosSinStock}`, { indent: 20 });
    doc.moveDown();

    // Agregar gráfico de distribución
    try {
      const graficoBuffer = await generarGraficoDistribucion(productos);
      if (graficoBuffer) {
        doc.addPage();
        doc.fontSize(14).text('Distribución por Tipo de Producto', { align: 'center' });
        doc.moveDown();
        doc.image(graficoBuffer, {
          fit: [500, 350],
          align: 'center',
          valign: 'center'
        });
        doc.moveDown();
      }
    } catch (error) {
      console.error('Error agregando gráfico al PDF:', error);
    }

    // Tabla de productos
    if (productos.length > 0) {
      let yPos = doc.y;
      const pageHeight = doc.page.height;
      const rowHeight = 20;
      const colWidths = [80, 150, 80, 60, 70, 80];
      
      // Encabezados de tabla
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Referencia', 50, yPos);
      doc.text('Nombre', 140, yPos);
      doc.text('Tipo', 290, yPos);
      doc.text('Stock', 370, yPos);
      doc.text('Costo Unit.', 440, yPos);
      doc.text('Valor Total', 520, yPos);
      yPos += rowHeight;
      
      // Línea separadora
      doc.moveTo(50, yPos - 5).lineTo(600, yPos - 5).stroke();
      yPos += 5;

      // Datos
      doc.font('Helvetica').fontSize(9);
      productos.forEach((producto, index) => {
        // Nueva página si es necesario
        if (yPos > pageHeight - 100) {
          doc.addPage();
          yPos = 50;
        }

        const stock = producto.existencia || 0;
        const costoUnit = producto.costoUnitario || 0;
        const valorTotal = stock * costoUnit;
        const colorStock = stock === 0 ? '#d9534f' : stock <= 4 ? '#f0ad4e' : '#000';

        doc.fillColor(colorStock);
        doc.text(producto.referencia || 'N/A', 50, yPos, { width: colWidths[0] });
        doc.text(producto.nombre || 'N/A', 140, yPos, { width: colWidths[1] });
        doc.fillColor('#000');
        doc.text(producto.tipo || 'N/A', 290, yPos, { width: colWidths[2] });
        doc.fillColor(colorStock).font('Helvetica-Bold');
        doc.text(stock.toString(), 370, yPos, { width: colWidths[3] });
        doc.fillColor('#000').font('Helvetica');
        doc.text(formatCurrency(costoUnit), 440, yPos, { width: colWidths[4] });
        doc.text(formatCurrency(valorTotal), 520, yPos, { width: colWidths[5] });
        
        yPos += rowHeight;
      });
    } else {
      doc.fontSize(12).text('No se encontraron productos con los filtros aplicados.', { indent: 20 });
    }

    doc.end();
  } catch (error) {
    console.error('Error generando PDF de inventario:', error);
    res.status(500).send('Error al generar el PDF');
  }
};

/**
 * Generar PDF de Movimientos
 */
exports.generarPDFMovimientos = async (req, res) => {
  try {
    const { tipo, mes, anio, referencia } = req.query;

    const query = {};
    if (tipo && tipo !== 'todos') query.tipo = tipo;
    if (referencia && referencia !== 'todos') query.referencia = referencia;
    if (mes || anio) {
      query.fecha = {};
      if (anio) {
        query.fecha.$gte = new Date(`${anio}-01-01`);
        query.fecha.$lt = new Date(`${parseInt(anio) + 1}-01-01`);
      }
      if (mes) {
        const mesNum = parseInt(mes);
        query.fecha.$gte = new Date(`${anio || new Date().getFullYear()}-${String(mesNum).padStart(2, '0')}-01`);
        query.fecha.$lt = new Date(`${anio || new Date().getFullYear()}-${String(mesNum + 1).padStart(2, '0')}-01`);
      }
    }

    const movimientos = await Movement.find(query)
      .populate('usuario', 'nombre email')
      .sort({ fecha: -1 })
      .limit(1000) // Limitar para no sobrecargar el PDF
      .lean();

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Disposition', `attachment; filename=movimientos_${new Date().toISOString().split('T')[0]}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    
    doc.pipe(res);

    // Encabezado
    doc.fontSize(20).text('Romero Panificados', { align: 'center' });
    doc.fontSize(16).text('Reporte de Movimientos', { align: 'center' });
    doc.fontSize(10).text(`Generado: ${formatDate(new Date())}`, { align: 'center' });
    doc.moveDown();

    // Resumen
    const ingresos = movimientos.filter(m => m.tipo === 'ingreso');
    const egresos = movimientos.filter(m => m.tipo === 'egreso');
    const totalIngresos = ingresos.reduce((sum, m) => sum + (m.cantidad || 0), 0);
    const totalEgresos = egresos.reduce((sum, m) => sum + (m.cantidad || 0), 0);
    const valorIngresos = ingresos.reduce((sum, m) => sum + (m.costoTotal || 0), 0);
    const valorEgresos = egresos.reduce((sum, m) => sum + (m.costoTotal || 0), 0);

    doc.fontSize(12);
    doc.text(`Total de movimientos: ${movimientos.length}`, { indent: 20 });
    doc.text(`Ingresos: ${totalIngresos} unidades - ${formatCurrency(valorIngresos)}`, { indent: 20 });
    doc.text(`Egresos: ${totalEgresos} unidades - ${formatCurrency(valorEgresos)}`, { indent: 20 });
    doc.moveDown();

    // Agregar gráficos
    try {
      // Gráfico de Ingresos vs Egresos
      const graficoCantidades = await generarGraficoIngresosEgresos(movimientos);
      if (graficoCantidades) {
        doc.addPage();
        doc.fontSize(14).text('Ingresos vs Egresos (Unidades)', { align: 'center' });
        doc.moveDown();
        doc.image(graficoCantidades, {
          fit: [500, 300],
          align: 'center',
          valign: 'center'
        });
        doc.moveDown();
      }

      // Gráfico de Inversión vs Consumo
      const graficoFinanciero = await generarGraficoInversionConsumo(movimientos);
      if (graficoFinanciero) {
        doc.addPage();
        doc.fontSize(14).text('Inversión vs Consumo ($)', { align: 'center' });
        doc.moveDown();
        doc.image(graficoFinanciero, {
          fit: [500, 300],
          align: 'center',
          valign: 'center'
        });
        doc.moveDown();
      }
    } catch (error) {
      console.error('Error agregando gráficos al PDF:', error);
    }

    // Tabla
    if (movimientos.length > 0) {
      let yPos = doc.y;
      const rowHeight = 25;

      // Encabezados
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Fecha', 50, yPos, { width: 80 });
      doc.text('Tipo', 140, yPos, { width: 60 });
      doc.text('Referencia', 210, yPos, { width: 100 });
      doc.text('Cant.', 320, yPos, { width: 50 });
      doc.text('Costo', 380, yPos, { width: 80 });
      doc.text('Total', 470, yPos, { width: 80 });
      doc.text('Usuario', 560, yPos, { width: 100 });
      yPos += rowHeight;
      doc.moveTo(50, yPos - 5).lineTo(660, yPos - 5).stroke();

      // Datos
      doc.font('Helvetica').fontSize(8);
      movimientos.forEach((mov) => {
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
          yPos = 50;
        }
        
        const color = mov.tipo === 'ingreso' ? '#28a745' : '#dc3545';
        doc.fillColor(color);
        doc.text(formatDate(mov.fecha), 50, yPos, { width: 80 });
        doc.text(mov.tipo === 'ingreso' ? 'INGRESO' : 'EGRESO', 140, yPos, { width: 60 });
        doc.fillColor('#000');
        doc.text(mov.referencia || 'N/A', 210, yPos, { width: 100 });
        doc.text((mov.cantidad || 0).toString(), 320, yPos, { width: 50 });
        doc.text(formatCurrency(mov.costoUnitario), 380, yPos, { width: 80 });
        doc.text(formatCurrency(mov.costoTotal), 470, yPos, { width: 80 });
        doc.text(mov.usuario ? (mov.usuario.nombre || mov.usuario.email) : 'Sistema', 560, yPos, { width: 100 });
        
        yPos += rowHeight;
      });
    }

    doc.end();
  } catch (error) {
    console.error('Error generando PDF de movimientos:', error);
    res.status(500).send('Error al generar el PDF');
  }
};

/**
 * Generar PDF de Mantenimientos
 */
exports.generarPDFMantenimientos = async (req, res) => {
  try {
    const { estado } = req.query;

    const query = {};
    if (estado && estado !== 'todos') query.estado = estado;

    const mantenimientos = await Maintenance.find(query)
      .populate('producto', 'referencia nombre')
      .populate('tecnico', 'nombre email')
      .sort({ fechaVencimiento: 1 })
      .lean();

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Disposition', `attachment; filename=mantenimientos_${new Date().toISOString().split('T')[0]}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    
    doc.pipe(res);

    // Encabezado
    doc.fontSize(20).text('Romero Panificados', { align: 'center' });
    doc.fontSize(16).text('Reporte de Mantenimientos', { align: 'center' });
    doc.fontSize(10).text(`Generado: ${formatDate(new Date())}`, { align: 'center' });
    doc.moveDown();

    // Resumen
    const activos = mantenimientos.filter(m => m.estado === 'activo');
    const completados = mantenimientos.filter(m => m.estado === 'completado');
    const vencidos = activos.filter(m => new Date(m.fechaVencimiento) < new Date());

    doc.fontSize(12);
    doc.text(`Total de mantenimientos: ${mantenimientos.length}`, { indent: 20 });
    doc.text(`Activos: ${activos.length}`, { indent: 20 });
    doc.text(`Completados: ${completados.length}`, { indent: 20 });
    doc.text(`Vencidos: ${vencidos.length}`, { indent: 20 });
    doc.moveDown();

    // Tabla
    if (mantenimientos.length > 0) {
      let yPos = doc.y;
      const rowHeight = 30;

      // Encabezados
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Producto', 50, yPos, { width: 100 });
      doc.text('Equipo', 160, yPos, { width: 120 });
      doc.text('Estado', 290, yPos, { width: 70 });
      doc.text('Vencimiento', 370, yPos, { width: 100 });
      doc.text('Técnico', 480, yPos, { width: 120 });
      yPos += rowHeight;
      doc.moveTo(50, yPos - 5).lineTo(600, yPos - 5).stroke();

      // Datos
      doc.font('Helvetica').fontSize(8);
      mantenimientos.forEach((mant) => {
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
          yPos = 50;
        }

        const productoRef = mant.producto ? (mant.producto.referencia || mant.producto.nombre) : 'N/A';
        const tecnicoNombre = mant.tecnico ? (mant.tecnico.nombre || mant.tecnico.email) : 'N/A';
        const esVencido = mant.estado === 'activo' && new Date(mant.fechaVencimiento) < new Date();
        const color = esVencido ? '#d9534f' : mant.estado === 'activo' ? '#5cb85c' : '#6c757d';

        doc.fillColor(color).font('Helvetica-Bold');
        doc.text(productoRef, 50, yPos, { width: 100 });
        doc.fillColor('#000').font('Helvetica');
        doc.text(mant.equipo || 'N/A', 160, yPos, { width: 120 });
        doc.fillColor(color).font('Helvetica-Bold');
        doc.text(mant.estado.toUpperCase(), 290, yPos, { width: 70 });
        doc.fillColor('#000');
        doc.text(formatDate(mant.fechaVencimiento), 370, yPos, { width: 100 });
        doc.text(tecnicoNombre, 480, yPos, { width: 120 });
        
        yPos += rowHeight;
      });
    }

    doc.end();
  } catch (error) {
    console.error('Error generando PDF de mantenimientos:', error);
    res.status(500).send('Error al generar el PDF');
  }
};

/**
 * Generar PDF de Auditoría
 */
exports.generarPDFAuditoria = async (req, res) => {
  try {
    const { usuario, accion, entidad, fechaDesde, fechaHasta } = req.query;

    const query = {};
    if (usuario && usuario !== 'todos') query.usuario = usuario;
    if (accion && accion !== 'todos') query.accion = accion;
    if (entidad && entidad !== 'todos') query.entidad = entidad;
    if (fechaDesde || fechaHasta) {
      query.fecha = {};
      if (fechaDesde) query.fecha.$gte = new Date(fechaDesde);
      if (fechaHasta) {
        const hasta = new Date(fechaHasta);
        hasta.setHours(23, 59, 59, 999);
        query.fecha.$lte = hasta;
      }
    }

    const registros = await RegistroAuditoria.find(query)
      .populate('usuario', 'nombre email')
      .sort({ fecha: -1 })
      .limit(500)
      .lean();

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Disposition', `attachment; filename=auditoria_${new Date().toISOString().split('T')[0]}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    
    doc.pipe(res);

    // Encabezado
    doc.fontSize(20).text('Romero Panificados', { align: 'center' });
    doc.fontSize(16).text('Reporte de Auditoría', { align: 'center' });
    doc.fontSize(10).text(`Generado: ${formatDate(new Date())}`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Total de registros: ${registros.length}`, { indent: 20 });
    doc.moveDown();

    // Tabla
    if (registros.length > 0) {
      let yPos = doc.y;
      const rowHeight = 35;

      // Encabezados
      doc.fontSize(8).font('Helvetica-Bold');
      doc.text('Fecha', 50, yPos, { width: 80 });
      doc.text('Usuario', 140, yPos, { width: 100 });
      doc.text('Acción', 250, yPos, { width: 70 });
      doc.text('Entidad', 330, yPos, { width: 100 });
      doc.text('Detalles', 440, yPos, { width: 150 });
      yPos += rowHeight;
      doc.moveTo(50, yPos - 5).lineTo(590, yPos - 5).stroke();

      // Datos
      doc.font('Helvetica').fontSize(7);
      registros.forEach((reg) => {
        if (doc.y > doc.page.height - 120) {
          doc.addPage();
          yPos = 50;
        }

        const usuarioNombre = reg.usuario ? (reg.usuario.nombre || reg.usuario.email) : 'Sistema';
        const detallesStr = reg.detalles ? JSON.stringify(reg.detalles).substring(0, 50) + '...' : '-';

        doc.fillColor('#000');
        doc.text(formatDate(reg.fecha), 50, yPos, { width: 80 });
        doc.text(usuarioNombre, 140, yPos, { width: 100 });
        
        const colorAccion = reg.accion === 'CREAR' ? '#28a745' : reg.accion === 'MODIFICAR' ? '#ffc107' : reg.accion === 'ELIMINAR' ? '#dc3545' : '#6c757d';
        doc.fillColor(colorAccion);
        doc.text(reg.accion, 250, yPos, { width: 70 });
        doc.fillColor('#000');
        doc.text(reg.entidad, 330, yPos, { width: 100 });
        doc.text(detallesStr, 440, yPos, { width: 150 });
        
        yPos += rowHeight;
      });
    }

    doc.end();
  } catch (error) {
    console.error('Error generando PDF de auditoría:', error);
    res.status(500).send('Error al generar el PDF');
  }
};

