// Funcionalidad de Mantenimientos Preventivos
document.addEventListener('DOMContentLoaded', function () {
  const formularioMantenimiento = document.getElementById('formulario-mantenimiento');
  const buscadorReferencia = document.getElementById('buscador-referencia');
  const filtroEquipo = document.getElementById('filtro-equipo');
  const filtroEstado = document.getElementById('filtro-estado');
  const fechaInstalacionInput = document.getElementById('mantenimiento-fecha-instalacion');

  // Establecer fecha actual por defecto en fecha de instalación
  if (fechaInstalacionInput && !fechaInstalacionInput.value) {
    const hoy = new Date();
    const fechaFormateada = hoy.toISOString().split('T')[0];
    fechaInstalacionInput.value = fechaFormateada;
  }

  // Toggle Frecuencia
  const radioHoras = document.getElementById('frecuencia-horas');
  const radioFecha = document.getElementById('frecuencia-fecha');
  const formularioHoras = document.getElementById('formulario-horas');
  const formularioFecha = document.getElementById('formulario-fecha');
  const intervaloInput = document.getElementById('mantenimiento-intervalo');

  function toggleFrecuencia() {
    if (radioFecha && radioFecha.checked) {
      // Modo por Fecha Fija - Mostrar formulario de fecha, ocultar formulario de horas
      if (formularioHoras) formularioHoras.classList.add('d-none');
      if (formularioFecha) formularioFecha.classList.remove('d-none');
      // Limpiar y deshabilitar campos de horas
      if (horasVidaUtilInput) {
        horasVidaUtilInput.value = '';
        horasVidaUtilInput.removeAttribute('required');
      }
      if (horasDiariasInput) {
        horasDiariasInput.value = '12';
        horasDiariasInput.removeAttribute('required');
      }
      // Habilitar campo de intervalo
      if (intervaloInput) {
        intervaloInput.setAttribute('required', 'required');
      }
    } else {
      // Modo por Horas de Uso - Mostrar formulario de horas, ocultar formulario de fecha
      if (formularioHoras) formularioHoras.classList.remove('d-none');
      if (formularioFecha) formularioFecha.classList.add('d-none');
      // Limpiar y deshabilitar campo de intervalo
      if (intervaloInput) {
        intervaloInput.value = '';
        intervaloInput.removeAttribute('required');
      }
      // Habilitar campos de horas
      if (horasVidaUtilInput) {
        horasVidaUtilInput.setAttribute('required', 'required');
      }
      if (horasDiariasInput) {
        horasDiariasInput.setAttribute('required', 'required');
      }
    }
  }

  // Inicializar estado del formulario - Asegurar que solo uno esté visible
  if (radioHoras && radioFecha && formularioHoras && formularioFecha) {
    // Inicializar: mostrar formulario de horas, ocultar formulario de fecha
    if (radioHoras.checked) {
      formularioHoras.classList.remove('d-none');
      formularioFecha.classList.add('d-none');
    } else {
      formularioHoras.classList.add('d-none');
      formularioFecha.classList.remove('d-none');
    }
    toggleFrecuencia();
  }

  if (radioHoras && radioFecha) {
    radioHoras.addEventListener('change', toggleFrecuencia);
    radioFecha.addEventListener('change', toggleFrecuencia);
  }

  // Filtro de Categoría - Esperar a que el DOM esté completamente cargado
  const filtroCategoria = document.getElementById('filtro-categoria-producto');
  const productoSelect = document.getElementById('mantenimiento-producto');

  if (filtroCategoria && productoSelect && productoSelect.options.length > 1) {
    // Guardar todas las opciones originales (excepto la opción por defecto)
    const opcionesOriginales = [];
    Array.from(productoSelect.options).forEach(option => {
      if (option.value !== "") {
        const dataTipo = option.getAttribute('data-tipo') || option.dataset.tipo || '';
        opcionesOriginales.push({
          value: option.value,
          text: option.text,
          dataTipo: dataTipo,
          dataReferencia: option.getAttribute('data-referencia') || option.dataset.referencia || '',
          dataStock: option.getAttribute('data-stock') || option.dataset.stock || '',
          dataNombre: option.getAttribute('data-nombre') || option.dataset.nombre || ''
        });
      }
    });

    // Las categorías ya vienen del servidor desde el template Handlebars

    // Función para filtrar y reconstruir el select de productos
    function filtrarProductos() {
      const categoriaSeleccionada = filtroCategoria.value.trim();
      
      // Guardar la selección actual
      const valorSeleccionado = productoSelect.value;
      
      // Limpiar el select (mantener solo la opción por defecto)
      while (productoSelect.options.length > 1) {
        productoSelect.remove(1);
      }
      
      // Si no hay categoría seleccionada, mostrar todos
      if (!categoriaSeleccionada) {
        opcionesOriginales.forEach(opcion => {
          const option = document.createElement('option');
          option.value = opcion.value;
          option.textContent = opcion.text;
          option.setAttribute('data-tipo', opcion.dataTipo);
          option.setAttribute('data-referencia', opcion.dataReferencia);
          option.setAttribute('data-stock', opcion.dataStock);
          option.setAttribute('data-nombre', opcion.dataNombre);
          productoSelect.appendChild(option);
        });
      } else {
        // Filtrar por categoría seleccionada
        opcionesOriginales.forEach(opcion => {
          const tipoProducto = (opcion.dataTipo || '').trim();
          
          // Comparación case-insensitive
          if (tipoProducto.toLowerCase() === categoriaSeleccionada.toLowerCase()) {
            const option = document.createElement('option');
            option.value = opcion.value;
            option.textContent = opcion.text;
            option.setAttribute('data-tipo', opcion.dataTipo);
            option.setAttribute('data-referencia', opcion.dataReferencia);
            option.setAttribute('data-stock', opcion.dataStock);
            option.setAttribute('data-nombre', opcion.dataNombre);
            productoSelect.appendChild(option);
          }
        });
      }
      
      // Restaurar la selección si el producto sigue disponible
      if (valorSeleccionado) {
        const opcionExiste = Array.from(productoSelect.options).some(opt => opt.value === valorSeleccionado);
        if (opcionExiste) {
          productoSelect.value = valorSeleccionado;
        } else {
          productoSelect.value = "";
        }
      }
    }

    // Filtrar productos al cambiar categoría
    filtroCategoria.addEventListener('change', filtrarProductos);
    
    // También escuchar cuando se abre el modal para aplicar el filtro
    const modalMantenimiento = document.getElementById('modalMantenimiento');
    if (modalMantenimiento) {
      modalMantenimiento.addEventListener('shown.bs.modal', function() {
        // Re-aplicar el filtro cuando se abre el modal
        if (filtroCategoria.value) {
          filtrarProductos();
        }
      });
    }
  }

  // Campo de fecha de vencimiento (siempre manual)
  const fechaVencimientoInput = document.getElementById('mantenimiento-fecha-vencimiento');
  
  // Asegurar que el campo de fecha siempre sea editable
  if (fechaVencimientoInput) {
    fechaVencimientoInput.readOnly = false;
    fechaVencimientoInput.classList.remove('bg-light');
    fechaVencimientoInput.setAttribute('required', 'required');
  }

  // Filtros
  if (buscadorReferencia) {
    buscadorReferencia.addEventListener('input', () => aplicarFiltros());
  }

  if (filtroEquipo) {
    filtroEquipo.addEventListener('change', () => aplicarFiltros());
  }

  if (filtroEstado) {
    filtroEstado.addEventListener('change', () => aplicarFiltros());
  }

  function aplicarFiltros() {
    const params = new URLSearchParams();

    if (buscadorReferencia?.value?.trim()) {
      params.append('referencia', buscadorReferencia.value.trim());
    }

    if (filtroEquipo?.value && filtroEquipo.value !== '') {
      params.append('equipo', filtroEquipo.value);
    }

    if (filtroEstado?.value && filtroEstado.value !== 'todos') {
      params.append('estado', filtroEstado.value);
    }

    params.append('pagina', '1'); // Resetear a página 1

    const url = '/mantenimientos?' + params.toString();
    window.location.href = url;
  }

  // Formulario de mantenimiento
  if (formularioMantenimiento) {
    console.log('✅ Formulario de mantenimiento encontrado y funcional');

    formularioMantenimiento.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('📝 Enviando formulario de mantenimiento...');

      const formData = new FormData(formularioMantenimiento);
      const data = Object.fromEntries(formData);
      console.log('📦 Datos del formulario:', data);

      // Validar según tipo de registro
      const tipoRegistro = document.querySelector('input[name="tipoRegistro"]:checked')?.value || 'maquina';
      
      if (tipoRegistro === 'maquina') {
        const maquinaSelect = document.getElementById('mantenimiento-maquina');
        if (!maquinaSelect || !maquinaSelect.value) {
          alert('Por favor selecciona una máquina');
          maquinaSelect?.focus();
          return;
        }
      } else {
        // Validar que se haya seleccionado un producto
        const productoSelect = document.getElementById('mantenimiento-producto');
        if (!productoSelect || !productoSelect.value) {
          alert('Por favor selecciona un producto');
          productoSelect?.focus();
          return;
        }

        // Validar que el producto tenga stock
        const optionSelected = productoSelect.options[productoSelect.selectedIndex];
        const stockDisponible = parseInt(optionSelected.dataset.stock) || 0;

        if (stockDisponible < 1) {
          const confirmacion = confirm('⚠️ ATENCIÓN: Este producto no tiene stock disponible (0 unidades).\n\n¿Deseas registrar el mantenimiento de todas formas?\n\nNOTA: No se descontará stock del inventario.');
          if (!confirmacion) {
            return;
          }
        }

        // Validar campos obligatorios
        const equipo = document.getElementById('mantenimiento-equipo')?.value.trim();
        if (!equipo) {
          alert('Por favor ingresa el equipo donde se instala la pieza');
          document.getElementById('mantenimiento-equipo')?.focus();
          return;
        }
      }
      const maquinaSelect = document.getElementById('mantenimiento-maquina');
      const equipoInput = document.getElementById('mantenimiento-equipo');
      
      // Procesar repuestos utilizados
      const repuestosUtilizados = [];
      const repuestosContainer = document.getElementById('repuestos-mantenimiento-container');
      if (repuestosContainer) {
        repuestosContainer.querySelectorAll('.repuesto-mantenimiento-item').forEach(item => {
          const productoId = item.querySelector('select[name*="[producto]"]')?.value;
          const cantidad = item.querySelector('input[name*="[cantidad]"]')?.value;
          const costoUnitario = item.querySelector('input[name*="[costoUnitario]"]')?.value;
          
          if (productoId && cantidad) {
            repuestosUtilizados.push({
              producto: productoId,
              cantidad: parseInt(cantidad),
              costoUnitario: costoUnitario ? parseFloat(costoUnitario) : 0
            });
          }
        });
      }

      // Obtener tipo de frecuencia del radio button seleccionado
      const tipoFrecuenciaSeleccionado = document.querySelector('input[name="tipoFrecuencia"]:checked')?.value || 'horas';
      
      // Preparar datos
      const maintenanceData = {
        maquinaId: tipoRegistro === 'maquina' && maquinaSelect?.value ? maquinaSelect.value : null,
        productoId: tipoRegistro === 'equipo' && data.productoId ? data.productoId : null,
        tipo: data.tipo || 'preventivo',
        equipo: tipoRegistro === 'equipo' ? (equipoInput?.value || '') : (maquinaSelect?.selectedOptions[0]?.dataset.nombre || ''),
        fechaInstalacion: data.fechaInstalacion || new Date().toISOString().split('T')[0],
        fechaVencimiento: data.fechaVencimiento || null,
        tipoFrecuencia: tipoFrecuenciaSeleccionado,
        intervaloDias: tipoFrecuenciaSeleccionado === 'fecha' && data.intervaloDias ? parseInt(data.intervaloDias) : null,
        horasVidaUtil: tipoFrecuenciaSeleccionado === 'horas' && data.horasVidaUtil ? parseInt(data.horasVidaUtil) : null,
        horasDiarias: tipoFrecuenciaSeleccionado === 'horas' && data.horasDiarias ? parseFloat(data.horasDiarias) : null,
        observaciones: data.observaciones || '',
        costo: data.costo ? parseFloat(data.costo) : null,
        repuestosUtilizados: repuestosUtilizados
      };

      // Validar según tipo de frecuencia
      if (maintenanceData.tipoFrecuencia === 'horas') {
        if (!maintenanceData.horasVidaUtil || maintenanceData.horasVidaUtil <= 0) {
          alert('⚠️ Por favor ingresa las horas de vida útil de la pieza.');
          horasVidaUtilInput?.focus();
          return;
        }
      } else {
        if (!maintenanceData.intervaloDias || maintenanceData.intervaloDias <= 0) {
          alert('⚠️ Por favor ingresa el intervalo de días para el cambio.');
          document.getElementById('mantenimiento-intervalo')?.focus();
          return;
        }
      }

      const submitBtn = formularioMantenimiento.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;

      // Deshabilitar botón y mostrar spinner
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Registrando...';

      try {
        const url = modoEdicion && mantenimientoEditandoId 
          ? `/mantenimientos/${mantenimientoEditandoId}`
          : '/mantenimientos';
        const method = modoEdicion ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
          body: JSON.stringify(maintenanceData)
        });

        const result = await response.json();

        if (result.success) {
          // Mostrar mensaje de éxito
          const mensajeExito = result.message || (modoEdicion ? 'Mantenimiento actualizado correctamente' : 'Mantenimiento registrado correctamente');
          alert('✅ ' + mensajeExito);

          // Cerrar modal
          modalMantenimiento.hide();

          // Recargar la página después de 500ms para mostrar los cambios
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } else {
          // Mostrar error detallado
          const mensajeError = result.message || (modoEdicion ? 'Error al actualizar el mantenimiento' : 'Error al registrar el mantenimiento');
          alert('❌ Error: ' + mensajeError + '\n\nPor favor verifica los datos e intenta nuevamente.');
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      } catch (error) {
        console.error('Error al procesar mantenimiento:', error);
        alert('❌ Error de conexión con el servidor.\n\nPor favor verifica tu conexión a internet e intenta nuevamente.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }

  // Botones de editar mantenimiento
  const botonesEditar = document.querySelectorAll('.btn-editar-mantenimiento');
  const modalMantenimiento = new bootstrap.Modal(document.getElementById('modalMantenimiento'));
  const modalTitle = document.querySelector('#modalMantenimiento .modal-title');
  const formularioMantenimiento = document.getElementById('formulario-mantenimiento');
  let modoEdicion = false;
  let mantenimientoEditandoId = null;

  botonesEditar.forEach(btn => {
    btn.addEventListener('click', function () {
      const id = this.dataset.id;
      const productoId = this.dataset.producto;
      const tipo = this.dataset.tipo;
      const equipo = this.dataset.equipo;
      const fechaInstalacion = this.dataset.fechaInstalacion;
      const fechaVencimiento = this.dataset.fechaVencimiento;
      const horas = this.dataset.horas;
      const observaciones = this.dataset.observaciones || '';
      const costo = this.dataset.costo || '';
      const estado = this.dataset.estado;

      // Cambiar título del modal
      if (modalTitle) {
        modalTitle.innerHTML = '<i class="bi bi-pencil-square me-2"></i>Editar Mantenimiento';
      }

      // Activar modo edición
      modoEdicion = true;
      mantenimientoEditandoId = id;

      // Llenar formulario con datos existentes
      if (productoId) {
        const productoSelect = document.getElementById('mantenimiento-producto');
        if (productoSelect) productoSelect.value = productoId;
      }
      if (tipo) {
        const tipoSelect = document.getElementById('mantenimiento-tipo');
        if (tipoSelect) tipoSelect.value = tipo;
      }
      if (equipo) {
        const equipoInput = document.getElementById('mantenimiento-equipo');
        if (equipoInput) equipoInput.value = equipo;
      }
      if (fechaInstalacion) {
        const fechaInstInput = document.getElementById('mantenimiento-fecha-instalacion');
        if (fechaInstInput) {
          const fecha = new Date(fechaInstalacion);
          fechaInstInput.value = fecha.toISOString().split('T')[0];
        }
      }
      if (fechaVencimiento) {
        const fechaVencInput = document.getElementById('mantenimiento-fecha-vencimiento');
        if (fechaVencInput) {
          const fecha = new Date(fechaVencimiento);
          fechaVencInput.value = fecha.toISOString().split('T')[0];
        }
      }
      if (horas) {
        const horasInput = document.getElementById('mantenimiento-horas');
        if (horasInput) horasInput.value = horas;
        // Activar modo por horas
        const radioHoras = document.getElementById('frecuencia-horas');
        if (radioHoras) {
          radioHoras.checked = true;
          toggleFrecuencia();
        }
      }
      if (observaciones) {
        const obsTextarea = document.getElementById('mantenimiento-observaciones');
        if (obsTextarea) obsTextarea.value = observaciones;
      }
      if (costo) {
        const costoInput = document.getElementById('mantenimiento-costo');
        if (costoInput) costoInput.value = costo;
      }
      if (estado) {
        // Si hay un campo de estado, llenarlo
        const estadoSelect = document.getElementById('mantenimiento-estado');
        if (estadoSelect) estadoSelect.value = estado;
      }

      // Abrir modal
      modalMantenimiento.show();
    });
  });

  // Resetear modal cuando se cierra
  document.getElementById('modalMantenimiento')?.addEventListener('hidden.bs.modal', function () {
    modoEdicion = false;
    mantenimientoEditandoId = null;
    if (modalTitle) {
      modalTitle.innerHTML = '<i class="bi bi-tools me-2"></i>Registrar Mantenimiento Preventivo';
    }
    if (formularioMantenimiento) {
      formularioMantenimiento.reset();
      // Restablecer fecha actual
      const fechaInstalacionInput = document.getElementById('mantenimiento-fecha-instalacion');
      if (fechaInstalacionInput) {
        const hoy = new Date();
        fechaInstalacionInput.value = hoy.toISOString().split('T')[0];
      }
      // Limpiar fecha de vencimiento
      const fechaVencimientoInput = document.getElementById('mantenimiento-fecha-vencimiento');
      if (fechaVencimientoInput) {
        fechaVencimientoInput.value = '';
      }
    }
  });

  // Botones de eliminar mantenimiento
  const botonesEliminar = document.querySelectorAll('.btn-eliminar-mantenimiento');
  botonesEliminar.forEach(btn => {
    btn.addEventListener('click', function () {
      const id = this.dataset.id;
      const referencia = this.dataset.referencia || 'N/A';
      const equipo = this.dataset.equipo || 'N/A';
      const productoNombre = this.dataset.productoNombre || 'N/A';

      // Confirmación mejorada con modal de Bootstrap
      const confirmacion = confirm(
        `⚠️ ¿ELIMINAR MANTENIMIENTO?\n\n` +
        `Producto: ${productoNombre}\n` +
        `Referencia: ${referencia}\n` +
        `Equipo: ${equipo}\n\n` +
        `⚠️ Esta acción NO se puede deshacer.\n` +
        `Si el mantenimiento estaba activo, el stock se devolverá al inventario.\n\n` +
        `¿Estás seguro de continuar?`
      );

      if (confirmacion) {
        eliminarMantenimiento(id);
      }
    });
  });

  async function eliminarMantenimiento(id) {
    try {
      const response = await fetch(`/mantenimientos/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (result.success) {
        alert('Mantenimiento eliminado correctamente');
        window.location.reload();
      } else {
        alert(result.message || 'Error al eliminar el mantenimiento');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    }
  }

  // ============================================
  // FUNCIONALIDAD DE MÁQUINAS Y REPUESTOS
  // ============================================
  
  const tipoRegistroRadios = document.querySelectorAll('input[name="tipoRegistro"]');
  const selectorMaquina = document.getElementById('selector-maquina');
  const inputEquipo = document.getElementById('input-equipo');
  const seccionRepuestos = document.getElementById('seccion-repuestos');
  const mantenimientoMaquina = document.getElementById('mantenimiento-maquina');
  const mantenimientoProducto = document.getElementById('mantenimiento-producto');
  const btnAgregarRepuesto = document.getElementById('btn-agregar-repuesto-mantenimiento');
  const repuestosMantenimientoContainer = document.getElementById('repuestos-mantenimiento-container');
  let repuestosMantenimientoCount = 0;
  let productosDisponibles = [];
  let repuestosMaquina = [];

  // Cargar productos disponibles
  async function cargarProductosDisponibles() {
    try {
      const response = await fetch('/maquinas/api/productos');
      const data = await response.json();
      if (data.success) {
        productosDisponibles = data.productos;
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  }

  // Toggle entre máquina y equipo manual
  if (tipoRegistroRadios.length > 0) {
    tipoRegistroRadios.forEach(radio => {
      radio.addEventListener('change', function() {
        if (this.value === 'maquina') {
          selectorMaquina?.classList.remove('d-none');
          inputEquipo?.classList.add('d-none');
          mantenimientoProducto?.closest('.col-12')?.classList.add('d-none');
          seccionRepuestos?.style.setProperty('display', 'block', 'important');
          
          // Hacer equipo opcional cuando es máquina
          const equipoInput = document.getElementById('mantenimiento-equipo');
          if (equipoInput) equipoInput.removeAttribute('required');
        } else {
          selectorMaquina?.classList.add('d-none');
          inputEquipo?.classList.remove('d-none');
          mantenimientoProducto?.closest('.col-12')?.classList.remove('d-none');
          seccionRepuestos?.style.setProperty('display', 'none', 'important');
          
          // Hacer equipo requerido cuando es manual
          const equipoInput = document.getElementById('mantenimiento-equipo');
          if (equipoInput) equipoInput.setAttribute('required', 'required');
          
          // Limpiar repuestos
          if (repuestosMantenimientoContainer) {
            repuestosMantenimientoContainer.innerHTML = '';
            repuestosMantenimientoCount = 0;
          }
        }
      });
    });
  }

  // Cargar repuestos cuando se selecciona una máquina
  if (mantenimientoMaquina) {
    mantenimientoMaquina.addEventListener('change', async function() {
      const maquinaId = this.value;
      
      if (!maquinaId) {
        if (repuestosMantenimientoContainer) {
          repuestosMantenimientoContainer.innerHTML = '';
          repuestosMantenimientoCount = 0;
        }
        return;
      }

      try {
        const response = await fetch(`/maquinas/api/qr/${this.options[this.selectedIndex].dataset.codigo}`);
        const data = await response.json();
        
        if (data.success && data.data.maquina.repuestos) {
          repuestosMaquina = data.data.maquina.repuestos;
          
          // Limpiar repuestos anteriores
          if (repuestosMantenimientoContainer) {
            repuestosMantenimientoContainer.innerHTML = '';
            repuestosMantenimientoCount = 0;
          }
          
          // Agregar repuestos de la máquina automáticamente
          repuestosMaquina.forEach(repuesto => {
            if (repuesto.producto && repuesto.producto._id) {
              agregarRepuestoMantenimiento({
                producto: repuesto.producto._id,
                cantidad: repuesto.cantidadRequerida || 1,
                costoUnitario: repuesto.producto.costoUnitario || 0
              });
            }
          });
        }
      } catch (error) {
        console.error('Error cargando repuestos de máquina:', error);
      }
    });
  }

  // Agregar repuesto al mantenimiento
  function agregarRepuestoMantenimiento(repuesto = null) {
    const repuestoId = `repuesto-mant-${repuestosMantenimientoCount++}`;
    const repuestoDiv = document.createElement('div');
    repuestoDiv.className = 'card mb-3 repuesto-mantenimiento-item';
    repuestoDiv.id = repuestoId;
    
    const productoId = repuesto ? repuesto.producto : '';
    const cantidad = repuesto ? repuesto.cantidad : 1;
    const costoUnitario = repuesto ? repuesto.costoUnitario : 0;

    // Crear opciones de productos
    let productosOptions = '<option value="">Seleccione un producto</option>';
    productosDisponibles.forEach(prod => {
      const selected = prod._id === productoId ? 'selected' : '';
      const stockBadge = prod.existencia === 0 ? 'bg-danger' : prod.existencia <= 4 ? 'bg-warning' : 'bg-success';
      productosOptions += `<option value="${prod._id}" ${selected} data-stock="${prod.existencia}" data-costo="${prod.costoUnitario || 0}">${prod.referencia} - ${prod.nombre} (Stock: ${prod.existencia})</option>`;
    });

    repuestoDiv.innerHTML = `
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="mb-0 text-primary">
            <i class="bi bi-box me-2"></i>Repuesto ${repuestosMantenimientoCount}
          </h6>
          <button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-repuesto-mant">
            <i class="bi bi-trash"></i>
          </button>
        </div>
        <div class="row g-3">
          <div class="col-12 col-md-5">
            <label class="form-label fw-semibold">Producto *</label>
            <select class="form-select form-select-lg select-producto-mant" name="repuestosUtilizados[${repuestosMantenimientoCount - 1}][producto]" required>
              ${productosOptions}
            </select>
          </div>
          <div class="col-12 col-md-3">
            <label class="form-label fw-semibold">Cantidad *</label>
            <input 
              type="number" 
              class="form-control form-control-lg" 
              name="repuestosUtilizados[${repuestosMantenimientoCount - 1}][cantidad]" 
              value="${cantidad}"
              min="1" 
              required
            >
          </div>
          <div class="col-12 col-md-4">
            <label class="form-label fw-semibold">Costo Unitario</label>
            <input 
              type="number" 
              class="form-control form-control-lg" 
              name="repuestosUtilizados[${repuestosMantenimientoCount - 1}][costoUnitario]"
              value="${costoUnitario}"
              min="0" 
              step="0.01"
            >
          </div>
        </div>
      </div>
    `;

    if (repuestosMantenimientoContainer) {
      repuestosMantenimientoContainer.appendChild(repuestoDiv);
    }

    // Actualizar costo cuando se selecciona un producto
    const selectProducto = repuestoDiv.querySelector('.select-producto-mant');
    const costoInput = repuestoDiv.querySelector('input[name*="[costoUnitario]"]');
    
    selectProducto.addEventListener('change', function() {
      const selectedOption = this.options[this.selectedIndex];
      const costo = selectedOption.dataset.costo || '0';
      if (costoInput && !costoInput.value) {
        costoInput.value = costo;
      }
    });

    // Eliminar repuesto
    repuestoDiv.querySelector('.btn-eliminar-repuesto-mant').addEventListener('click', function() {
      repuestoDiv.remove();
    });
  }

  // Botón agregar repuesto
  if (btnAgregarRepuesto) {
    btnAgregarRepuesto.addEventListener('click', function() {
      agregarRepuestoMantenimiento();
    });
  }

  // Cargar productos al iniciar
  cargarProductosDisponibles();
});

