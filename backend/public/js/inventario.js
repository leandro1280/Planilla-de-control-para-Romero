// Funcionalidad del inventario
document.addEventListener('DOMContentLoaded', function () {
  const buscador = document.getElementById('buscador');
  const filtroTipo = document.getElementById('filtro-tipo');
  const filtroStock = document.getElementById('filtro-stock');
  const formularioProducto = document.getElementById('formulario-producto');
  const formularioMovimiento = document.getElementById('formulario-movimiento');
  const botonRestaurar = document.getElementById('boton-restaurar');
  const formImportar = document.getElementById('form-importar');

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

  // Formulario de importación Excel
  if (formImportar) {
    formImportar.addEventListener('submit', async function (e) {
      e.preventDefault();
      console.log('--> Formulario de importación enviado');

      const formData = new FormData(this);
      const resultDiv = document.getElementById('import-result');
      const submitBtn = this.querySelector('button[type="submit"]');

      // Deshabilitar botón y mostrar spinner
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Importando...';
      resultDiv.className = 'mt-3 d-none';

      try {
        const response = await fetch('/inventario/importar', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        resultDiv.classList.remove('d-none');

        if (data.success) {
          resultDiv.className = 'mt-3 alert alert-success';
          resultDiv.innerHTML = `
            <h6 class="alert-heading"><i class="bi bi-check-circle-fill me-2"></i>Importación exitosa</h6>
            <p class="mb-0">${data.message}</p>
            ${data.detalles && data.detalles.length > 0 ?
              `<hr><small>Detalles:<br>${data.detalles.join('<br>')}</small>` : ''}
          `;

          // Recargar la página después de 2 segundos
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          resultDiv.className = 'mt-3 alert alert-danger';
          resultDiv.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i>${data.message}`;
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="bi bi-cloud-upload me-2"></i>Subir e Importar';
        }
      } catch (error) {
        console.error('Error:', error);
        resultDiv.classList.remove('d-none');
        resultDiv.className = 'mt-3 alert alert-danger';
        resultDiv.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i>Error de conexión`;
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-cloud-upload me-2"></i>Subir e Importar';
      }
    });
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
          if (result.message === 'La referencia ya existe') {
            alert('Error: Ya existe un producto con esa referencia. Por favor, usa una diferente.');
          } else {
            alert(result.message || 'Error al guardar producto');
          }
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

      // Si el costo está vacío, no enviarlo (será null)
      if (!data.costoUnitario || data.costoUnitario.trim() === '') {
        delete data.costoUnitario;
      } else {
        data.costoUnitario = parseFloat(data.costoUnitario);
      }

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
