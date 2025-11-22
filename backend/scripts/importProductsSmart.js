const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
const XLSX = require('xlsx');

// ============================================
// MOTOR DE INFERENCIA INTELIGENTE
// ============================================
class SmartTypeInference {
  constructor() {
    // Diccionario de patrones conocidos (expandido con análisis inteligente)
    this.patternRules = {
      // Patrones por referencia (prefijos de códigos)
      referencia: {
        // Mecánicos básicos
        'CAD': 'Cadena',
        'ROD': 'Rodamiento',
        'COR': 'Correa',
        'RET': 'Retén',
        'SELLOH': 'Sello',
        'FIL': 'Filtro',
        'PER': 'Perno',
        'UNI': 'Unión',
        'BUJ': 'Bujía',
        'TEN': 'Tensor',
        'PUL': 'Polea',
        'PIÑ': 'Piñón',
        'CORON': 'Corona',
        'BAN': 'Banda',
        'BAND': 'Banda',
        
        // Fluidos y lubricantes
        'ACE': 'Aceite',
        'ACEI': 'Aceite',
        'LUB': 'Lubricante',
        'LUBR': 'Lubricante',
        'GRA': 'Grasa',
        'GRAF': 'Grasa',
        'LIM': 'Limpiador',
        'DES': 'Desengrasante',
        'DIL': 'Diluyente',
        'SOL-': 'Solvente', // Solo cuando es prefijo con guión (SOL-5589)
        'SOLVENTE': 'Solvente',
        'TIN': 'Tinta',
        
        // Herramientas
        'HER': 'Herramienta',
        'MECH': 'Mecha',
        'FER': 'Ferretería',
        
        // Eléctricos
        'CAP': 'Capacitor',
        'CONT': 'Controlador',
        'CON': 'Contactor',
        'TER': 'Térmica',
        'REL': 'Relé',
        'MAN': 'Manómetro',
        'VAL': 'Válvula',
        'PRE': 'Presostato',
        'SEN': 'Sensor',
        'INT': 'Interruptor',
        'TRA': 'Transformador',
        'VAR': 'Variador',
        'TEST': 'Testigo',
        'PULS': 'Pulsador',
        'SEL': 'Selector',
        'SOC': 'Soclet',
        'DIY': 'Disyuntor',
        'BOR': 'Bornera',
        'CAB': 'Cable',
        'CIERRE': 'Cierre',
        
        // Neumáticos/Hidráulicos
        'SOL-MF': 'Solenoide',
        'SOL-SERIE': 'Solenoide',
        'SOLENOIDE': 'Solenoide',
        'ELECT': 'Electroválvula',
        'VIBR': 'Vibrador',
        'PISTON': 'Pistón',
        'COMPR': 'Compresor',
        
        // Componentes de máquinas
        'RED-ALFA': 'Reductor',
        'RED-STM': 'Reductor',
        'REDUCTOR': 'Reductor',
        'RED-H-M': 'Reducción',
        'RED-3/4': 'Reducción',
        'RED-1': 'Reducción',
        'RED-2': 'Reducción',
        'MOT': 'Motor',
        'TURB': 'Turbina',
        'CUCH': 'Cuchilla',
        'CUCHA': 'Cuchara',
        'PAL': 'Paleta',
        'INP': 'Impulsor',
        'EJE': 'Eje',
        'RODI': 'Rodillo',
        'PUN': 'Puntera',
        'ROT': 'Rotula',
        'DIF': 'Difusor',
        
        // Accesorios y conexiones
        'TAP': 'Tapón',
        'ENT': 'Entrerrosca',
        'CUP': 'Cupla',
        'COD': 'Codo',
        'CUR': 'Curva',
        'RED': 'Reducción',
        'NIP': 'Niple',
        'FLEX': 'Flexible',
        'SOG': 'Soga',
        
        // Otros componentes
        'BANC': 'Bancada',
        'FL': 'Bancada',
        'UCP': 'Bancada',
        'ALI': 'Alimentación',
        'ALI-CUCH': 'Alimentación',
        'PROD': 'Porta',
        'SET': 'Conjunto',
        'YAR': 'Yugo',
        'ACO': 'Acometida',
        
        // Refrigeración/Aire
        'DANFOSS': 'Refrigeración',
        'TOB': 'Tobera',
        'ORIFICCE': 'Orificio',
        
        // Consumibles
        'PIL': 'Pila',
        'CIN': 'Cinta',
        'CINT': 'Cinta',
        'RIBBON': 'Ribbon',
        'CAR': 'Cartucho',
        'TELA': 'Tela',
        'PAPEL': 'Papel',
        
        // Varios
        'PIL-': 'Pila',
        'JAB': 'Jabón',
        'SHA': 'Shampoo',
        'ALC': 'Alcohol',
        'ANT': 'Anticongelante',
        'BIOCIDA': 'Biocida',
        'PRO': 'Producto',
        'DIL-': 'Diluyente'
      },
      
      // Patrones por palabras clave en el nombre/descripción
      nombre: {
        // Mecánicos
        'cadena': 'Cadena',
        'chain': 'Cadena',
        'rodamiento': 'Rodamiento',
        'bearing': 'Rodamiento',
        'correa': 'Correa',
        'belt': 'Correa',
        'reten': 'Retén',
        'retén': 'Retén',
        'seal': 'Retén',
        'sello': 'Sello',
        'empaquetadura': 'Sello',
        'packing': 'Sello',
        'filtro': 'Filtro',
        'filter': 'Filtro',
        'perno': 'Perno',
        'bolt': 'Perno',
        'unión': 'Unión',
        'union': 'Unión',
        'bujía': 'Bujía',
        'spark': 'Bujía',
        'tensor': 'Tensor',
        'tensioner': 'Tensor',
        'polea': 'Polea',
        'pulley': 'Polea',
        'piñón': 'Piñón',
        'piñon': 'Piñón',
        'pinion': 'Piñón',
        'corona': 'Corona',
        'banda': 'Banda',
        'belt': 'Banda',
        
        // Fluidos
        'aceite': 'Aceite',
        'oil': 'Aceite',
        'lubricante': 'Lubricante',
        'lubricant': 'Lubricante',
        'grasa': 'Grasa',
        'grease': 'Grasa',
        'limpiador': 'Limpiador',
        'cleaner': 'Limpiador',
        'desengrasante': 'Desengrasante',
        'degreaser': 'Desengrasante',
        'solvente': 'Solvente',
        'solvent': 'Solvente',
        'diluyente': 'Diluyente',
        'thinner': 'Diluyente',
        'tinta': 'Tinta',
        'ink': 'Tinta',
        
        // Herramientas
        'herramienta': 'Herramienta',
        'tool': 'Herramienta',
        'mecha': 'Mecha',
        'drill': 'Mecha',
        'broca': 'Mecha',
        'ferretería': 'Ferretería',
        'hardware': 'Ferretería',
        'llave': 'Herramienta',
        'wrench': 'Herramienta',
        'martillo': 'Herramienta',
        'hammer': 'Herramienta',
        'pinza': 'Herramienta',
        'pliers': 'Herramienta',
        
        // Eléctricos
        'capacitor': 'Capacitor',
        'condensador': 'Capacitor',
        'controlador': 'Controlador',
        'controller': 'Controlador',
        'contactor': 'Contactor',
        'térmica': 'Térmica',
        'termica': 'Térmica',
        'thermal': 'Térmica',
        'relé': 'Relé',
        'rele': 'Relé',
        'relay': 'Relé',
        'manómetro': 'Manómetro',
        'manometro': 'Manómetro',
        'manometer': 'Manómetro',
        'válvula': 'Válvula',
        'valvula': 'Válvula',
        'valve': 'Válvula',
        'presostato': 'Presostato',
        'presure': 'Presostato',
        'sensor': 'Sensor',
        'interruptor': 'Interruptor',
        'switch': 'Interruptor',
        'transformador': 'Transformador',
        'transformer': 'Transformador',
        'variador': 'Variador',
        'variator': 'Variador',
        'testigo': 'Testigo',
        'indicator': 'Testigo',
        'pulsador': 'Pulsador',
        'button': 'Pulsador',
        'selector': 'Selector',
        'selector': 'Selector',
        'disyuntor': 'Disyuntor',
        'breaker': 'Disyuntor',
        'bornera': 'Bornera',
        'terminal': 'Bornera',
        'cable': 'Cable',
        'wire': 'Cable',
        
        // Neumáticos/Hidráulicos
        'solenoide': 'Solenoide',
        'solenoid': 'Solenoide',
        'electroválvula': 'Electroválvula',
        'solenoid valve': 'Electroválvula',
        'vibrador': 'Vibrador',
        'vibrator': 'Vibrador',
        'pistón': 'Pistón',
        'piston': 'Pistón',
        'compresor': 'Compresor',
        'compressor': 'Compresor',
        
        // Componentes de máquinas
        'reductor': 'Reductor',
        'reducer': 'Reductor',
        'motor': 'Motor',
        'turbina': 'Turbina',
        'turbine': 'Turbina',
        'cuchilla': 'Cuchilla',
        'blade': 'Cuchilla',
        'cuchara': 'Cuchara',
        'spoon': 'Cuchara',
        'paleta': 'Paleta',
        'paddle': 'Paleta',
        'impulsor': 'Impulsor',
        'impeller': 'Impulsor',
        'eje': 'Eje',
        'shaft': 'Eje',
        'rodillo': 'Rodillo',
        'roller': 'Rodillo',
        'puntera': 'Puntera',
        'tip': 'Puntera',
        'difusor': 'Difusor',
        'diffuser': 'Difusor',
        
        // Accesorios
        'tapón': 'Tapón',
        'plug': 'Tapón',
        'entrerrosca': 'Entrerrosca',
        'bushing': 'Entrerrosca',
        'cupla': 'Cupla',
        'coupling': 'Cupla',
        'codo': 'Codo',
        'elbow': 'Codo',
        'curva': 'Curva',
        'bend': 'Curva',
        'reducción': 'Reducción',
        'reduction': 'Reducción',
        'niple': 'Niple',
        'nipple': 'Niple',
        'flexible': 'Flexible',
        'hose': 'Flexible',
        'soga': 'Soga',
        'rope': 'Soga',
        
        // Bancadas y soportes
        'bancada': 'Bancada',
        'housing': 'Bancada',
        'soporte': 'Bancada',
        'support': 'Bancada',
        
        // Consumibles
        'pila': 'Pila',
        'battery': 'Pila',
        'pilas': 'Pila',
        'cinta': 'Cinta',
        'tape': 'Cinta',
        'ribbon': 'Ribbon',
        'cartucho': 'Cartucho',
        'cartridge': 'Cartucho',
        'tela': 'Tela',
        'cloth': 'Tela',
        'papel': 'Papel',
        'paper': 'Papel',
        'lija': 'Papel',
        'sandpaper': 'Papel',
        
        // Refrigeración
        'refrigeración': 'Refrigeración',
        'refrigeracion': 'Refrigeración',
        'refrigeration': 'Refrigeración',
        'termocupla': 'Termocupla',
        'thermocouple': 'Termocupla',
        'tobera': 'Tobera',
        'nozzle': 'Tobera'
      }
    };

    // Memoria contextual: almacena tipos descubiertos durante el procesamiento
    this.contextualMemory = {};
    
    // Historial de productos procesados para aprendizaje continuo
    this.processedProducts = [];
  }

