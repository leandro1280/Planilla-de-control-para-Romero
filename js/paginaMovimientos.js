import {
  iniciarRepositorio,
  recargarDatos,
  obtenerMovimientos,
  obtenerProductos,
} from "./repositorio.js";

const cuerpoTabla = document.querySelector("#tabla-movimientos tbody");
const buscador = document.querySelector("#buscador-movimientos");
const filtroTipoMovimiento = document.querySelector("#filtro-tipo-movimientos");
const botonActualizar = document.querySelector("#boton-actualizar");
const selectorProductoGrafico = document.querySelector(
  "#selector-producto-grafico"
);
const selectorTipoGrafico = document.querySelector("#selector-tipo-grafico");

let graficoCantidades = null;
let graficoGastos = null;
let graficoTop = null;
let graficoTipos = null;

let productosCache = [];

const formatearCantidad = (valor) =>
  Number(valor).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatearMoneda = (valor) =>
  Number(valor).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatearFecha = (iso) =>
  new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));

const obtenerTipoReferencia = (referencia) => {
  const producto = productosCache.find(
    (item) =>
      item.referencia.trim().toLowerCase() === referencia.trim().toLowerCase()
  );
  const valor = (producto?.tipo || "Sin tipo").trim();
  return valor || "Sin tipo";
};

const filtrosTabla = {
  texto: "",
  tipoMovimiento: "todos",
};

const filtrosGraficos = {
  referencia: "todos",
  tipoProducto: "todos",
};

const destruirGrafico = (instancia) => {
  if (instancia && typeof instancia.destroy === "function") {
    instancia.destroy();
  }
};

const agruparPor = (items, clave, extractor = (v) => v) => {
  const mapa = new Map();
  items.forEach((item) => {
    const llave = clave(item);
    const valor = extractor(item);
    const acumulado = mapa.get(llave) || 0;
    mapa.set(llave, acumulado + valor);
  });
  return mapa;
};

const filtrarMovimientos = (movimientos, { incluirProductoYTipo } = {}) => {
  const aplicarProductoYTipo = incluirProductoYTipo ?? true;
  return movimientos.filter((mov) => {
    const texto = filtrosTabla.texto;
    const coincideTexto =
      !texto ||
      [mov.referencia, mov.nota]
        .filter(Boolean)
        .some((campo) => campo.toLowerCase().includes(texto));

    const coincideTipoMovimiento =
      filtrosTabla.tipoMovimiento === "todos" ||
      mov.tipo.toLowerCase() === filtrosTabla.tipoMovimiento;

    const tipoProducto = obtenerTipoReferencia(mov.referencia);
    const coincideTipoProducto =
      !aplicarProductoYTipo ||
      filtrosGraficos.tipoProducto === "todos" ||
      tipoProducto === filtrosGraficos.tipoProducto;

    const coincideProducto =
      !aplicarProductoYTipo ||
      filtrosGraficos.referencia === "todos" ||
      mov.referencia === filtrosGraficos.referencia;

    return (
      coincideTexto && coincideTipoMovimiento && coincideTipoProducto && coincideProducto
    );
  });
};

