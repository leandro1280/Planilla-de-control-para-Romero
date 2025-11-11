const cuerpoTabla = document.querySelector("#tabla-inventario tbody");
const selectorTipos = document.querySelector("#filtro-tipo");
const etiquetaSincronizacion = document.querySelector("#ultima-sincronizacion");
const contenedorAlertas = document.querySelector("#avisos");

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

export const renderizarInventario = (productos) => {
  if (!cuerpoTabla) return;
  cuerpoTabla.innerHTML = "";

  if (!productos.length) {
    cuerpoTabla.innerHTML =
      "<tr><td colspan='7'>Sin resultados para los filtros seleccionados.</td></tr>";
    return;
  }

  const fragmento = document.createDocumentFragment();

  productos.forEach((producto) => {
    const fila = document.createElement("tr");
    if (producto.existencia <= 4) {
      fila.classList.add("stock-critico");
    } else if (producto.existencia < 10) {
      fila.classList.add("stock-bajo");
    }

    fila.innerHTML = `
      <td>${producto.referencia}</td>
      <td>${producto.nombre || "-"}</td>
      <td>${producto.equipo || "-"}</td>
      <td>${formatearCantidad(producto.existencia)}</td>
      <td>${producto.detalle || "-"}</td>
      <td>${producto.tipo || "-"}</td>
      <td>$ ${formatearMoneda(producto.costoUnitario || 0)}</td>
    `;

    fragmento.appendChild(fila);
  });

  cuerpoTabla.appendChild(fragmento);
};

export const actualizarOpcionesTipo = (tipos) => {
  if (!selectorTipos) return;
  const seleccionActual = selectorTipos.value;
  selectorTipos.innerHTML = `<option value="todos">Todos</option>`;
  tipos.forEach((tipo) => {
    const opcion = document.createElement("option");
    opcion.value = tipo;
    opcion.textContent = tipo;
    selectorTipos.appendChild(opcion);
  });
  if (tipos.includes(seleccionActual)) {
    selectorTipos.value = seleccionActual;
  }
};

export const poblarSelectorProductos = (selector, productos) => {
  if (!selector) return;
  const valorOriginal = selector.value || "";
  const valorNormalizado = valorOriginal.trim().toLowerCase();
  selector.innerHTML = '<option value="">Seleccione un producto</option>';
  productos.forEach((producto) => {
    const opcion = document.createElement("option");
    opcion.value = producto.referencia;
    opcion.textContent = `${producto.referencia} · ${producto.nombre}`;
    selector.appendChild(opcion);
  });
  const existente = productos.find(
    (producto) =>
      producto.referencia.trim().toLowerCase() === valorNormalizado
  );
  if (existente) {
    selector.value = existente.referencia;
  }
};

export const actualizarUltimaSincronizacion = (fechaISO) => {
  if (!etiquetaSincronizacion) return;
  if (!fechaISO) {
    etiquetaSincronizacion.textContent = "Sincronizado: nunca";
    return;
  }
  const formateador = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
  etiquetaSincronizacion.textContent = `Sincronizado: ${formateador.format(
    new Date(fechaISO)
  )}`;
};

export const mostrarAviso = ({
  mensaje,
  etiquetaAccion,
  alAccionar,
  tono = "aviso",
}) => {
  const aviso = document.createElement("div");
  aviso.className = `aviso aviso-${tono}`;
  aviso.innerHTML = `<span>${mensaje}</span>`;

  if (etiquetaAccion && alAccionar) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = etiquetaAccion;
    boton.addEventListener("click", () => {
      alAccionar();
      contenedorAlertas.removeChild(aviso);
    });
    aviso.appendChild(boton);
  }

  contenedorAlertas.appendChild(aviso);
  setTimeout(() => {
    aviso.classList.add("visible");
  }, 10);

  setTimeout(() => {
    aviso.classList.remove("visible");
    setTimeout(() => {
      if (contenedorAlertas.contains(aviso)) contenedorAlertas.removeChild(aviso);
    }, 300);
  }, 8000);
};

export const limpiarAvisos = () => {
  if (contenedorAlertas) contenedorAlertas.innerHTML = "";
};