  /**
   * Analiza un producto y determina su tipo basándose en múltiples fuentes
   */
  inferType(productData) {
    const { referencia, nombre, tipo, detalle, equipo } = productData;
    
    // 1. Si ya tiene tipo explícito, usarlo y guardarlo en memoria
    if (tipo && tipo.trim() !== '') {
      const tipoLimpio = tipo.trim();
      this.rememberType(referencia, tipoLimpio);
      return tipoLimpio;
    }

    // 2. Buscar en memoria contextual (productos anteriores similares)
    const tipoMemoria = this.findInMemory(referencia, nombre);
    if (tipoMemoria) {
      console.log(`   🧠 Memoria: "${referencia}" → ${tipoMemoria}`);
      return tipoMemoria;
    }

    // 3. Analizar por patrones en la referencia (ej: "CAD-40" → Cadena)
    const tipoPorRef = this.analyzeByReference(referencia);
    if (tipoPorRef) {
      this.rememberType(referencia, tipoPorRef);
      console.log(`   🔍 Patrón (Ref): "${referencia}" → ${tipoPorRef}`);
      return tipoPorRef;
    }

    // 4. Analizar por palabras clave en el nombre
    const tipoPorNombre = this.analyzeByName(nombre);
    if (tipoPorNombre) {
      this.rememberType(referencia, tipoPorNombre);
      console.log(`   🔍 Patrón (Nombre): "${nombre}" → ${tipoPorNombre}`);
      return tipoPorNombre;
    }

    // 5. Buscar pistas en detalle o equipo
    const tipoPorDetalle = this.analyzeInField(detalle || equipo || '');
    if (tipoPorDetalle) {
      this.rememberType(referencia, tipoPorDetalle);
      console.log(`   🔍 Patrón (Detalle): → ${tipoPorDetalle}`);
      return tipoPorDetalle;
    }

    // 6. Fallback: tipo genérico
    return 'General';
  }

