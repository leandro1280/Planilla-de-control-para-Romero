const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Product = require('../models/Product');
const User = require('../models/User');

// Datos de prueba
let authToken;
let testUser;
let testProductId;

// Antes de todas las pruebas
beforeAll(async () => {
  // Conectar a base de datos de prueba
  const mongoURI = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI;
  await mongoose.connect(mongoURI);
  
  // Crear usuario de prueba
  testUser = await User.create({
    nombre: 'Usuario Test',
    email: 'test@test.com',
    password: 'Test123456',
    rol: 'administrador',
    activo: true
  });
  
  // Login para obtener token
  const loginRes = await request(app)
    .post('/auth/login')
    .send({
      email: 'test@test.com',
      password: 'Test123456'
    });
  
  authToken = loginRes.body.token;
});

// Después de todas las pruebas
afterAll(async () => {
  // Limpiar datos de prueba
  if (testUser) await User.findByIdAndDelete(testUser._id);
  if (testProductId) await Product.findByIdAndDelete(testProductId);
  await mongoose.connection.close();
});

describe('Inventario Controller', () => {
  describe('GET /inventario', () => {
    test('Debería obtener lista de productos con autenticación', async () => {
      const res = await request(app)
        .get('/inventario')
        .set('Cookie', `token=${authToken}`)
        .expect(200);
      
      expect(res.text).toContain('Inventario');
    });
    
    test('Debería rechazar acceso sin autenticación', async () => {
      const res = await request(app)
        .get('/inventario')
        .expect(302); // Redirect a login
    });
    
    test('Debería filtrar productos por tipo', async () => {
      const res = await request(app)
        .get('/inventario?tipo=Cadena')
        .set('Cookie', `token=${authToken}`)
        .expect(200);
      
      expect(res.text).toContain('Inventario');
    });
  });
  
  describe('POST /inventario/productos', () => {
    test('Debería crear un producto válido', async () => {
      const productoData = {
        referencia: 'TEST-PROD-001',
        nombre: 'Producto de Prueba',
        existencia: 10,
        tipo: 'Test',
        costoUnitario: 100
      };
      
      const res = await request(app)
        .post('/inventario/productos')
        .set('Cookie', `token=${authToken}`)
        .send(productoData)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.referencia).toBe('TEST-PROD-001');
      testProductId = res.body.data._id;
    });
    
    test('Debería rechazar producto con referencia inválida (caracteres especiales)', async () => {
      const productoData = {
        referencia: 'TEST-<script>alert("xss")</script>',
        nombre: 'Producto Malicioso',
        existencia: 10
      };
      
      const res = await request(app)
        .post('/inventario/productos')
        .set('Cookie', `token=${authToken}`)
        .send(productoData)
        .expect(400);
      
      expect(res.body.success).toBe(false);
    });
    
    test('Debería rechazar producto sin campos obligatorios', async () => {
      const res = await request(app)
        .post('/inventario/productos')
        .set('Cookie', `token=${authToken}`)
        .send({})
        .expect(400);
      
      expect(res.body.success).toBe(false);
    });
    
    test('Debería rechazar existencia negativa', async () => {
      const productoData = {
        referencia: 'TEST-NEG-001',
        nombre: 'Producto Negativo',
        existencia: -5
      };
      
      const res = await request(app)
        .post('/inventario/productos')
        .set('Cookie', `token=${authToken}`)
        .send(productoData)
        .expect(400);
      
      expect(res.body.success).toBe(false);
    });
  });
  
  describe('PUT /inventario/productos/:id', () => {
    test('Debería actualizar un producto existente', async () => {
      if (!testProductId) {
        // Crear producto si no existe
        const producto = await Product.create({
          referencia: 'TEST-UPDATE-001',
          nombre: 'Producto Actualizar',
          existencia: 10,
          creadoPor: testUser._id
        });
        testProductId = producto._id;
      }
      
      const res = await request(app)
        .put(`/inventario/productos/${testProductId}`)
        .set('Cookie', `token=${authToken}`)
        .send({
          nombre: 'Producto Actualizado',
          existencia: 20
        })
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.nombre).toBe('Producto Actualizado');
    });
    
    test('Debería rechazar actualización con ID inválido', async () => {
      const res = await request(app)
        .put('/inventario/productos/invalid-id-123')
        .set('Cookie', `token=${authToken}`)
        .send({
          nombre: 'Test'
        })
        .expect(400);
      
      expect(res.body.success).toBe(false);
    });
  });
  
  describe('POST /inventario/movimientos', () => {
    test('Debería crear un movimiento válido', async () => {
      if (!testProductId) {
        const producto = await Product.create({
          referencia: 'TEST-MOV-001',
          nombre: 'Producto Movimiento',
          existencia: 10,
          creadoPor: testUser._id
        });
        testProductId = producto._id;
      }
      
      const producto = await Product.findById(testProductId);
      
      const res = await request(app)
        .post('/inventario/movimientos')
        .set('Cookie', `token=${authToken}`)
        .send({
          referencia: producto.referencia,
          tipo: 'ingreso',
          cantidad: 5
        })
        .expect(200);
      
      expect(res.body.success).toBe(true);
    });
    
    test('Debería rechazar movimiento sin stock suficiente', async () => {
      const producto = await Product.findOne({ referencia: 'TEST-MOV-001' });
      
      if (producto) {
        const res = await request(app)
          .post('/inventario/movimientos')
          .set('Cookie', `token=${authToken}`)
          .send({
            referencia: producto.referencia,
            tipo: 'egreso',
            cantidad: 999999 // Cantidad imposible
          })
          .expect(400);
        
        expect(res.body.success).toBe(false);
      }
    });
  });
});

describe('Validaciones de Seguridad', () => {
  test('Debería sanitizar inputs contra XSS', async () => {
    const res = await request(app)
      .post('/inventario/productos')
      .set('Cookie', `token=${authToken}`)
      .send({
        referencia: 'TEST-XSS',
        nombre: '<script>alert("XSS")</script>Producto',
        existencia: 10
      })
      .expect(400); // Debe rechazar por validación
  });
  
  test('Debería prevenir NoSQL injection', async () => {
    const res = await request(app)
      .get('/inventario')
      .set('Cookie', `token=${authToken}`)
      .query({
        busqueda: { $ne: null }, // Intento de inyección
        tipo: { $gt: '' }
      })
      .expect(200); // Debe sanitizar y no romper
  });
});

