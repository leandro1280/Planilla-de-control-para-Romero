/**
 * Script para mantener el servicio despierto en Render (Plan FREE)
 * 
 * Este script hace ping al health check cada 10 minutos para evitar que el servicio se duerma
 * 
 * USO:
 * 1. Configurar en un servicio separado de Render (Cron Job)
 * 2. O usar un servicio externo como UptimeRobot
 * 
 * Para Render Cron Job:
 * - Schedule: */10 * * * * (cada 10 minutos)
 * - Command: node scripts/keep-alive.js
 * - Environment: Agregar RENDER_URL=https://tu-app.onrender.com
 */

const https = require('https');
const http = require('http');

const RENDER_URL = process.env.RENDER_URL || 'https://tu-app.onrender.com';

function pingHealthCheck() {
  const url = new URL(RENDER_URL);
  const protocol = url.protocol === 'https:' ? https : http;
  const path = '/health';

  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: path,
    method: 'GET',
    timeout: 10000
  };

  const req = protocol.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log(`✅ Health check OK: ${new Date().toISOString()}`);
        try {
          const json = JSON.parse(data);
          console.log(`   Status: ${json.status}, Uptime: ${json.uptime}s`);
        } catch (e) {
          // Ignorar error de parse
        }
      } else {
        console.error(`❌ Health check failed: Status ${res.statusCode}`);
      }
    });
  });

  req.on('error', (error) => {
    console.error(`❌ Error pinging health check:`, error.message);
  });

  req.on('timeout', () => {
    req.destroy();
    console.error(`❌ Health check timeout`);
  });

  req.end();
}

// Ejecutar inmediatamente
console.log(`🔄 Pinging ${RENDER_URL}/health...`);
pingHealthCheck();

// Si se ejecuta como script standalone, salir
if (require.main === module) {
  setTimeout(() => {
    process.exit(0);
  }, 15000); // Salir después de 15 segundos
}

module.exports = { pingHealthCheck };