  /**
   * Recuerda el tipo para productos similares futuros
   */
  rememberType(referencia, tipo) {
    // Extraer prefijo de referencia (ej: "CAD-40" → "CAD")
    const prefix = this.extractPrefix(referencia);
    if (prefix && prefix.length >= 3) {
      this.contextualMemory[prefix] = tipo;
    }
    
    // También guardar por referencia completa para búsquedas exactas
    this.contextualMemory[referencia.toUpperCase()] = tipo;
  }

  /**
   * Busca en memoria contextual
   */
  findInMemory(referencia, nombre) {
    const refUpper = referencia.toUpperCase();
    
    // Buscar por referencia exacta
    if (this.contextualMemory[refUpper]) {
      return this.contextualMemory[refUpper];
    }
    
    // Buscar por prefijo
    const prefix = this.extractPrefix(referencia);
    if (prefix && this.contextualMemory[prefix]) {
      return this.contextualMemory[prefix];
    }
    
    // Buscar en productos procesados anteriormente (aprendizaje continuo)
    for (const prev of this.processedProducts) {
      const prevPrefix = this.extractPrefix(prev.referencia);
      const currentPrefix = this.extractPrefix(referencia);
      
      // Si tienen el mismo prefijo, asumir mismo tipo
      if (prevPrefix && currentPrefix && prevPrefix === currentPrefix && prev.tipo) {
        return prev.tipo;
      }
      
      // Si el nombre es muy similar (comparación simple)
      if (nombre && prev.nombre && 
          nombre.toLowerCase().includes(prev.nombre.toLowerCase().substring(0, 5))) {
        if (prev.tipo) return prev.tipo;
      }
    }
    
    return null;
  }

