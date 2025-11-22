const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento (en memoria para procesar directamente)
const storage = multer.memoryStorage();

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/vnd.ms-excel', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
    'text/csv'
  ];
  
  if (allowedTypes.includes(file.mimetype) || 
      file.originalname.endsWith('.xlsx') || 
      file.originalname.endsWith('.xls') || 
      file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no soportado. Por favor sube un archivo Excel (.xlsx, .xls) o CSV.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  }
});

module.exports = upload;