/**
 * Middleware para validar y sanitizar archivos Excel antes de procesarlos
 * Mitiga vulnerabilidades conocidas en xlsx (Prototype Pollution, ReDoS)
 */

const fs = require('fs');
const path = require('path');

// Validar tipo MIME
const ALLOWED_MIMES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv' // .csv
];

// Validar extensión de archivo
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

// Límite de tamaño (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Validar archivo Excel antes de procesarlo
 */
exports.validateExcelFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No se ha subido ningún archivo'
    });
  }

  const file = req.file;

  // 1. Validar tamaño
  if (file.size > MAX_FILE_SIZE) {
    return res.status(400).json({
      success: false,
      message: `El archivo es demasiado grande. Tamaño máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`
    });
  }

  // 2. Validar extensión
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return res.status(400).json({
      success: false,
      message: `Extensión no permitida. Solo se permiten: ${ALLOWED_EXTENSIONS.join(', ')}`
    });
  }

  // 3. Validar tipo MIME
  if (!ALLOWED_MIMES.includes(file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'Tipo de archivo no permitido'
    });
  }

  // 4. Limitar tamaño del buffer (protección adicional)
  if (file.buffer && file.buffer.length > MAX_FILE_SIZE) {
    return res.status(400).json({
      success: false,
      message: 'Archivo demasiado grande'
    });
  }

  // 5. Validar que el buffer no esté vacío
  if (!file.buffer || file.buffer.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'El archivo está vacío'
    });
  }

  // 6. Verificar primeros bytes (magic number) para .xlsx
  if (ext === '.xlsx') {
    const magicNumber = file.buffer.slice(0, 4);
    // ZIP file signature (xlsx files are ZIP archives)
    const zipSignature = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
    if (!magicNumber.equals(zipSignature) && 
        !magicNumber.equals(Buffer.from([0x50, 0x4B, 0x05, 0x06])) && // Empty ZIP
        !magicNumber.equals(Buffer.from([0x50, 0x4B, 0x07, 0x08]))) { // ZIP with data descriptor
      return res.status(400).json({
        success: false,
        message: 'El archivo no es un archivo Excel válido'
      });
    }
  }

  // Todo válido, continuar
  next();
};

/**
 * Sanitizar datos del Excel antes de procesarlos
 * Previene Prototype Pollution limpiando objetos
 */
exports.sanitizeExcelData = (rows) => {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map(row => {
    if (typeof row !== 'object' || row === null) {
      return row;
    }

    // Crear nuevo objeto sin prototype (previene prototype pollution)
    const sanitized = Object.create(null);
    
    for (const key in row) {
      // Solo copiar propiedades propias (no del prototype)
      if (Object.prototype.hasOwnProperty.call(row, key)) {
        // Rechazar keys peligrosas (__proto__, constructor, etc.)
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue;
        }
        
        // Sanitizar valores
        let value = row[key];
        if (typeof value === 'string') {
          // Limitar longitud para prevenir ReDoS
          if (value.length > 10000) {
            value = value.substring(0, 10000);
          }
        }
        
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  });
};

