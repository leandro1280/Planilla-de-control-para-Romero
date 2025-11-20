const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Product = require('../models/Product');
const Movement = require('../models/Movement');

// Rutas de API (para AJAX/fetch)
router.use(protect);

// Obtener productos (JSON)
router.get('/productos', async (req, res) => {
  try {
    const { busqueda, tipo, stock } = req.query;
    
    const query = {};
    
    if (busqueda) {
      query.$or = [
        { referencia: { $regex: busqueda, $options: 'i' } },
        { nombre: { $regex: busqueda, $options: 'i' } },
        { equipo: { $regex: busqueda, $options: 'i' } }
      ];
    }
    
    if (tipo && tipo !== 'todos') {
      query.tipo = tipo;
    }
    
    if (stock === 'criticos') {
      query.existencia = { $lte: 4 };
    } else if (stock === 'bajo') {
      query.existencia = { $lt: 10 };
    }
    
    const products = await Product.find(query).sort({ referencia: 1 });
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Obtener estadísticas para gráficos
router.get('/estadisticas', async (req, res) => {
  try {
    const { tipoProducto, referencia } = req.query;
    
    const query = {};
    if (tipoProducto && tipoProducto !== 'todos') {
      query.tipoProducto = tipoProducto;
    }
    if (referencia && referencia !== 'todos') {
      query.referencia = referencia.toUpperCase();
    }
    
    const movements = await Movement.find(query)
      .populate('producto', 'nombre tipo')
      .sort({ createdAt: -1 });
    
    const ingresos = movements.filter(m => m.tipo === 'ingreso');
    const egresos = movements.filter(m => m.tipo === 'egreso');
    
    const totalIngresos = ingresos.reduce((acc, m) => acc + m.cantidad, 0);
    const totalEgresos = egresos.reduce((acc, m) => acc + m.cantidad, 0);
    const totalInvertido = ingresos.reduce((acc, m) => acc + m.costoTotal, 0);
    const totalConsumido = egresos.reduce((acc, m) => acc + m.costoTotal, 0);
    
    // Por tipo de producto
    const porTipo = {};
    movements.forEach(mov => {
      const tipo = mov.tipoProducto || 'Sin tipo';
      if (!porTipo[tipo]) {
        porTipo[tipo] = { ingresos: 0, egresos: 0, invertido: 0, consumido: 0 };
      }
      if (mov.tipo === 'ingreso') {
        porTipo[tipo].ingresos += mov.cantidad;
        porTipo[tipo].invertido += mov.costoTotal;
      } else {
        porTipo[tipo].egresos += mov.cantidad;
        porTipo[tipo].consumido += mov.costoTotal;
      }
    });
    
    // Top egresos
    const egresosPorRef = {};
    egresos.forEach(e => {
      if (!egresosPorRef[e.referencia]) {
        egresosPorRef[e.referencia] = 0;
      }
      egresosPorRef[e.referencia] += e.cantidad;
    });
    
    const topEgresos = Object.entries(egresosPorRef)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ref, cant]) => ({ referencia: ref, cantidad: cant }));
    
    res.json({
      success: true,
      data: {
        totalIngresos,
        totalEgresos,
        totalInvertido,
        totalConsumido,
        porTipo,
        topEgresos
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Rutas de notificaciones (solo para administradores)
router.use('/notificaciones', require('./notificaciones'));

module.exports = router;

