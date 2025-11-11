export const filtrarProductos = (productos, criterios) => {
  const termino = criterios.busqueda.trim().toLowerCase();

  return productos.filter((producto) => {
    const coincideBusqueda =
      !termino ||
      [
        producto.referencia,
        producto.nombre,
        producto.equipo,
        producto.detalle,
      ]
        .filter(Boolean)
        .some((campo) => campo.toLowerCase().includes(termino));

    const coincideTipo =
      criterios.tipo === "todos" ||
      (producto.tipo || "sin-tipo").toLowerCase() ===
        criterios.tipo.toLowerCase();

    const coincideStock =
      criterios.stock === "todos" ||
      (criterios.stock === "criticos" && producto.existencia <= 4) ||
      (criterios.stock === "bajo" && producto.existencia < 10);

    return coincideBusqueda && coincideTipo && coincideStock;
  });
};

export const extraerTipos = (productos) => {
  const tipos = new Set();
  productos.forEach((producto) => {
    if (producto.tipo && producto.tipo.trim()) tipos.add(producto.tipo.trim());
  });
  return Array.from(tipos).sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" })
  );
};

