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
    calcularFechaProximoCambio();
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

  // Filtro de Categoría
  const filtroCategoria = document.getElementById('filtro-categoria-producto');
  const productoSelect = document.getElementById('mantenimiento-producto');

  if (filtroCategoria && productoSelect) {
    // Obtener categorías únicas desde las opciones del select
    const categorias = new Set();
    Array.from(productoSelect.options).forEach(option => {
      // Buscar el atributo data-tipo en la opción
      const tipo = option.getAttribute('data-tipo') || option.dataset.tipo;
      if (tipo && tipo.trim() !== '') {
        categorias.add(tipo.trim());
      }
    });

    // Llenar select de categorías (ordenar alfabéticamente)
    const categoriasOrdenadas = Array.from(categorias).sort();
    categoriasOrdenadas.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      filtroCategoria.appendChild(option);
    });

    // Filtrar productos al cambiar categoría
    filtroCategoria.addEventListener('change', () => {
      const categoriaSeleccionada = filtroCategoria.value.trim();
      
      Array.from(productoSelect.options).forEach(option => {
        if (option.value === "") {
          // Mantener opción por defecto siempre visible
          option.style.display = '';
          return;
        }

        // Obtener el tipo del producto (sin convertir a minúsculas para comparación exacta)
        const tipoProducto = (option.getAttribute('data-tipo') || option.dataset.tipo || '').trim();
        
        // Si no hay categoría seleccionada, mostrar todos
        // Si hay categoría seleccionada, mostrar solo los que coincidan exactamente
        if (!categoriaSeleccionada || tipoProducto === categoriaSeleccionada) {
          option.style.display = '';
        } else {
          option.style.display = 'none';
        }
      });
      
      // Resetear selección si el actual queda oculto
      const selectedOption = productoSelect.options[productoSelect.selectedIndex];
      if (selectedOption && selectedOption.style.display === 'none') {
        productoSelect.value = "";
      }
    });
    
    // Aplicar filtro inicial si hay una categoría seleccionada
    if (filtroCategoria.value) {
      filtroCategoria.dispatchEvent(new Event('change'));
    }
  }

  // Cálculo automático de fecha de próximo cambio
  const horasVidaUtilInput = document.getElementById('mantenimiento-horas');
  const horasDiariasInput = document.getElementById('mantenimiento-horas-diarias');
  const fechaVencimientoInput = document.getElementById('mantenimiento-fecha-vencimiento');
  const calculoDiv = document.getElementById('calculo-mantenimiento');
  const fechaAutomaticaSwitch = document.getElementById('fecha-automatica');

  // Toggle fecha automática/manual
  if (fechaAutomaticaSwitch && fechaVencimientoInput) {
    fechaAutomaticaSwitch.addEventListener('change', function() {
      if (this.checked) {
        // Modo automático
        fechaVencimientoInput.readOnly = true;
        fechaVencimientoInput.classList.add('bg-light');
        fechaVencimientoInput.removeAttribute('required');
        calcularFechaProximoCambio();
      } else {
        // Modo manual
        fechaVencimientoInput.readOnly = false;
        fechaVencimientoInput.classList.remove('bg-light');
        fechaVencimientoInput.setAttribute('required', 'required');
        if (calculoDiv) {
          calculoDiv.innerHTML = '<small class="text-info"><i class="bi bi-info-circle me-1"></i>Ingresa la fecha manualmente.</small>';
        }
      }
    });
    
    // Inicializar estado del switch
    if (fechaAutomaticaSwitch.checked) {
      fechaVencimientoInput.readOnly = true;
      fechaVencimientoInput.classList.add('bg-light');
    } else {
      fechaVencimientoInput.readOnly = false;
      fechaVencimientoInput.classList.remove('bg-light');
    }
  }

  function calcularFechaProximoCambio() {
    // Si el modo automático está desactivado, no calcular
    if (fechaAutomaticaSwitch && !fechaAutomaticaSwitch.checked) {
      return;
    }

    const fechaInstalacion = fechaInstalacionInput?.value;
    let diasHastaCambio = 0;
    let esPorFecha = radioFecha?.checked;

    if (!fechaInstalacion) {
      limpiarCalculo();
      return;
    }

    if (esPorFecha) {
      const intervalo = parseInt(intervaloInput?.value) || 0;
      if (!intervalo || intervalo <= 0) {
        limpiarCalculo();
        return;
      }
      diasHastaCambio = intervalo;
    } else {
      // Modo por horas
      const horasVidaUtil = parseFloat(horasVidaUtilInput?.value) || 0;
      const horasDiarias = parseFloat(horasDiariasInput?.value) || 0;

      if (!horasVidaUtil || horasVidaUtil <= 0 || !horasDiarias || horasDiarias <= 0) {
        limpiarCalculo();
        return;
      }
      // Calcular días: horas de vida útil / horas diarias
      diasHastaCambio = horasVidaUtil / horasDiarias;
    }

    // Calcular fecha de próximo cambio
    const fechaInst = new Date(fechaInstalacion + 'T00:00:00');
    if (isNaN(fechaInst.getTime())) {
      limpiarCalculo();
      return;
    }
    
    // Sumar días
    fechaInst.setDate(fechaInst.getDate() + Math.ceil(diasHastaCambio));

    // Formatear fecha (YYYY-MM-DD)
    const año = fechaInst.getFullYear();
    const mes = String(fechaInst.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaInst.getDate()).padStart(2, '0');
    const fechaFormateada = `${año}-${mes}-${dia}`;

    if (fechaVencimientoInput) {
      // Solo actualizar si está en modo automático
      if (fechaVencimientoInput.readOnly) {
        fechaVencimientoInput.value = fechaFormateada;
      }
    }

    mostrarCalculo(diasHastaCambio, fechaFormateada, esPorFecha);
  }

  function limpiarCalculo() {
    if (calculoDiv) {
      calculoDiv.innerHTML = '<small class="text-muted">Completa los datos de frecuencia para calcular automáticamente la fecha de próximo cambio.</small>';
    }
    if (fechaVencimientoInput) {
      fechaVencimientoInput.value = '';
    }
  }

  function mostrarCalculo(diasHastaCambio, fechaFormateada, esPorFecha) {
    if (calculoDiv) {
      const diasTotales = Math.ceil(diasHastaCambio);
      const semanas = Math.floor(diasTotales / 7);
      const meses = Math.floor(diasTotales / 30);
      const años = Math.floor(diasTotales / 365);

      // Formatear fecha en español
      const fechaObj = new Date(fechaFormateada);
      const opcionesFecha = { year: 'numeric', month: 'long', day: 'numeric' };
      const fechaFormateadaEsp = fechaObj.toLocaleDateString('es-AR', opcionesFecha);

      let mensaje = `<div class="row g-2 mb-2">`;

      if (esPorFecha) {
        mensaje += `<div class="col-12">`;
        mensaje += `<small class="text-muted d-block mb-1">Intervalo fijo</small>`;
        mensaje += `<strong class="fs-6">${diasTotales} días</strong>`;
        mensaje += `</div>`;
      } else {
        mensaje += `<div class="col-6">`;
        mensaje += `<small class="text-muted d-block mb-1">Horas de vida útil</small>`;
        mensaje += `<strong class="fs-6">${parseFloat(horasVidaUtilInput.value).toLocaleString()} hrs</strong>`;
        mensaje += `</div>`;
        mensaje += `<div class="col-6">`;
        mensaje += `<small class="text-muted d-block mb-1">Horas trabajo/día</small>`;
        mensaje += `<strong class="fs-6">${parseFloat(horasDiariasInput.value)} hrs/día</strong>`;
        mensaje += `</div>`;
      }

      mensaje += `</div>`;
      mensaje += `<hr class="my-2">`;
      mensaje += `<div class="mb-2">`;
      mensaje += `<small class="text-muted d-block mb-1">Tiempo hasta el cambio</small>`;
      mensaje += `<div class="d-flex align-items-center gap-2">`;
      mensaje += `<span class="badge bg-primary">${diasTotales} días</span>`;

      if (semanas > 0 && semanas < 8) {
        mensaje += `<small class="text-muted">(~${semanas} semana${semanas > 1 ? 's' : ''})</small>`;
      } else if (meses > 0 && meses < 13) {
        mensaje += `<small class="text-muted">(~${meses} mes${meses > 1 ? 'es' : ''})</small>`;
      } else if (años > 0) {
        mensaje += `<small class="text-muted">(~${años} año${años > 1 ? 's' : ''})</small>`;
      }

      mensaje += `</div>`;
      mensaje += `</div>`;
      mensaje += `<div class="p-2 bg-success bg-opacity-10 border border-success rounded">`;
      mensaje += `<small class="text-muted d-block mb-1">📅 Fecha de próximo cambio</small>`;
      mensaje += `<strong class="text-success fs-5">${fechaFormateadaEsp}</strong>`;
      mensaje += `</div>`;

      calculoDiv.innerHTML = mensaje;
    }
  }

  // Agregar listeners para cálculo automático - Usar debounce para mejor rendimiento
  let timeoutCalculo = null;
  function triggerCalculo() {
    if (timeoutCalculo) clearTimeout(timeoutCalculo);
    timeoutCalculo = setTimeout(() => {
      calcularFechaProximoCambio();
    }, 300);
  }

  if (intervaloInput) {
    intervaloInput.addEventListener('input', triggerCalculo);
    intervaloInput.addEventListener('change', calcularFechaProximoCambio);
    intervaloInput.addEventListener('blur', calcularFechaProximoCambio);
  }

  if (horasVidaUtilInput) {
    horasVidaUtilInput.addEventListener('input', triggerCalculo);
    horasVidaUtilInput.addEventListener('change', calcularFechaProximoCambio);
    horasVidaUtilInput.addEventListener('blur', calcularFechaProximoCambio);
  }

  if (horasDiariasInput) {
    horasDiariasInput.addEventListener('input', triggerCalculo);
    horasDiariasInput.addEventListener('change', calcularFechaProximoCambio);
    horasDiariasInput.addEventListener('blur', calcularFechaProximoCambio);
  }

  if (fechaInstalacionInput) {
    fechaInstalacionInput.addEventListener('change', calcularFechaProximoCambio);
    fechaInstalacionInput.addEventListener('input', triggerCalculo);
  }
  
  // Recalcular cuando cambia el tipo de frecuencia
  if (radioHoras && radioFecha) {
    radioHoras.addEventListener('change', () => {
      setTimeout(calcularFechaProximoCambio, 100);
    });
    radioFecha.addEventListener('change', () => {
      setTimeout(calcularFechaProximoCambio, 100);
    });
  }
  
  // Calcular inicialmente si hay datos
  setTimeout(() => {
    if (fechaAutomaticaSwitch && fechaAutomaticaSwitch.checked) {
      calcularFechaProximoCambio();
    }
  }, 500);

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
          // Hacer editable la fecha
          fechaVencInput.readOnly = false;
          fechaVencInput.classList.remove('bg-light');
          const fechaAutomaticaSwitch = document.getElementById('fecha-automatica');
          if (fechaAutomaticaSwitch) fechaAutomaticaSwitch.checked = false;
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
      // Restablecer fecha automática
      const fechaAutomaticaSwitch = document.getElementById('fecha-automatica');
      if (fechaAutomaticaSwitch) fechaAutomaticaSwitch.checked = true;
      const fechaVencimientoInput = document.getElementById('mantenimiento-fecha-vencimiento');
      if (fechaVencimientoInput) {
        fechaVencimientoInput.readOnly = true;
        fechaVencimientoInput.classList.add('bg-light');
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

