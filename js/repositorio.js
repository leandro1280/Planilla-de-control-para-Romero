const CLAVE_PRODUCTOS = "romeroProductosV2";
const CLAVE_MOVIMIENTOS = "romeroMovimientosV1";

const productosIniciales = [
  {
    referencia: "CAD-40-Simple",
    nombre: "ASA 40 simple",
    equipo: "Varias máquinas",
    existencia: 12,
    detalle: "",
    tipo: "Cadena",
    costoUnitario: 12500,
  },
  {
    referencia: "CAD-50-Simple",
    nombre: "ASA 50 simple",
    equipo: "Transportador horno",
    existencia: 8,
    detalle: "",
    tipo: "Cadena",
    costoUnitario: 14700,
  },
  {
    referencia: "CAD-S55",
    nombre: "ASA S55 simple",
    equipo: "Transportador horno",
    existencia: 2,
    detalle: "",
    tipo: "Cadena",
    costoUnitario: 13800,
  },
  {
    referencia: "CAD-80X2",
    nombre: "ASA 80 doble",
    equipo: "Amasadora",
    existencia: 6,
    detalle: "",
    tipo: "Cadena",
    costoUnitario: 22400,
  },
  {
    referencia: "CAD-ASA80X2",
    nombre: "Cadena ASA 80 doble",
    equipo: "Divisora",
    existencia: 14,
    detalle: "",
    tipo: "Cadena",
    costoUnitario: 23150,
  },
  {
    referencia: "CAD-06B-2",
    nombre: "06-B2 doble",
    equipo: "Divisora L-GA3000",
    existencia: 4,
    detalle: "",
    tipo: "Cadena",
    costoUnitario: 8500,
  },
  {
    referencia: "UNI-CAD-40X1 C/ALTEA",
    nombre: "Unión cadena ASA 40 con aleta",
    equipo: "Transportador",
    existencia: 3,
    detalle: "",
    tipo: "Unión",
    costoUnitario: 4600,
  },
  {
    referencia: "PERNO-ESTIBA",
    nombre: "Pernos para bandejas Estibador",
    equipo: "Estibador",
    existencia: 9,
    detalle: "",
    tipo: "Perno",
    costoUnitario: 1200,
  },
  {
    referencia: "ROD-GY1103KRRB3",
    nombre: "GY1103KRRB3",
    equipo: "Rodamiento especial",
    existencia: 5,
    detalle: "",
    tipo: "Rodamiento",
    costoUnitario: 19800,
  },
];

const clonar = (valor) => JSON.parse(JSON.stringify(valor));

let productos = [];
let movimientos = [];
const suscriptores = new Set();

const asegurarEntero = (valor, { permitirCero = true, minimo = 0 } = {}) => {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || !Number.isInteger(numero)) {
    throw new Error("La cantidad debe ser un número entero.");
  }
  if (!permitirCero && numero <= minimo) {
    throw new Error(
      minimo === 0
        ? "La cantidad debe ser mayor que cero."
        : `La cantidad debe ser superior a ${minimo}.`
    );
  }
  if (numero < minimo) {
    throw new Error("La cantidad no puede ser negativa.");
  }
  return numero;
};

const normalizarProducto = (registro) => ({
  ...registro,
  existencia: Math.max(
    0,
    Math.round(Number.isFinite(Number(registro.existencia))
      ? Number(registro.existencia)
      : 0)
  ),
  costoUnitario: Number(registro.costoUnitario) || 0,
});

const normalizarMovimiento = (registro) => ({
  ...registro,
  cantidad: Math.max(
    0,
    Math.round(Number.isFinite(Number(registro.cantidad))
      ? Number(registro.cantidad)
      : 0)
  ),
  costoUnitario: Number(registro.costoUnitario) || 0,
  costoTotal: Number(registro.costoTotal) || 0,
});

const generarId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const guardarEstado = () => {
  localStorage.setItem(CLAVE_PRODUCTOS, JSON.stringify(productos));
  localStorage.setItem(CLAVE_MOVIMIENTOS, JSON.stringify(movimientos));
  localStorage.setItem(
    `${CLAVE_PRODUCTOS}:actualizado`,
    new Date().toISOString()
  );
};

const notificarCambios = () => {
  suscriptores.forEach((callback) => callback(obtenerProductos()));
};

