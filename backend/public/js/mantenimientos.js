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

  // Cálculo automático de fecha de próximo cambio
  const horasVidaUtilInput = document.getElementById('mantenimiento-horas');
  const horasDiariasInput = document.getElementById('mantenimiento-horas-diarias');
  const fechaVencimientoInput = document.getElementById('mantenimiento-fecha-vencimiento');
  const calculoDiv = document.getElementById('calculo-mantenimiento');

  function calcularFechaProximoCambio() {
    const horasVidaUtil = parseFloat(horasVidaUtilInput?.value) || 0;
    const horasDiarias = parseFloat(horasDiariasInput?.value) || 12;
    const fechaInstalacion = fechaInstalacionInput?.value;

    if (!horasVidaUtil || !fechaInstalacion || !horasDiarias) {
      if (calculoDiv) {
        calculoDiv.innerHTML = '<small class="text-muted">Completa las horas de vida útil y las horas diarias para calcular automáticamente la fecha de próximo cambio.</small>';
      }
      if (fechaVencimientoInput) {
        fechaVencimientoInput.value = '';
      }
      return;
    }

    // Calcular días hasta el cambio
    const diasHastaCambio = horasVidaUtil / horasDiarias;

    // Calcular fecha de próximo cambio
    const fechaInst = new Date(fechaInstalacion);
    fechaInst.setDate(fechaInst.getDate() + Math.ceil(diasHastaCambio));

    // Formatear fecha
    const fechaFormateada = fechaInst.toISOString().split('T')[0];

    if (fechaVencimientoInput) {
      fechaVencimientoInput.value = fechaFormateada;
    }

      // Mostrar cálculo
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
        mensaje += `<div class="col-6">`;
        mensaje += `<small class="text-muted d-block mb-1">Horas de vida útil</small>`;
        mensaje += `<strong class="fs-6">${horasVidaUtil.toLocaleString()} hrs</strong>`;
        mensaje += `</div>`;
        mensaje += `<div class="col-6">`;
        mensaje += `<small class="text-muted d-block mb-1">Horas trabajo/día</small>`;
        mensaje += `<strong class="fs-6">${horasDiarias} hrs/día</strong>`;
        mensaje += `</div>`;
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

  // Agregar listeners para cálculo automático
  if (horasVidaUtilInput) {
    horasVidaUtilInput.addEventListener('input', calcularFechaProximoCambio);
    horasVidaUtilInput.addEventListener('change', calcularFechaProximoCambio);
  }

  if (horasDiariasInput) {
    horasDiariasInput.addEventListener('input', calcularFechaProximoCambio);
    horasDiariasInput.addEventListener('change', calcularFechaProximoCambio);
  }

  if (fechaInstalacionInput) {
    fechaInstalacionInput.addEventListener('change', calcularFechaProximoCambio);
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

      // Validar que se haya seleccionado un producto
      const productoSelect = document.getElementById('mantenimiento-producto');
      if (!productoSelect || !productoSelect.value) {
        alert('Por favor selecciona un producto');
        productoSelect.focus();
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
      const equipo = document.getElementById('mantenimiento-equipo').value.trim();
      if (!equipo) {
        alert('Por favor ingresa el equipo donde se instala la pieza');
        document.getElementById('mantenimiento-equipo').focus();
        return;
      }

      // Preparar datos
      const maintenanceData = {
        productoId: data.productoId,
        tipo: data.tipo || 'preventivo',
        equipo: data.equipo || '',
        fechaInstalacion: data.fechaInstalacion || new Date().toISOString().split('T')[0],
        fechaVencimiento: data.fechaVencimiento || null,
        horasVidaUtil: data.horasVidaUtil ? parseInt(data.horasVidaUtil) : null,
        observaciones: data.observaciones || '',
        costo: data.costo ? parseFloat(data.costo) : null
      };

      // Validar que tenga horas de vida útil
      if (!maintenanceData.horasVidaUtil || maintenanceData.horasVidaUtil <= 0) {
        alert('⚠️ Por favor ingresa las horas de vida útil de la pieza. Esto es necesario para calcular cuándo debe cambiarse.');
        horasVidaUtilInput?.focus();
        return;
      }

      const submitBtn = formularioMantenimiento.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;

      // Deshabilitar botón y mostrar spinner
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Registrando...';

      try {
        const response = await fetch('/mantenimientos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
          body: JSON.stringify(maintenanceData)
        });

        const result = await response.json();

        if (result.success) {
          // Mostrar mensaje de éxito
          const mensajeExito = result.message || 'Mantenimiento registrado correctamente';
          alert('✅ ' + mensajeExito);
          
          // Limpiar formulario
          formularioMantenimiento.reset();
          
          // Restablecer fecha actual
          if (fechaInstalacionInput) {
            const hoy = new Date();
            fechaInstalacionInput.value = hoy.toISOString().split('T')[0];
          }
          
          // Recargar la página después de 500ms para mostrar el nuevo mantenimiento
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } else {
          // Mostrar error detallado
          const mensajeError = result.message || 'Error al registrar el mantenimiento';
          alert('❌ Error: ' + mensajeError + '\n\nPor favor verifica los datos e intenta nuevamente.');
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      } catch (error) {
        console.error('Error al registrar mantenimiento:', error);
        alert('❌ Error de conexión con el servidor.\n\nPor favor verifica tu conexión a internet e intenta nuevamente.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }

  // Botones de eliminar mantenimiento
  const botonesEliminar = document.querySelectorAll('.btn-eliminar-mantenimiento');
  botonesEliminar.forEach(btn => {
    btn.addEventListener('click', function () {
      const id = this.dataset.id;
      const referencia = this.dataset.referencia;
      const equipo = this.dataset.equipo;

      if (confirm(`¿Estás seguro de eliminar el mantenimiento de ${referencia} en ${equipo}? Si estaba activo, el stock se devolverá al inventario.`)) {
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
});

