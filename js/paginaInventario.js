import {
  iniciarRepositorio,
  suscribirseAProductos,
  guardarProducto,
  restablecerDatos,
  obtenerUltimaActualizacion,
  obtenerProductos,
  registrarMovimiento,
} from "./repositorio.js";
import { filtrarProductos, extraerTipos } from "./filtros.js";
import {
  renderizarInventario,
  actualizarOpcionesTipo,
  actualizarUltimaSincronizacion,
  poblarSelectorProductos,
} from "./interfaz.js";
import { iniciarAlertas } from "./alertas.js";

const campoBusqueda = document.querySelector("#buscador");
const selectorTipo = document.querySelector("#filtro-tipo");
const selectorStock = document.querySelector("#filtro-stock");
const formularioProducto = document.querySelector("#formulario-producto");
const formularioMovimiento = document.querySelector("#formulario-movimiento");
const botonRestaurar = document.querySelector("#boton-restaurar");
const selectorReferenciaMovimiento = document.querySelector(
  "#movimiento-referencia"
);
const selectorTipoMovimiento = document.querySelector("#movimiento-tipo");
const campoCantidadMovimiento = document.querySelector("#movimiento-cantidad");
const campoCostoMovimiento = document.querySelector("#movimiento-costo");
const campoNotaMovimiento = document.querySelector("#movimiento-nota");
const enlaceMovimientos = document.querySelector("#ver-movimientos");

const criterios = {
  busqueda: "",
  tipo: "todos",
  stock: "todos",
};

const aplicarFiltros = (productos) =>
  filtrarProductos(productos, {
    busqueda: criterios.busqueda,
    tipo: criterios.tipo,
    stock: criterios.stock,
  });

const refrescarVista = (productos) => {
  renderizarInventario(aplicarFiltros(productos));
  actualizarOpcionesTipo(extraerTipos(productos));
  poblarSelectorProductos(selectorReferenciaMovimiento, productos);
  actualizarUltimaSincronizacion(obtenerUltimaActualizacion());
};

const manejarBusqueda = (evento) => {
  criterios.busqueda = evento.target.value;
  renderizarInventario(aplicarFiltros(obtenerProductos()));
};

const manejarCambioTipo = (evento) => {
  criterios.tipo = evento.target.value;
  renderizarInventario(aplicarFiltros(obtenerProductos()));
};

const manejarCambioStock = (evento) => {
  criterios.stock = evento.target.value;
  renderizarInventario(aplicarFiltros(obtenerProductos()));
};

const actualizarEstadoCosto = () => {
  if (!selectorTipoMovimiento || !campoCostoMovimiento) return;
  const esIngreso = selectorTipoMovimiento.value === "ingreso";
  campoCostoMovimiento.disabled = !esIngreso;
  campoCostoMovimiento.parentElement?.classList.toggle("solo-lectura", !esIngreso);
  if (!esIngreso) campoCostoMovimiento.value = "";
};

const manejarFormularioProducto = (evento) => {
  evento.preventDefault();
  const datos = new FormData(formularioProducto);
  try {
    guardarProducto({
      referencia: datos.get("referencia"),
      nombre: datos.get("nombre"),
      equipo: datos.get("equipo"),
      existencia: datos.get("existencia"),
      detalle: datos.get("detalle"),
      tipo: datos.get("tipo"),
      costoUnitario: datos.get("costoUnitario"),
    });
    formularioProducto.reset();
    formularioProducto.querySelector("input[name='referencia']").focus();
  } catch (error) {
    alert(error.message);
  }
};

const manejarFormularioMovimiento = (evento) => {
  evento.preventDefault();
  const datos = new FormData(formularioMovimiento);
  try {
    registrarMovimiento({
      referencia: datos.get("referencia"),
      tipo: datos.get("tipo"),
      cantidad: datos.get("cantidad"),
      costoUnitario: datos.get("costoUnitario"),
      nota: datos.get("nota"),
    });
    formularioMovimiento.reset();
    actualizarEstadoCosto();
  } catch (error) {
    alert(error.message);
  }
};

const manejarRestauracion = () => {
  const confirmado = confirm(
    "¿Restablecer los datos iniciales? Se perderán movimientos y modificaciones locales."
  );
  if (confirmado) restablecerDatos();
};

const iniciar = () => {
  iniciarRepositorio();

  suscribirseAProductos((productos) => {
    refrescarVista(productos);
  });

  iniciarAlertas(obtenerProductos);

  campoBusqueda.addEventListener("input", manejarBusqueda);
  selectorTipo.addEventListener("change", manejarCambioTipo);
  selectorStock.addEventListener("change", manejarCambioStock);
  selectorTipoMovimiento.addEventListener("change", actualizarEstadoCosto);
  formularioProducto.addEventListener("submit", manejarFormularioProducto);
  formularioMovimiento.addEventListener("submit", manejarFormularioMovimiento);
  botonRestaurar.addEventListener("click", manejarRestauracion);
  enlaceMovimientos?.addEventListener("click", (evento) => {
    if (evento.metaKey || evento.ctrlKey) return;
    evento.preventDefault();
    window.open("movimientos.html", "_blank");
  });

  actualizarEstadoCosto();
};

iniciar();

