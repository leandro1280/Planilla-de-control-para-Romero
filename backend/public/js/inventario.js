// Funcionalidad del inventario
document.addEventListener('DOMContentLoaded', function() {
  const buscador = document.getElementById('buscador');
  const filtroTipo = document.getElementById('filtro-tipo');
  const filtroStock = document.getElementById('filtro-stock');
  const formularioProducto = document.getElementById('formulario-producto');
  const formularioMovimiento = document.getElementById('formulario-movimiento');
  const botonRestaurar = document.getElementById('boton-restaurar');

  // Filtros
  if (buscador) {
    buscador.addEventListener('input', () => aplicarFiltros());
  }

  if (filtroTipo) {
    filtroTipo.addEventListener('change', () => aplicarFiltros());
  }

  if (filtroStock) {
    filtroStock.addEventListener('change', () => aplicarFiltros());
  }

  function aplicarFiltros() {
    const params = new URLSearchParams();
    
    // Resetear a página 1 cuando se cambian los filtros
    params.append('pagina', '1');
    
    // Mantener búsqueda si hay valor
    if (buscador?.value?.trim()) {
      params.append('busqueda', buscador.value.trim());
    }
    
    // Mantener filtro de tipo si no es "todos"
    if (filtroTipo?.value && filtroTipo.value !== 'todos') {
      params.append('tipo', filtroTipo.value);
    }
    
    // Mantener filtro de stock si no es "todos"
    if (filtroStock?.value && filtroStock.value !== 'todos') {
      params.append('stock', filtroStock.value);
    }
    
    // Redirigir con los parámetros
    const url = '/inventario?' + params.toString();
    window.location.href = url;
  }

  // Formulario de producto
  if (formularioProducto) {
    formularioProducto.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(formularioProducto);
      const data = Object.fromEntries(formData);
      
      try {
        const response = await fetch('/inventario/productos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert('Producto guardado correctamente');
          formularioProducto.reset();
          window.location.reload();
        } else {
          alert(result.message || 'Error al guardar producto');
        }
      } catch (error) {
        alert('Error de conexión');
      }
    });
  }

  // Formulario de movimiento
  if (formularioMovimiento) {
    const tipoMovimiento = document.getElementById('movimiento-tipo');
    const costoMovimiento = document.getElementById('movimiento-costo');
    
    if (tipoMovimiento) {
      tipoMovimiento.addEventListener('change', () => {
        const esIngreso = tipoMovimiento.value === 'ingreso';
        if (costoMovimiento) {
          costoMovimiento.disabled = !esIngreso;
          if (!esIngreso) costoMovimiento.value = '';
        }
      });
    }

    formularioMovimiento.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(formularioMovimiento);
      const data = Object.fromEntries(formData);
      
      try {
        const response = await fetch('/inventario/movimientos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert('Movimiento registrado correctamente');
          formularioMovimiento.reset();
          window.location.reload();
        } else {
          alert(result.message || 'Error al registrar movimiento');
        }
      } catch (error) {
        alert('Error de conexión');
      }
    });
  }

  // Botón restaurar
  if (botonRestaurar) {
    botonRestaurar.addEventListener('click', () => {
      if (confirm('¿Restablecer los datos iniciales? Se perderán movimientos y modificaciones.')) {
        // TODO: Implementar restablecimiento
        alert('Función en desarrollo');
      }
    });
  }
});