  /**
   * Analiza por patrones en la referencia
   */
  analyzeByReference(referencia) {
    if (!referencia) return null;
    
    const refUpper = referencia.toUpperCase();
    
    // Buscar patrones conocidos (orden de prioridad: más específicos primero)
    // Ordenar patrones por longitud descendente para que coincidan los más específicos primero
    const sortedPatterns = Object.entries(this.patternRules.referencia)
      .sort((a, b) => b[0].length - a[0].length);
    
    for (const [pattern, tipo] of sortedPatterns) {
      // Buscar como prefijo completo (ej: "CAD-40" incluye "CAD-")
      if (refUpper.startsWith(pattern) || refUpper.includes(`-${pattern}`) || refUpper.includes(`${pattern}-`)) {
        return tipo;
      }
      // También buscar si el patrón está contenido (para casos como "DANFOSS ELI (FILTRO)")
      if (refUpper.includes(pattern)) {
        // Evitar falsos positivos (ej: "RED" no debe coincidir con "REDUCCION")
        // Pero permitir si el patrón es completo o tiene separadores
        const patternRegex = new RegExp(`\\b${pattern}\\b|[\\-_]${pattern}|${pattern}[\\-_]`, 'i');
        if (patternRegex.test(refUpper)) {
          return tipo;
        }
      }
    }
    
    return null;
  }