const cargarEstado = () => {
  const datosProductos = localStorage.getItem(CLAVE_PRODUCTOS);
  const datosMovimientos = localStorage.getItem(CLAVE_MOVIMIENTOS);

  if (datosProductos) {
    try {
      const parseados = JSON.parse(datosProductos);
      if (Array.isArray(parseados)) {
        productos = parseados.map(normalizarProducto);
      } else {
        productos = clonar(productosIniciales).map(normalizarProducto);
      }
    } catch (error) {
      console.warn("No se pudo interpretar productos guardados:", error);
      productos = clonar(productosIniciales).map(normalizarProducto);
    }
  } else {
    productos = clonar(productosIniciales).map(normalizarProducto);
  }

  if (datosMovimientos) {
    try {
      const parseadosMov = JSON.parse(datosMovimientos);
      movimientos = Array.isArray(parseadosMov)
        ? parseadosMov.map(normalizarMovimiento)
        : [];
    } catch (error) {
      console.warn("No se pudo interpretar movimientos guardados:", error);
      movimientos = [];
    }
  } else {
    movimientos = [];
  }

  productos.sort((a, b) =>
    a.referencia.localeCompare(b.referencia, "es", { sensitivity: "base" })
  );

  guardarEstado();
};

export const iniciarRepositorio = () => {
  if (!productos.length) cargarEstado();
};

export const obtenerProductos = () => clonar(productos);

export const obtenerMovimientos = () => clonar(movimientos);

export const obtenerUltimaActualizacion = () =>
  localStorage.getItem(`${CLAVE_PRODUCTOS}:actualizado`);

export const suscribirseAProductos = (callback) => {
  suscriptores.add(callback);
  callback(obtenerProductos());
  return () => suscriptores.delete(callback);
};

export const guardarProducto = (entrada) => {
  const referenciaNormalizada = (entrada.referencia || "").trim();
  if (!referenciaNormalizada)
    throw new Error("La referencia es obligatoria para guardar.");

  const indice = productos.findIndex(
    (item) =>
      item.referencia.trim().toLowerCase() ===
      referenciaNormalizada.toLowerCase()
  );

  const registro = {
    referencia: referenciaNormalizada,
    nombre: (entrada.nombre || "").trim(),
    equipo: (entrada.equipo || "").trim(),
    existencia: asegurarEntero(entrada.existencia ?? 0, {
      permitirCero: true,
      minimo: 0,
    }),
    detalle: (entrada.detalle || "").trim(),
    tipo: (entrada.tipo || "").trim(),
    costoUnitario: Number(entrada.costoUnitario) || 0,
  };

  if (indice >= 0) {
    productos[indice] = registro;
  } else {
    productos.push(registro);
  }

  productos.sort((a, b) =>
    a.referencia.localeCompare(b.referencia, "es", { sensitivity: "base" })
  );

  guardarEstado();
  notificarCambios();
};

export const registrarMovimiento = ({
  referencia,
  tipo,
  cantidad,
  costoUnitario,
  nota,
}) => {
  const referenciaNormalizada = (referencia || "").trim();
  const producto = productos.find(
    (item) =>
      item.referencia.trim().toLowerCase() ===
      referenciaNormalizada.toLowerCase()
  );

  if (!producto) {
    throw new Error("No se encontró el producto indicado.");
  }

  const cantidadNumerica = asegurarEntero(cantidad, {
    permitirCero: false,
    minimo: 0,
  });

  const movimiento = {
    id: generarId(),
    referencia: producto.referencia,
    tipo: tipo === "egreso" ? "egreso" : "ingreso",
    cantidad: cantidadNumerica,
    costoUnitario:
      tipo === "ingreso"
        ? Number(costoUnitario) || producto.costoUnitario || 0
        : producto.costoUnitario || Number(costoUnitario) || 0,
    costoTotal: 0,
    fecha: new Date().toISOString(),
    nota: (nota || "").trim(),
  };

  movimiento.costoTotal =
    Math.round(movimiento.costoUnitario * movimiento.cantidad * 100) / 100;

  if (movimiento.tipo === "ingreso") {
    producto.existencia += movimiento.cantidad;
    if (Number(costoUnitario)) {
      producto.costoUnitario = movimiento.costoUnitario;
    }
  } else {
    if (producto.existencia < movimiento.cantidad) {
      throw new Error("No hay stock suficiente para realizar el egreso.");
    }
    producto.existencia -= movimiento.cantidad;
  }

  movimientos.push(movimiento);
  movimientos.sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  guardarEstado();
  notificarCambios();
  return movimiento;
};

export const restablecerDatos = () => {
  productos = clonar(productosIniciales).map(normalizarProducto);
  movimientos = [];
  guardarEstado();
  notificarCambios();
};

export const recargarDatos = () => {
  cargarEstado();
  notificarCambios();
};

