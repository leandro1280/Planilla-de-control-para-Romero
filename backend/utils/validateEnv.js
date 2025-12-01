/**
 * Validación de variables de entorno críticas
 * Se ejecuta al inicio del servidor para asegurar que todas las variables necesarias estén definidas
 */

const requiredEnvVars = {
  production: [
    'MONGODB_URI',
    'JWT_SECRET',
    'NODE_ENV'
  ],
  development: [
    'MONGODB_URI',
    'JWT_SECRET'
  ],
  test: [
    'MONGODB_URI'
  ]
};

const optionalEnvVars = {
  EMAIL_HOST: 'smtp.gmail.com',
  EMAIL_PORT: '587',
  EMAIL_USER: '',
  EMAIL_PASS: '',
  EMAIL_ALERT_TO: 'pc1manromero@gmail.com', // Email por defecto para todas las alertas
  EMAIL_ALERT_STOCK: 'pc1manromero@gmail.com', // Email específico para alertas de stock
  EMAIL_ALERT_MANTENIMIENTO: 'pc1manromero@gmail.com', // Email específico para alertas de mantenimiento
  PORT: '3000'
};

/**
 * Valida que todas las variables de entorno requeridas estén definidas
 * @throws {Error} Si falta alguna variable crítica
 */
function validateEnvironment() {
  const env = process.env.NODE_ENV || 'development';
  const required = requiredEnvVars[env] || requiredEnvVars.development;
  const missing = [];

  // Verificar variables requeridas
  required.forEach(varName => {
    if (!process.env[varName] || process.env[varName].trim() === '') {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    const errorMessage = `
❌ ERROR: Variables de entorno faltantes (${env}):
${missing.map(v => `   - ${v}`).join('\n')}

Por favor, configura estas variables en tu archivo .env
    `.trim();
    
    console.error(errorMessage);
    
    // En producción, esto es crítico
    if (env === 'production') {
      console.error('❌ CRÍTICO: El servidor no puede iniciar sin estas variables');
      process.exit(1);
    }
    
    // En desarrollo/test, solo advertir
    console.warn('⚠️  El servidor continuará, pero algunas funciones pueden no estar disponibles');
  }

  // Validar valores de variables críticas
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  ADVERTENCIA: JWT_SECRET debería tener al menos 32 caracteres para mayor seguridad');
  }

  if (process.env.MONGODB_URI && !process.env.MONGODB_URI.startsWith('mongodb')) {
    console.warn('⚠️  ADVERTENCIA: MONGODB_URI no parece ser una URI válida de MongoDB');
  }

  // Establecer valores por defecto para variables opcionales
  Object.keys(optionalEnvVars).forEach(varName => {
    if (!process.env[varName]) {
      process.env[varName] = optionalEnvVars[varName];
      if (env === 'development') {
        console.log(`ℹ️  Variable opcional ${varName} no definida, usando valor por defecto: ${optionalEnvVars[varName]}`);
      }
    }
  });

  // Validar PORT es un número válido
  const port = parseInt(process.env.PORT || '3000', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    console.error(`❌ ERROR: PORT debe ser un número entre 1 y 65535, recibido: ${process.env.PORT}`);
    if (env === 'production') {
      process.exit(1);
    }
  }

  console.log('✅ Validación de variables de entorno completada');
}

module.exports = { validateEnvironment };