  /**
   * Analiza por palabras clave en el nombre
   */
  analyzeByName(nombre) {
    if (!nombre) return null;
    
    const nombreLower = nombre.toLowerCase();
    
    // Buscar palabras clave (ordenar por longitud para coincidir las más específicas primero)
    const sortedKeywords = Object.entries(this.patternRules.nombre)
      .sort((a, b) => b[0].length - a[0].length);
    
    for (const [keyword, tipo] of sortedKeywords) {
      // Buscar palabra completa o con separadores para evitar falsos positivos
      const keywordRegex = new RegExp(`\\b${keyword}\\b|[\\s-_]${keyword}[\\s-_]|${keyword}[\\s]`, 'i');
      if (keywordRegex.test(nombreLower)) {
        return tipo;
      }
    }
    
    // Casos especiales: Resolver ambigüedades por contexto
    // Si el nombre contiene "solenoide" o "solenoid", es Solenoide, no Solvente
    if (/solenoide|solenoid/i.test(nombreLower) && /SOL-/.test(nombre || '')) {
      return 'Solenoide';
    }
    // Si contiene "solvente", "solvent", "limpieza", "limpieza", es Solvente
    if (/solvente|solvent|limpieza/i.test(nombreLower) && /SOL-/.test(nombre || '')) {
      return 'Solvente';
    }
    
    return null;
  }

  /**
   * Analiza en campos de texto libre (detalle, equipo, etc.)
   */
  analyzeInField(texto) {
    if (!texto) return null;
    
    const textoLower = texto.toLowerCase();
    const textoUpper = texto.toUpperCase();
    
    // Primero buscar palabras clave exactas (con límites de palabra)
    for (const [keyword, tipo] of Object.entries(this.patternRules.nombre)) {
      // Buscar palabra completa o con separadores
      const keywordRegex = new RegExp(`\\b${keyword}\\b|[\\s-_]${keyword}[\\s-_]`, 'i');
      if (keywordRegex.test(textoLower)) {
        return tipo;
      }
    }
    
    // También buscar prefijos de referencia en el texto (ej: "motor RED-ALFA")
    for (const [pattern, tipo] of Object.entries(this.patternRules.referencia)) {
      const patternRegex = new RegExp(`\\b${pattern}[\\s-_]|${pattern}\\b`, 'i');
      if (patternRegex.test(textoUpper)) {
        return tipo;
      }
    }
    
    return null;
  }

  /**
   * Extrae el prefijo de una referencia (ej: "CAD-40-SIMPLE" → "CAD", "SELLOH-1800" → "SELLOH")
   */
  extractPrefix(referencia) {
    if (!referencia) return null;
    const refUpper = referencia.toUpperCase().trim();
    
    // Buscar prefijos conocidos primero (más específicos primero)
    const sortedPatterns = Object.keys(this.patternRules.referencia)
      .filter(p => p.length > 2 && !p.includes(' ')) // Excluir patrones con espacios
      .sort((a, b) => b.length - a.length); // Ordenar por longitud descendente
    
    for (const pattern of sortedPatterns) {
      if (refUpper.startsWith(pattern) || refUpper.startsWith(`${pattern}-`)) {
        return pattern;
      }
    }
    
    // Fallback: extraer prefijo común (2-6 letras mayúsculas seguidas de guión o espacio)
    const match = refUpper.match(/^([A-Z]{2,6})[-_\s]/);
    if (match) return match[1];
    
    // Si no hay guión, tomar las primeras letras mayúsculas (máximo 6)
    const matchNoDash = refUpper.match(/^([A-Z]{2,6})/);
    return matchNoDash ? matchNoDash[1] : null;
  }

  /**
   * Guarda un producto procesado para aprendizaje futuro
   */
  learnFrom(product) {
    this.processedProducts.push(product);
  }

  /**
   * Limpia la memoria (útil para pruebas)
   */
  clearMemory() {
    this.contextualMemory = {};
    this.processedProducts = [];
  }
}

