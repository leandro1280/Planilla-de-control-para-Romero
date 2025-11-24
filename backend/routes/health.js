/**
 * Health Check Endpoint
 * Usado para monitoreo y verificación de estado del servidor
 */

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

/**
 * GET /health
 * Endpoint básico de health check
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

/**
 * GET /health/detailed
 * Health check detallado con estado de servicios
 */
router.get('/detailed', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: {
        status: 'unknown',
        connected: false
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      }
    }
  };

  // Verificar estado de MongoDB
  try {
    const dbState = mongoose.connection.readyState;
    health.services.database.connected = dbState === 1;
    health.services.database.status = dbState === 1 ? 'connected' : 
                                      dbState === 2 ? 'connecting' : 
                                      dbState === 3 ? 'disconnecting' : 'disconnected';
    
    if (dbState === 1) {
      // Si está conectado, hacer un ping rápido
      await mongoose.connection.db.admin().ping();
      health.services.database.latency = 'ok';
    }
  } catch (error) {
    health.services.database.status = 'error';
    health.services.database.error = error.message;
    health.status = 'degraded';
  }

  // Si algún servicio crítico está caído, cambiar status
  if (!health.services.database.connected) {
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * GET /health/ready
 * Kubernetes readiness probe
 * Retorna 200 solo si el servicio está listo para recibir tráfico
 */
router.get('/ready', async (req, res) => {
  try {
    // Verificar que MongoDB esté conectado
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: 'not ready',
        reason: 'database not connected'
      });
    }

    // Hacer un ping rápido a la base de datos
    await mongoose.connection.db.admin().ping();

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      reason: error.message
    });
  }
});

/**
 * GET /health/live
 * Kubernetes liveness probe
 * Retorna 200 si el proceso está vivo
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;

