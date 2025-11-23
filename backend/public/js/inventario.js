// Funcionalidad del inventario
document.addEventListener('DOMContentLoaded', function () {
  const buscador = document.getElementById('buscador');
  const filtroTipo = document.getElementById('filtro-tipo');
  const filtroStock = document.getElementById('filtro-stock');
  const formularioProducto = document.getElementById('formulario-producto');
  const formularioMovimiento = document.getElementById('formulario-movimiento');
  const botonRestaurar = document.getElementById('boton-restaurar');
  const formImportar = document.getElementById('form-importar');

  // Prellenar formulario de nuevo producto si hay un código en la URL
  const urlParams = new URLSearchParams(window.location.search);
  const nuevoCodigo = urlParams.get('nuevo');
  if (nuevoCodigo && formularioProducto) {
    const referenciaInput = formularioProducto.querySelector('input[name="referencia"]');
    const codigoFabricanteInput = formularioProducto.querySelector('input[name="codigoFabricante"]');
    
    if (referenciaInput) {
      // Si el código parece ser de fabricante (URL, texto largo, etc.), ponerlo en codigoFabricante
      if (nuevoCodigo.includes('http') || nuevoCodigo.length > 30) {
        if (codigoFabricanteInput) {
          codigoFabricanteInput.value = nuevoCodigo;
        }
      } else {
        // Si es un código corto, ponerlo como referencia
        referenciaInput.value = nuevoCodigo;
      }
      
      // Scroll suave al formulario
      formularioProducto.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Resaltar el campo
      referenciaInput.focus();
      referenciaInput.classList.add('border-primary', 'border-2');
      setTimeout(() => {
        referenciaInput.classList.remove('border-primary', 'border-2');
      }, 2000);
    }
  }

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

  // ============================================
  // FUNCIONALIDAD DE EDICIÓN DE PRODUCTOS
  // ============================================
  const editModal = new bootstrap.Modal(document.getElementById('editModal'));
  const newTypeModal = new bootstrap.Modal(document.getElementById('newTypeModal'));
  const editButtons = document.querySelectorAll('.btn-edit');
  const formEditProduct = document.getElementById('form-edit-product');
  const formNewType = document.getElementById('form-new-type');
  const btnNuevoTipo = document.getElementById('btn-nuevo-tipo');
  const editTipoSelect = document.getElementById('edit-tipo');

  // Botones de edición
  editButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      const productId = this.dataset.id;
      const referencia = this.dataset.referencia;
      const nombre = this.dataset.nombre;
      const equipo = this.dataset.equipo || '';
      const existencia = this.dataset.existencia || '0';
      const detalle = this.dataset.detalle || '';
      const tipo = this.dataset.tipo || '';
      const costo = this.dataset.costo || '';
      const codigoFabricante = this.dataset.codigoFabricante || '';

      // Llenar formulario
      document.getElementById('edit-product-id').value = productId;
      document.getElementById('edit-referencia').value = referencia;
      document.getElementById('edit-nombre').value = nombre;
      document.getElementById('edit-equipo').value = equipo;
      document.getElementById('edit-existencia').value = existencia;
      document.getElementById('edit-detalle').value = detalle;
      document.getElementById('edit-tipo').value = tipo;
      document.getElementById('edit-costo').value = costo;
      document.getElementById('edit-codigo-fabricante').value = codigoFabricante;

      // Limpiar mensajes anteriores
      document.getElementById('edit-result').className = 'mt-3 d-none';

      // Mostrar modal
      editModal.show();
    });
  });

  // Formulario de edición
  if (formEditProduct) {
    formEditProduct.addEventListener('submit', async (e) => {
      e.preventDefault();

      const productId = document.getElementById('edit-product-id').value;
      const formData = new FormData(formEditProduct);
      const data = Object.fromEntries(formData);

      // Preparar datos
      const updateData = {
        nombre: data.nombre,
        equipo: data.equipo || '',
        existencia: parseInt(data.existencia) || 0,
        detalle: data.detalle || '',
        tipo: data.tipo || null,
        costoUnitario: data.costoUnitario ? parseFloat(data.costoUnitario) : null,
        codigoFabricante: data.codigoFabricante || null
      };

      const resultDiv = document.getElementById('edit-result');
      // Usar e.submitter para obtener el botón que hizo el submit (compatible con formularios externos)
      const submitBtn = e.submitter || document.querySelector('#editModal button[form="form-edit-product"]');

      // Deshabilitar botón y mostrar spinner
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Guardando...';
      }

      try {
        const response = await fetch(`/inventario/productos/${productId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        });

        const result = await response.json();

        resultDiv.classList.remove('d-none');

        if (result.success) {
          resultDiv.className = 'mt-3 alert alert-success';
          resultDiv.innerHTML = `
            <h6 class="alert-heading"><i class="bi bi-check-circle-fill me-2"></i>Producto actualizado</h6>
            <p class="mb-0">Los cambios se han guardado correctamente.</p>
          `;

          // Recargar la página después de 1.5 segundos
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          resultDiv.className = 'mt-3 alert alert-danger';
          resultDiv.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i>${result.message || 'Error al actualizar producto'}`;
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Guardar Cambios';
          }
        }
      } catch (error) {
        console.error('Error:', error);
        resultDiv.classList.remove('d-none');
        resultDiv.className = 'mt-3 alert alert-danger';
        resultDiv.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i>Error de conexión`;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Guardar Cambios';
        }
      }
    });
  }

  // Botones para crear nuevo tipo (desde modal de edición y formulario nuevo producto)
  const btnNuevoTipoNuevoProducto = document.getElementById('btn-nuevo-tipo-nuevo-producto');
  const nuevoProductoTipoSelect = document.getElementById('nuevo-producto-tipo');

  function openNewTypeModal(sourceSelect) {
    // Guardar referencia al select que lo llamó
    window.currentTypeSelect = sourceSelect;
    
    // Limpiar formulario
    document.getElementById('new-type-name').value = '';
    document.getElementById('new-type-result').className = 'mt-3 d-none';
    
    // Mostrar modal
    newTypeModal.show();
  }

  if (btnNuevoTipo) {
    btnNuevoTipo.addEventListener('click', function () {
      openNewTypeModal(editTipoSelect);
    });
  }

  if (btnNuevoTipoNuevoProducto) {
    btnNuevoTipoNuevoProducto.addEventListener('click', function () {
      openNewTypeModal(nuevoProductoTipoSelect);
    });
  }

  // Formulario para crear nuevo tipo
  if (formNewType) {
    formNewType.addEventListener('submit', async (e) => {
      e.preventDefault();

      const tipoName = document.getElementById('new-type-name').value.trim();
      const resultDiv = document.getElementById('new-type-result');
      // Usar e.submitter para obtener el botón que hizo el submit (compatible con formularios externos)
      const submitBtn = e.submitter || document.querySelector('#newTypeModal button[form="form-new-type"]');

      if (!tipoName) {
        resultDiv.classList.remove('d-none');
        resultDiv.className = 'mt-3 alert alert-warning';
        resultDiv.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2"></i>Por favor ingresa un nombre para el tipo';
        return;
      }

      // Verificar si el tipo ya existe
      const tipoExists = Array.from(editTipoSelect.options).some(opt => 
        opt.value.toLowerCase() === tipoName.toLowerCase()
      );

      if (tipoExists) {
        resultDiv.classList.remove('d-none');
        resultDiv.className = 'mt-3 alert alert-warning';
        resultDiv.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i>El tipo "${tipoName}" ya existe`;
        return;
      }

      // Deshabilitar botón y mostrar spinner
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Creando...';
      }

      // Agregar el nuevo tipo a todos los selectores relevantes
      const selectsToUpdate = [
        editTipoSelect,
        nuevoProductoTipoSelect,
        document.getElementById('filtro-tipo')
      ].filter(s => s !== null);

      selectsToUpdate.forEach(select => {
        // Verificar si ya existe
        const exists = Array.from(select.options).some(opt => 
          opt.value.toLowerCase() === tipoName.toLowerCase()
        );
        
        if (!exists) {
          const newOption = document.createElement('option');
          newOption.value = tipoName;
          newOption.textContent = tipoName;
          select.appendChild(newOption);
        }
      });

      // Seleccionar el nuevo tipo en el select que lo llamó
      if (window.currentTypeSelect) {
        window.currentTypeSelect.value = tipoName;
      }

      resultDiv.classList.remove('d-none');
      resultDiv.className = 'mt-3 alert alert-success';
      resultDiv.innerHTML = `
        <h6 class="alert-heading"><i class="bi bi-check-circle-fill me-2"></i>Tipo creado</h6>
        <p class="mb-0">El tipo "${tipoName}" ha sido agregado y seleccionado.</p>
      `;

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Crear Tipo';
      }

      // Cerrar modal después de 1 segundo
      setTimeout(() => {
        newTypeModal.hide();
        // Enfocar el campo de tipo en el modal de edición
        editTipoSelect.focus();
      }, 1000);
    });
  }

  // ============================================
  // FUNCIONALIDAD DE ELIMINACIÓN DE PRODUCTOS
  // ============================================
  const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
  const deleteButtons = document.querySelectorAll('.btn-delete');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete');
  let currentDeleteId = null;

  // Botones de eliminar
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      const productId = this.dataset.id;
      const referencia = this.dataset.referencia;
      const nombre = this.dataset.nombre;

      // Guardar ID del producto a eliminar
      currentDeleteId = productId;

      // Llenar modal de confirmación
      document.getElementById('delete-referencia').textContent = referencia;
      document.getElementById('delete-nombre').textContent = nombre;

      // Limpiar mensajes anteriores
      const resultDiv = document.getElementById('delete-result');
      resultDiv.className = 'mt-3 d-none';
      resultDiv.innerHTML = '';

      // Mostrar modal
      deleteModal.show();
    });
  });

  // Confirmar eliminación
  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', async function () {
      if (!currentDeleteId) return;

      const resultDiv = document.getElementById('delete-result');
      const deleteBtn = this;

      // Deshabilitar botón y mostrar spinner
      deleteBtn.disabled = true;
      deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Eliminando...';

      try {
        const response = await fetch(`/inventario/productos/${currentDeleteId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const result = await response.json();

        resultDiv.classList.remove('d-none');

        if (result.success) {
          resultDiv.className = 'mt-3 alert alert-success';
          resultDiv.innerHTML = `
            <h6 class="alert-heading"><i class="bi bi-check-circle-fill me-2"></i>Producto eliminado</h6>
            <p class="mb-0">El producto ha sido eliminado correctamente.</p>
          `;

          // Recargar la página después de 1.5 segundos
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          resultDiv.className = 'mt-3 alert alert-danger';
          resultDiv.innerHTML = `
            <h6 class="alert-heading"><i class="bi bi-exclamation-triangle-fill me-2"></i>Error</h6>
            <p class="mb-0">${result.message || 'No se pudo eliminar el producto'}</p>
          `;
          deleteBtn.disabled = false;
          deleteBtn.innerHTML = '<i class="bi bi-trash-fill me-2"></i>Sí, Eliminar';
        }
      } catch (error) {
        console.error('Error:', error);
        resultDiv.classList.remove('d-none');
        resultDiv.className = 'mt-3 alert alert-danger';
        resultDiv.innerHTML = `
          <h6 class="alert-heading"><i class="bi bi-exclamation-triangle-fill me-2"></i>Error de conexión</h6>
          <p class="mb-0">No se pudo conectar con el servidor. Intenta nuevamente.</p>
        `;
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = '<i class="bi bi-trash-fill me-2"></i>Sí, Eliminar';
      }
    });
  }

  // Limpiar ID al cerrar el modal
  const deleteModalElement = document.getElementById('deleteModal');
  if (deleteModalElement) {
    deleteModalElement.addEventListener('hidden.bs.modal', function () {
      currentDeleteId = null;
      const resultDiv = document.getElementById('delete-result');
      if (resultDiv) {
        resultDiv.className = 'mt-3 d-none';
        resultDiv.innerHTML = '';
      }
      if (btnConfirmDelete) {
        btnConfirmDelete.disabled = false;
        btnConfirmDelete.innerHTML = '<i class="bi bi-trash-fill me-2"></i>Sí, Eliminar';
      }
    });
  }
});
