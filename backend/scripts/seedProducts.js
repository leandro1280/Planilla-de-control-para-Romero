require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');

// URI de MongoDB (Usar variable de entorno)
const MONGODB_URI = process.env.MONGODB_URI;

// Productos del inventario real (Proporcionados por el usuario)
const productosReal = [
  // Cadenas
  { referencia: 'CAD-40-SIMPLE', nombre: 'ASA 40 simple', equipo: 'en varias maq-trasp-horno', existencia: 0, tipo: 'Cadena' },
  { referencia: 'CAD-50-SIMPLE', nombre: 'ASA 50 simple', equipo: 'estivador L-GA3000', existencia: 0, tipo: 'Cadena' },
  { referencia: 'CAD-S55', nombre: 'ASA S55 simple', equipo: 'trasp-horno', existencia: 0, tipo: 'Cadena' },
  { referencia: 'CAD-50-DOBLE', nombre: 'ASA 50 doble', equipo: 'transp-salida horno', existencia: 0, tipo: 'Cadena' },
  { referencia: 'CAD-SS50', nombre: 'ASA 50 simple inoxidable', equipo: 'armadora-horno', existencia: 0, tipo: 'Cadena' },
  { referencia: 'CAD-S60-DOBLE', nombre: 'ASA 60 DOBLE', equipo: 'laminadores en tapas', existencia: 0, tipo: 'Cadena' },
  { referencia: 'CAD-S60-SIMPLE', nombre: '60-simple', equipo: 'amasadora', existencia: 0, tipo: 'Cadena' },
  { referencia: 'CAD-ASA80X2', nombre: 'cadena ASA 80 doble', equipo: 'divisora L-GA3000', existencia: 0, tipo: 'Cadena' },
  { referencia: 'CAD-06B-2', nombre: '06-B2 doble', equipo: 'cinta-mesa de apile (tapas)', existencia: 0, tipo: 'Cadena' },
  { referencia: 'CAD-06-SIMPLE', nombre: '06-B1 simple', equipo: '', existencia: 0, tipo: 'Cadena' },
  { referencia: 'CAD-120-DOBLE', nombre: 'Cadena ASA 120 Doble', equipo: 'Enfriador', existencia: 0, tipo: 'Cadena' },

  // Uniones y medios eslabones
  { referencia: 'MEDIO-UNION-CAD-06B1-SIMPLE', nombre: 'Medio eslabon', equipo: '', existencia: 0, tipo: 'Unión' },
  { referencia: 'MEDIO-UNION-CAD-06B1-DOBLE', nombre: 'Medio eslabon', equipo: '', existencia: 0, tipo: 'Unión' },
  { referencia: 'UNION-CAD-06B1-SIMPLE', nombre: 'Union 06B1', equipo: '', existencia: 0, tipo: 'Unión' },
  { referencia: 'UNION-CAD-0682-DOBLE', nombre: 'Union 0682', equipo: 'maq-jake', existencia: 0, tipo: 'Unión' },
  { referencia: 'MED-UNI-CAD-40X1', nombre: 'Medio eslabon', equipo: 'maq-divis-imepa', existencia: 15, tipo: 'Unión' },
  { referencia: 'UNI-CAD-40X1', nombre: 'union cadena 40 simple', equipo: 'varias maq-Embolsadora', existencia: 20, tipo: 'Unión' },
  { referencia: 'UNI-CAD-40X1-C/ALTEA', nombre: 'Union cadena ASA 40 con ALETA LATERAL', equipo: 'salida rebanadora divisora L-GA3000', existencia: 50, tipo: 'Unión' },
  { referencia: 'UNION-CAD-50', nombre: 'Medio eslabon', equipo: '', existencia: 0, tipo: 'Unión' },
  { referencia: 'UNI-CAD-50SIMPLE', nombre: 'Union cad 50 simple', equipo: '', existencia: 0, tipo: 'Unión' },
  { referencia: 'UNI-CAD-50DOBLE', nombre: 'union cadena ASA 50 doble', equipo: '', existencia: 0, tipo: 'Unión' },
  { referencia: 'UNI-CAD-60-SIMPLE', nombre: 'Union cad ASA 60 simple', equipo: '', existencia: 0, tipo: 'Unión' },
  { referencia: 'UNI-CAD-60-DOBLE', nombre: 'Union cadena ASA 60 doble', equipo: '', existencia: 0, tipo: 'Unión' },
  { referencia: 'MED-CAD-60-DOBLE', nombre: 'Medio Eslab.ASA 60 doble', equipo: '', existencia: 0, tipo: 'Unión' },
  { referencia: 'UNION-CAD-ASA-80-DOBLE', nombre: 'Medio eslabon ASA80', equipo: 'Horno-Armadora de tapas', existencia: 0, tipo: 'Unión' },
  { referencia: 'UN-CAD-80X2', nombre: 'union cadena ASA 80 doble', equipo: 'amasadora', existencia: 0, tipo: 'Unión' },
  { referencia: 'MED-CAD-120-DOBLE', nombre: 'Medio Eslabon Cadena ASA 120 Doble', equipo: 'Enfriador', existencia: 0, tipo: 'Unión' },
  { referencia: 'UNION-CAD-120-DOBLE', nombre: 'Union Cadena ASA 120 doble', equipo: 'Enfriador', existencia: 0, tipo: 'Unión' },
  { referencia: 'UNION-CAD-S55', nombre: 'S55 Union', equipo: 'Estibador', existencia: 0, tipo: 'Unión' },
  { referencia: 'MED-UNION-CAD-S55', nombre: 'S55 medio eslabon', equipo: 'Estibador', existencia: 0, tipo: 'Unión' },

  // Pernos
  { referencia: 'PERNOS-ESTIBA', nombre: 'Pernos Para Bandejas Estibador', equipo: 'Estibador L-GA3000', existencia: 14, tipo: 'Perno' },

  // Rodamientos
  { referencia: 'ROD-CF1-1/8-S', nombre: 'CF 1 1/8 S', equipo: 'LEVA ENBOLS-AMF', existencia: 5, tipo: 'Rodamiento' },
  { referencia: 'ROD-UCT208', nombre: 'UCT208', equipo: 'banda desmoldador', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-GY1103KRRB3', nombre: 'GY1103KRRB3', equipo: '', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-UL211-200', nombre: 'UL211-200', equipo: '', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-UC203', nombre: 'UC203', equipo: '', existencia: 35, tipo: 'Rodamiento' }, // Suma de 14 + 21
  { referencia: 'ROD-UC206-20', nombre: 'UC206-20 EJE 31,74', equipo: '', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-UC206', nombre: 'UC206-EJE 30', equipo: 'L-GA3000', existencia: 5, tipo: 'Rodamiento' },
  { referencia: 'ROD-UC206-104D1', nombre: 'UC206-104D1', equipo: '', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-AEL206', nombre: 'AEL206-104D1', equipo: '', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-UC206-G', nombre: 'UC206G', equipo: '', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-GRA103RRB', nombre: 'GRA103RRB', equipo: '', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-UC204', nombre: 'UC204', equipo: '', existencia: 1, tipo: 'Rodamiento' },
  { referencia: 'ROD-UC204D1', nombre: 'UC204D1', equipo: 'L-GA3000', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-AS204D1', nombre: 'AS204D1', equipo: '', existencia: 4, tipo: 'Rodamiento' },
  { referencia: 'ROD-UC202-010D1', nombre: 'UC202-010D1', equipo: '', existencia: 12, tipo: 'Rodamiento' },
  { referencia: 'ROD-UC211', nombre: 'UC211-200D1', equipo: 'eje de amasadora', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-UC212', nombre: 'UC212D1', equipo: 'NO', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-UC205', nombre: 'UC205', equipo: 'saca tapas y transp. Masa', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-UC208', nombre: 'UC208-40MM', equipo: 'eje banda de chupetes', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-UC214', nombre: 'UC214D1', equipo: 'eje del horno', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-UC209', nombre: 'UC209', equipo: 'tubina fermentadora', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-NK16/20R', nombre: 'NK16/20R', equipo: '', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-AS204', nombre: 'AS204-012D1', equipo: '', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-AS206-104', nombre: 'AS206-104', equipo: '', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-GYE20KRRB', nombre: 'GYE20KRRB', equipo: '', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-YEL206', nombre: 'YEL206', equipo: '', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-YET206', nombre: 'YET206-103', equipo: 'turbina fermentadora', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-YET202-010', nombre: 'YET202-010', equipo: '', existencia: 5, tipo: 'Rodamiento' },
  { referencia: 'ROD-UEL211', nombre: 'UEL211-200', equipo: '', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-NA206', nombre: 'NA206', equipo: '', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-UCP203D1', nombre: 'UCP203D1', equipo: '', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-UCP214', nombre: 'UCP214D1', equipo: 'eje de trans.prod.horno', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-H309', nombre: 'H309', equipo: 'turbina horno', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-H309-USADO', nombre: 'H309 USADO', equipo: 'turbina horno', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-1209K', nombre: '1209K C3', equipo: 'Turbina horno', existencia: 7, tipo: 'Rodamiento' },
  { referencia: 'ROD-1209K-USADO', nombre: '1209SK C3', equipo: 'usados', existencia: 3, tipo: 'Rodamiento' },
  { referencia: 'ROD-32007A', nombre: '32007A', equipo: 'reductor de armadora', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-32007X', nombre: '32007X 4T-3007X', equipo: 'reductor de armadora', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-HR-32010-J', nombre: 'HR 32010 J', equipo: 'reductor de armadora', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-HE-32207-I', nombre: 'HE 32207 I', equipo: '', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-32015-JR', nombre: '32015 JR', equipo: 'Ejes de sinfín maq margarina', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-1212', nombre: '1212 doble bolilla cilindrico', equipo: '', existencia: 0, tipo: 'Rodamiento' },
  { referencia: 'ROD-32017-X', nombre: '32017 X', equipo: '', existencia: 0, tipo: 'Rodamiento' },

  // SET (asumo que son rodamientos o componentes especiales)
  { referencia: 'SET328', nombre: 'SET328', equipo: '', existencia: 8, tipo: 'Rodamiento' },
];

// Función para crear productos
async function seedProducts() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno');
    }

    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB conectado\n');

    // Obtener un administrador para asignar como creador
    const admin = await User.findOne({ rol: 'administrador' });

    if (!admin) {
      console.error('❌ No se encontró ningún administrador. Ejecuta primero npm run seed:users');
      process.exit(1);
    }

    console.log(`✅ Usando administrador: ${admin.nombre} (${admin.email})\n`);

    console.log('📝 Creando productos...\n');

    let creados = 0;
    let existentes = 0;
    let errores = 0;

    for (const productoData of productosReal) {
      try {
        // Normalizar referencia a mayúsculas
        const referenciaNormalizada = productoData.referencia.toUpperCase().trim();

        // Verificar si el producto ya existe
        const existe = await Product.findOne({ referencia: referenciaNormalizada });

        if (existe) {
          console.log(`⚠️  Producto ya existe: ${referenciaNormalizada} - ${productoData.nombre}`);
          existentes++;
        } else {
          // Crear producto
          const producto = await Product.create({
            referencia: referenciaNormalizada,
            nombre: productoData.nombre || '',
            equipo: productoData.equipo || '',
            existencia: productoData.existencia || 0,
            tipo: productoData.tipo || 'Sin tipo',
            detalle: '',
            costoUnitario: 0,
            creadoPor: admin._id,
            actualizadoPor: admin._id
          });
          console.log(`✅ Producto creado: ${producto.referencia} - ${producto.nombre} (Stock: ${producto.existencia})`);
          creados++;
        }
      } catch (error) {
        console.error(`❌ Error creando ${productoData.referencia}:`, error.message);
        errores++;
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`   ✅ Creados: ${creados}`);
    console.log(`   ⚠️  Existentes: ${existentes}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log(`   📦 Total procesados: ${productosReal.length}\n`);

    // Contar productos por tipo
    console.log('📦 Productos por tipo:');
    const tipos = await Product.aggregate([
      { $group: { _id: '$tipo', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    tipos.forEach(tipo => {
      console.log(`   ${tipo._id}: ${tipo.count}`);
    });

    // Contar productos con stock
    const conStock = await Product.countDocuments({ existencia: { $gt: 0 } });
    const sinStock = await Product.countDocuments({ existencia: 0 });
    const stockCritico = await Product.countDocuments({ existencia: { $lte: 4, $gt: 0 } });

    console.log('\n📊 Estadísticas de stock:');
    console.log(`   ✅ Con stock: ${conStock}`);
    console.log(`   ⚠️  Sin stock: ${sinStock}`);
    console.log(`   🔴 Stock crítico (≤4): ${stockCritico}\n`);

    console.log('✨ Proceso completado\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar
seedProducts();
