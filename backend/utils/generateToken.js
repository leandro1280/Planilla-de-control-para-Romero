const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'romero_panificados_secret_key_default_cambiar_en_produccion_2024';
  
  if (!secret) {
    throw new Error('JWT_SECRET no está configurado. Por favor crea un archivo .env con JWT_SECRET');
  }
  
  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

module.exports = generateToken;

