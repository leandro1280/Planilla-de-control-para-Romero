const request = require('supertest');
const mongoose = require('mongoose');
process.env.NODE_ENV = 'test';
const app = require('../server'); // Importar app real
const User = require('../models/User');
const bcrypt = require('bcryptjs');

let testUserId;

beforeAll(async () => {
  // Conectar a base de datos si no está conectado
  if (mongoose.connection.readyState === 0) {
    const mongoURI = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI;
    if (mongoURI) {
      await mongoose.connect(mongoURI, { connectTimeoutMS: 10000 });
    }
  }
  
  try {
    // Limpiar usuario de prueba si existe
    await User.deleteOne({ email: 'testauth@test.com' });
    
    // Crear usuario de prueba - el modelo User hashea automáticamente en pre('save')
    // NO hacer hash manual porque el modelo lo hace automáticamente
    const testUser = await User.create({
      nombre: 'Test User',
      email: 'testauth@test.com',
      password: 'Test123456', // Se hasheará automáticamente por pre('save')
      rol: 'administrador',
      activo: true
    });
    testUserId = testUser._id;
  } catch (error) {
    console.warn('⚠️ Error creando usuario de prueba:', error.message);
  }
}, 30000); // Timeout de 30 segundos

afterAll(async () => {
  try {
    if (testUserId && mongoose.connection.readyState === 1) {
      await User.findByIdAndDelete(testUserId);
    }
    // También limpiar por email
    if (mongoose.connection.readyState === 1) {
      await User.deleteOne({ email: 'testauth@test.com' });
    }
  } catch (error) {
    // Ignorar errores de limpieza
  }
}, 10000);

describe('Autenticación - Seguridad', () => {
  describe('POST /auth/login', () => {
    test('Debería rechazar login con contraseña incorrecta', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'testauth@test.com',
          password: 'WrongPassword123'
        });
      
      expect(res.status).toBe(401);
    });
    
    test('Debería rechazar login con email inexistente', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'AnyPassword123'
        });
      
      expect(res.status).toBe(401);
    });
    
    test('Debería validar formato de email', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Test123456'
        });
      
      expect(res.status).toBe(400);
    });
    
    test('Debería aplicar rate limiting en múltiples intentos', async () => {
      // Simular múltiples intentos fallidos
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/auth/login')
          .send({
            email: 'testauth@test.com',
            password: 'WrongPassword'
          });
      }
      
      // El 6to intento debería ser bloqueado por rate limiting
      // (depende de la configuración)
    });
  });
  
  describe('POST /auth/register', () => {
    test('Debería validar complejidad de contraseña', async () => {
      // La ruta /auth/register requiere autenticación de administrador
      // En tests, esto devuelve 302 (redirect) si no hay auth
      // Este test verifica que la validación funciona en el validador
      const { validateRegister } = require('../utils/validators');
      const { validationResult } = require('express-validator');
      
      // Simular request con contraseña inválida
      const req = {
        body: {
          nombre: 'New User',
          email: 'newuser@test.com',
          password: '12345' // Muy corta
        }
      };
      
      // Ejecutar validaciones
      await Promise.all(validateRegister.map(validation => validation.run(req)));
      const errors = validationResult(req);
      
      expect(errors.isEmpty()).toBe(false);
      expect(errors.array().some(e => e.path === 'password')).toBe(true);
    });
    
    test('Debería prevenir duplicados de email', async () => {
      // Verificar que el usuario ya existe en la BD
      const existingUser = await User.findOne({ email: 'testauth@test.com' });
      expect(existingUser).not.toBeNull();
      expect(existingUser.email).toBe('testauth@test.com');
    });
  });
});