// ============================================
// SCRIPT PRINCIPAL DE IMPORTACIÓN
// ============================================
async function importProducts() {
  try {
    // Conectar a MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI no está definida en el archivo .env');
    }

    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado exitosamente\n');

    // Obtener un usuario administrador para asignar como creador
    const admin = await User.findOne({ rol: 'administrador' });
    if (!admin) {
      throw new Error('No se encontró un usuario administrador. Ejecuta primero npm run seed:users');
    }

    // Crear motor de inferencia
    const inferenceEngine = new SmartTypeInference();

    // ==========================================
    // LEER ARCHIVO EXCEL AUTOMÁTICAMENTE
    // ==========================================
    
    // Rutas donde buscar el archivo Excel
    const possiblePaths = [
      path.join(__dirname, '../data/productos.xlsx'),
      path.join(__dirname, '../data/productos.xls'),
      path.join(__dirname, '../productos.xlsx'),
      path.join(__dirname, '../productos.xls'),
      path.join(process.cwd(), 'productos.xlsx'),
      path.join(process.cwd(), 'productos.xls')
    ];

    let excelPath = null;
    for (const testPath of possiblePaths) {
      const fs = require('fs');
      if (fs.existsSync(testPath)) {
        excelPath = testPath;
        break;
      }
    }

    if (!excelPath) {
      console.log('⚠️  No se encontró el archivo Excel de productos.');
      console.log('📁 Busqué en las siguientes ubicaciones:');
      possiblePaths.forEach(p => console.log(`   - ${p}`));
      console.log('\n💡 Instrucciones:');
      console.log('   1. Guarda tu archivo Excel como "productos.xlsx"');
      console.log('   2. Colócalo en: backend/data/productos.xlsx');
      console.log('   3. Ejecuta el script nuevamente\n');
      process.exit(0);
    }

    console.log(`📂 Leyendo archivo: ${excelPath}\n`);

    // Leer archivo Excel
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    console.log(`📄 Hoja: "${sheetName}"\n`);
    
    // Convertir a JSON (range: 1 salta la primera fila si tiene título "INVENTARIO DE PAÑOL")
    let productos = [];
    
    try {
      productos = XLSX.utils.sheet_to_json(sheet, { 
        range: 1,  // Saltar primera fila (título)
        defval: null, // Valores por defecto null para detectar vacíos
        raw: false // Convertir números a strings para consistencia
      });
    } catch (e) {
      productos = XLSX.utils.sheet_to_json(sheet, { 
        defval: null,
        raw: false
      });
    }

    if (productos.length === 0) {
      console.log('⚠️  El archivo Excel está vacío o no tiene datos válidos.');
      process.exit(0);
    }

    // Limpiar productos: eliminar objetos completamente vacíos o con solo la primera columna vacía
    productos = productos
      .map(prod => {
        // Crear nuevo objeto sin propiedades vacías o null
        const cleaned = {};
        for (const [key, value] of Object.entries(prod)) {
          // Saltar la primera columna si está vacía (puede tener nombres como "__EMPTY", etc.)
          if (key && !key.startsWith('__EMPTY') && value !== null && value !== undefined && value !== '') {
            cleaned[key] = value;
          }
        }
        return cleaned;
      })
      .filter(prod => {
        // Filtrar filas completamente vacías o que solo tengan la columna vacía
        const keys = Object.keys(prod).filter(k => !k.startsWith('__EMPTY'));
        return keys.length > 0 && (prod.REFERENCIA || prod.Referencia || prod.referencia || keys.some(k => prod[k] && prod[k].toString().trim()));
      });

    if (productos.length === 0) {
      console.log('⚠️  No se encontraron productos válidos después de limpiar columnas vacías.');
      process.exit(0);
    }

    // Mostrar estructura del primer producto para debugging
    console.log(`📋 Se encontraron ${productos.length} filas en el Excel`);
    console.log(`📊 Columnas detectadas en el primer producto:`);
    const primerProducto = productos[0];
    Object.keys(primerProducto).forEach(key => {
      console.log(`   - ${key}: "${primerProducto[key]}"`);
    });
    console.log('\n');

    console.log(`📦 Iniciando importación inteligente de ${productos.length} productos...\n`);

    let creados = 0;
    let actualizados = 0;
    let errores = 0;
    const erroresDetalle = [];

    // Procesar cada producto
    for (let i = 0; i < productos.length; i++) {
      const prod = productos[i];
      
      try {
        // Función auxiliar para buscar valor en múltiples variantes de nombres de columnas
        const getValue = (obj, ...keys) => {
          for (const key of keys) {
            if (obj[key]) return obj[key];
          }
          return null;
        };

        // Normalizar referencia (buscar en múltiples variantes)
        const referenciaRaw = getValue(
          prod, 
          'REFERENCIA', 'Referencia', 'referencia', 'REF', 'Ref', 'Codigo', 'Código', 'CODIGO'
        );
        
        const referencia = referenciaRaw ? referenciaRaw.toString().toUpperCase().trim() : '';
        
        if (!referencia) {
          errores++;
          erroresDetalle.push(`Fila ${i + 2}: Sin referencia (saltando...)`);
          continue;
        }

        // Preparar objeto para inferencia (con todos los campos disponibles)
        const prodForInference = {
          referencia: referencia,
          nombre: getValue(prod, 'DESCRIPCIÓN DE PRODUCTO', 'DESCRIPCION DE PRODUCTO', 'Nombre', 'nombre', 'DESCRIPCIÓN', 'Descripción', 'DESCRIPCION', 'Descripcion', 'PRODUCTO', 'Producto'),
          equipo: getValue(prod, 'EQUIPO DONDE SE APLICA', 'Equipo', 'equipo', 'EQUIPO', 'Equipo donde se aplica', 'Máquina', 'MAQUINA'),
          existencia: getValue(prod, 'DISPONIBLES', 'Disponibles', 'disponibles', 'EXISTENCIA', 'Existencia', 'existencia', 'STOCK', 'Stock', 'stock', 'Cantidad', 'CANTIDAD'),
          detalle: getValue(prod, 'DETALLE', 'Detalle', 'detalle', 'NOTA', 'Nota', 'nota', 'Observaciones', 'OBSERVACIONES'),
          tipo: getValue(prod, 'TIPO', 'Tipo', 'tipo', 'CATEGORIA', 'Categoría', 'Categoria', 'CATEGORÍA'),
          costoUnitario: getValue(prod, 'COSTO', 'Costo', 'costo', 'COSTO UNITARIO', 'Costo Unitario', 'PRECIO', 'Precio', 'precio')
        };

        // Aplicar inferencia inteligente de tipo (antes de limpiar strings)
        const tipoInferido = inferenceEngine.inferType(prodForInference);
        
        // Preparar datos del producto (limpiando strings y normalizando números)
        const productData = {
          referencia: referencia,
          nombre: (prodForInference.nombre || '').toString().trim(),
          equipo: (prodForInference.equipo || '').toString().trim(),
          existencia: parseInt(prodForInference.existencia || 0) || 0,
          detalle: (prodForInference.detalle || '').toString().trim(),
          tipo: tipoInferido, // Tipo inferido inteligentemente
          costoUnitario: prodForInference.costoUnitario ? parseFloat(prodForInference.costoUnitario) || null : null,
          creadoPor: admin._id,
          actualizadoPor: admin._id
        };

        // Validaciones mínimas
        if (!productData.nombre) {
          errores++;
          erroresDetalle.push(`${referencia}: Sin nombre`);
          continue;
        }

        // Buscar si existe
        const productoExistente = await Product.findOne({ referencia: referencia });

        if (productoExistente) {
          // Actualizar (upsert)
          Object.assign(productoExistente, productData);
          await productoExistente.save();
          actualizados++;
          console.log(`   ✅ Actualizado: ${referencia} - ${productData.nombre} [${tipoInferido}]`);
        } else {
          // Crear nuevo
          await Product.create(productData);
          creados++;
          console.log(`   ✅ Creado: ${referencia} - ${productData.nombre} [${tipoInferido}]`);
        }

        // Aprender de este producto para futuros
        inferenceEngine.learnFrom(productData);

      } catch (error) {
        errores++;
        const ref = prod.referencia || `Fila ${i + 1}`;
        erroresDetalle.push(`${ref}: ${error.message}`);
        console.error(`   ❌ Error en ${ref}: ${error.message}`);
      }
    }

    console.log('\n═══════════════════════════════════════');
    console.log('✨ IMPORTACIÓN COMPLETADA');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Creados: ${creados}`);
    console.log(`🔄 Actualizados: ${actualizados}`);
    console.log(`❌ Errores: ${errores}`);
    
    if (erroresDetalle.length > 0) {
      console.log('\n📋 Detalles de errores:');
      erroresDetalle.forEach(err => console.log(`   - ${err}`));
    }
    
    console.log('\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error fatal:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar
importProducts();

