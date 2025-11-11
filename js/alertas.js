import { mostrarAviso, limpiarAvisos } from "./interfaz.js";

const INTERVALO_ALERTA_MS = 60 * 60 * 1000;
let identificadorIntervalo = null;

const mensajePara = (items) => {
  if (items.length === 1) {
    const [item] = items;
    return `Quedan ${item.existencia} unidades de ${item.referencia}.`;
  }
  const referencias = items.map((item) => item.referencia).join(", ");
  return `Stock crítico en ${items.length} productos: ${referencias}.`;
};

const enfocarTabla = () => {
  document.querySelector("#tabla-inventario")?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
};

const lanzarAlerta = (items) => {
  limpiarAvisos();
  mostrarAviso({
    mensaje: mensajePara(items),
    etiquetaAccion: "Revisar",
    alAccionar: enfocarTabla,
  });
};

export const iniciarAlertas = (obtenerProductos) => {
  const revisar = () => {
    const productos = obtenerProductos();
    const criticos = productos.filter((item) => item.existencia <= 4);
    if (criticos.length) {
      lanzarAlerta(criticos);
    } else {
      limpiarAvisos();
    }
  };

  revisar();

  if (identificadorIntervalo) clearInterval(identificadorIntervalo);
  identificadorIntervalo = setInterval(revisar, INTERVALO_ALERTA_MS);
};