const renderizarTabla = (movimientos) => {
  if (!cuerpoTabla) return;
  cuerpoTabla.innerHTML = "";

  if (!movimientos.length) {
    cuerpoTabla.innerHTML =
      "<tr><td colspan='7'>No hay movimientos que coincidan con el filtro actual.</td></tr>";
    return;
  }

  const fragmento = document.createDocumentFragment();
  movimientos.forEach((movimiento) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${formatearFecha(movimiento.fecha)}</td>
      <td>${movimiento.referencia}</td>
      <td class="${movimiento.tipo}">${movimiento.tipo}</td>
      <td>${formatearCantidad(movimiento.cantidad)}</td>
      <td>$ ${formatearMoneda(movimiento.costoUnitario)}</td>
      <td>$ ${formatearMoneda(movimiento.costoTotal)}</td>
      <td>${movimiento.nota || "-"}</td>
    `;
    fragmento.appendChild(fila);
  });

  cuerpoTabla.appendChild(fragmento);
};

const actualizarGraficos = (movimientosDetalle, movimientosParaTipos) => {
  const ingresos = movimientosDetalle.filter((mov) => mov.tipo === "ingreso");
  const egresos = movimientosDetalle.filter((mov) => mov.tipo === "egreso");

  const totalIngresos = ingresos.reduce(
    (acc, mov) => acc + Number(mov.cantidad),
    0
  );
  const totalEgresos = egresos.reduce(
    (acc, mov) => acc + Number(mov.cantidad),
    0
  );

  const totalInvertido = ingresos.reduce(
    (acc, mov) => acc + Number(mov.costoTotal),
    0
  );
  const totalConsumido = egresos.reduce(
    (acc, mov) => acc + Number(mov.costoTotal),
    0
  );

  const egresosPorReferencia = Array.from(
    agruparPor(egresos, (mov) => mov.referencia, (mov) =>
      Number(mov.cantidad)
    ).entries()
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);

  const mapaTipos = new Map();
  movimientosParaTipos.forEach((mov) => {
    const tipo = obtenerTipoReferencia(mov.referencia);
    const registro = mapaTipos.get(tipo) || { ingresos: 0, egresos: 0 };
    if (mov.tipo === "ingreso") {
      registro.ingresos += Number(mov.cantidad);
    } else {
      registro.egresos += Number(mov.cantidad);
    }
    mapaTipos.set(tipo, registro);
  });

  const tiposOrdenados = Array.from(mapaTipos.entries()).sort(
    (a, b) => (b[1].egresos || 0) - (a[1].egresos || 0)
  );

  destruirGrafico(graficoCantidades);
  destruirGrafico(graficoGastos);
  destruirGrafico(graficoTop);
  destruirGrafico(graficoTipos);

  const ctxCantidades = document.querySelector("#grafico-cantidades");
  const ctxGastos = document.querySelector("#grafico-gastos");
  const ctxTop = document.querySelector("#grafico-top");
  const ctxTipos = document.querySelector("#grafico-tipos");

  if (ctxCantidades && window.Chart) {
    graficoCantidades = new Chart(ctxCantidades, {
      type: "bar",
      data: {
        labels: ["Ingresos", "Egresos"],
        datasets: [
          {
            label: "Unidades",
            data: [totalIngresos, totalEgresos],
            backgroundColor: ["#8bc34a", "#ef5350"],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
      },
    });
  }

  if (ctxGastos && window.Chart) {
    graficoGastos = new Chart(ctxGastos, {
      type: "doughnut",
      data: {
        labels: ["Invertido (ingreso)", "Consumido (egreso)"],
        datasets: [
          {
            data: [totalInvertido, totalConsumido],
            backgroundColor: ["#42a5f5", "#ff7043"],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
        },
      },
    });
  }

  if (ctxTop && window.Chart) {
    graficoTop = new Chart(ctxTop, {
      type: "bar",
      data: {
        labels: egresosPorReferencia.map(([ref]) => ref),
        datasets: [
          {
            label: "Egresos",
            data: egresosPorReferencia.map(([, cantidad]) => cantidad),
            backgroundColor: "#ef5350",
          },
        ],
      },
      options: {
        responsive: true,
        indexAxis: "y",
        plugins: { legend: { display: false } },
      },
    });
  }

  if (ctxTipos && window.Chart) {
    graficoTipos = new Chart(ctxTipos, {
      type: "bar",
      data: {
        labels: tiposOrdenados.map(([tipo]) => tipo),
        datasets: [
          {
            label: "Ingresos",
            data: tiposOrdenados.map(([, valores]) => valores.ingresos || 0),
            backgroundColor: "#8bc34a",
          },
          {
            label: "Egresos",
            data: tiposOrdenados.map(([, valores]) => valores.egresos || 0),
            backgroundColor: "#ef5350",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      },
    });
  }
};

const poblarSelectorTipo = () => {
  if (!selectorTipoGrafico) return;
  const seleccionAnterior = filtrosGraficos.tipoProducto;
  const tipos = Array.from(
    new Set(productosCache.map((producto) => obtenerTipoReferencia(producto.referencia)))
  ).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

  selectorTipoGrafico.innerHTML = `<option value="todos">Todos</option>`;
  tipos.forEach((tipo) => {
    const option = document.createElement("option");
    option.value = tipo;
    option.textContent = tipo;
    selectorTipoGrafico.appendChild(option);
  });

  if (seleccionAnterior !== "todos" && !tipos.includes(seleccionAnterior)) {
    filtrosGraficos.tipoProducto = "todos";
  } else {
    filtrosGraficos.tipoProducto = seleccionAnterior;
  }

  selectorTipoGrafico.value = filtrosGraficos.tipoProducto;
};

const poblarSelectorProducto = () => {
  if (!selectorProductoGrafico) return;
  const seleccionAnterior = filtrosGraficos.referencia;

  const productosFiltrados =
    filtrosGraficos.tipoProducto === "todos"
      ? productosCache
      : productosCache.filter(
          (producto) => obtenerTipoReferencia(producto.referencia) === filtrosGraficos.tipoProducto
        );

  selectorProductoGrafico.innerHTML = `<option value="todos">Todos</option>`;
  productosFiltrados
    .slice()
    .sort((a, b) =>
      a.referencia.localeCompare(b.referencia, "es", { sensitivity: "base" })
    )
    .forEach((producto) => {
      const option = document.createElement("option");
      option.value = producto.referencia;
      option.textContent = `${producto.referencia} · ${producto.nombre}`;
      selectorProductoGrafico.appendChild(option);
    });

  if (
    seleccionAnterior !== "todos" &&
    !productosFiltrados.some(
      (producto) =>
        producto.referencia.trim().toLowerCase() === seleccionAnterior.trim().toLowerCase()
    )
  ) {
    filtrosGraficos.referencia = "todos";
  } else {
    filtrosGraficos.referencia = seleccionAnterior;
  }

  selectorProductoGrafico.value = filtrosGraficos.referencia;
};

const actualizarCacheProductos = () => {
  productosCache = obtenerProductos();
  poblarSelectorTipo();
  poblarSelectorProducto();
};

const refrescar = () => {
  const movimientosTotales = obtenerMovimientos();
  const movimientosFiltrados = filtrarMovimientos(movimientosTotales, {
    incluirProductoYTipo: true,
  });
  const movimientosParaTipos = filtrarMovimientos(movimientosTotales, {
    incluirProductoYTipo: false,
  });

  renderizarTabla(movimientosFiltrados);
  actualizarGraficos(movimientosFiltrados, movimientosParaTipos);
};

const manejarEntradaTexto = (evento) => {
  filtrosTabla.texto = (evento.target.value || "").trim().toLowerCase();
  refrescar();
};

const manejarCambioTipoMovimiento = (evento) => {
  filtrosTabla.tipoMovimiento = evento.target.value;
  refrescar();
};

const manejarCambioTipoProducto = (evento) => {
  filtrosGraficos.tipoProducto = evento.target.value;
  filtrosGraficos.referencia = "todos";
  poblarSelectorProducto();
  refrescar();
};

const manejarCambioProducto = (evento) => {
  filtrosGraficos.referencia = evento.target.value;
  refrescar();
};

const inicializar = () => {
  iniciarRepositorio();
  actualizarCacheProductos();
  refrescar();

  buscador?.addEventListener("input", manejarEntradaTexto);
  filtroTipoMovimiento?.addEventListener(
    "change",
    manejarCambioTipoMovimiento
  );
  selectorTipoGrafico?.addEventListener("change", manejarCambioTipoProducto);
  selectorProductoGrafico?.addEventListener("change", manejarCambioProducto);
  botonActualizar?.addEventListener("click", () => {
    recargarDatos();
    actualizarCacheProductos();
    refrescar();
  });

  window.addEventListener("storage", (evento) => {
    if (evento.key === "romeroMovimientosV1" || evento.key === "romeroProductosV2") {
      recargarDatos();
      actualizarCacheProductos();
      refrescar();
    }
  });
};

inicializar();

