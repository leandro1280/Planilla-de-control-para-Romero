// Funcionalidad de movimientos
document.addEventListener('DOMContentLoaded', function() {
  const buscador = document.getElementById('buscador-movimientos');
  const filtroTipo = document.getElementById('filtro-tipo-movimientos');
  const filtroTipoProducto = document.getElementById('selector-tipo-grafico');
  const filtroProducto = document.getElementById('selector-producto-grafico');
  const filtroMes = document.getElementById('filtro-mes');
  const filtroAnio = document.getElementById('filtro-anio');
  const botonActualizar = document.getElementById('boton-actualizar');

  // Tipos de gráficos por cada canvas
  let tipoGraficoCantidades = 'bar';
  let tipoGraficoGastos = 'doughnut';
  let tipoGraficoTop = 'bar';
  let tipoGraficoTipos = 'bar';

  let graficoCantidades = null;
  let graficoGastos = null;
  let graficoTop = null;
  let graficoTipos = null;

  // Filtros
  function aplicarFiltros() {
    const params = new URLSearchParams();
    
    if (buscador?.value?.trim()) params.append('busqueda', buscador.value.trim());
    if (filtroTipo?.value && filtroTipo.value !== 'todos') params.append('tipo', filtroTipo.value);
    if (filtroTipoProducto?.value && filtroTipoProducto.value !== 'todos') params.append('tipoProducto', filtroTipoProducto.value);
    if (filtroProducto?.value && filtroProducto.value !== 'todos') params.append('referencia', filtroProducto.value);
    if (filtroMes?.value) params.append('mes', filtroMes.value);
    if (filtroAnio?.value) params.append('anio', filtroAnio.value);
    
    const url = params.toString() ? '/movimientos?' + params.toString() : '/movimientos';
    window.location.href = url;
  }

  if (buscador) buscador.addEventListener('input', aplicarFiltros);
  if (filtroTipo) filtroTipo.addEventListener('change', aplicarFiltros);
  if (filtroTipoProducto) filtroTipoProducto.addEventListener('change', aplicarFiltros);
  if (filtroProducto) filtroProducto.addEventListener('change', aplicarFiltros);
  if (filtroMes) filtroMes.addEventListener('change', aplicarFiltros);
  if (filtroAnio) filtroAnio.addEventListener('change', aplicarFiltros);

  // Cambiar tipo de gráfico
  document.querySelectorAll('[data-grafico][data-tipo]').forEach(btn => {
    btn.addEventListener('click', function() {
      const grafico = this.getAttribute('data-grafico');
      const tipo = this.getAttribute('data-tipo');
      
      // Actualizar botones activos
      document.querySelectorAll(`[data-grafico="${grafico}"]`).forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Actualizar tipo de gráfico
      switch(grafico) {
        case 'cantidades':
          tipoGraficoCantidades = tipo;
          break;
        case 'gastos':
          tipoGraficoGastos = tipo;
          break;
        case 'top':
          tipoGraficoTop = tipo;
          break;
        case 'tipos':
          tipoGraficoTipos = tipo;
          break;
      }
      
      // Recargar gráficos
      if (window.Chart) {
        cargarGraficos();
      }
    });
  });

  // Actualizar
  if (botonActualizar) {
    botonActualizar.addEventListener('click', () => {
      window.location.reload();
    });
  }

  // Cargar estadísticas y gráficos (usar datos de la página)
  function cargarGraficos() {
    // Usar datos pasados desde el servidor
    const stats = window.statsData || calcularEstadisticas(window.movimientosData || []);
    
    if (!stats || (stats.totalIngresos === 0 && stats.totalEgresos === 0)) {
      console.warn('No hay datos de estadísticas disponibles');
      // Mostrar mensaje en los canvas
      return;
    }
    
    actualizarGraficos(stats);
  }
  
  // Calcular estadísticas desde movimientos
  function calcularEstadisticas(movimientos) {
    let totalIngresos = 0;
    let totalEgresos = 0;
    let totalInvertido = 0;
    let totalConsumido = 0;
    const egresosPorRef = {};
    const porTipo = {};
    
    movimientos.forEach(mov => {
      if (mov.tipo === 'ingreso') {
        totalIngresos += mov.cantidad || 0;
        totalInvertido += mov.costoTotal || 0;
        
        if (mov.tipoProducto) {
          if (!porTipo[mov.tipoProducto]) {
            porTipo[mov.tipoProducto] = { ingresos: 0, egresos: 0 };
          }
          porTipo[mov.tipoProducto].ingresos += mov.cantidad || 0;
        }
      } else {
        totalEgresos += mov.cantidad || 0;
        totalConsumido += mov.costoTotal || 0;
        
        if (mov.referencia) {
          if (!egresosPorRef[mov.referencia]) {
            egresosPorRef[mov.referencia] = 0;
          }
          egresosPorRef[mov.referencia] += mov.cantidad || 0;
        }
        
        if (mov.tipoProducto) {
          if (!porTipo[mov.tipoProducto]) {
            porTipo[mov.tipoProducto] = { ingresos: 0, egresos: 0 };
          }
          porTipo[mov.tipoProducto].egresos += mov.cantidad || 0;
        }
      }
    });
    
    // Top 5 egresos por referencia
    const topEgresos = Object.entries(egresosPorRef)
      .map(([ref, cantidad]) => ({ referencia: ref, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
    
    return {
      totalIngresos,
      totalEgresos,
      totalInvertido,
      totalConsumido,
      topEgresos,
      porTipo
    };
  }

  function actualizarGraficos(data) {
    // Destruir gráficos existentes
    if (graficoCantidades) graficoCantidades.destroy();
    if (graficoGastos) graficoGastos.destroy();
    if (graficoTop) graficoTop.destroy();
    if (graficoTipos) graficoTipos.destroy();

    // Gráfico de cantidades
    const ctxCantidades = document.getElementById('grafico-cantidades');
    if (ctxCantidades && window.Chart) {
      const config = {
        data: {
          labels: ['Ingresos', 'Egresos'],
          datasets: [{
            label: 'Unidades',
            data: [data.totalIngresos, data.totalEgresos],
            backgroundColor: tipoGraficoCantidades === 'pie' ? ['#28a745', '#dc3545'] : 
                           tipoGraficoCantidades === 'line' ? '#28a745' : ['#28a745', '#dc3545'],
            borderColor: tipoGraficoCantidades === 'line' ? '#28a745' : undefined,
            borderWidth: tipoGraficoCantidades === 'line' ? 2 : undefined,
            fill: tipoGraficoCantidades === 'line' ? false : undefined,
            tension: tipoGraficoCantidades === 'line' ? 0.4 : undefined
          }]
        },
        options: {
          responsive: true,
          plugins: { 
            legend: { display: tipoGraficoCantidades === 'pie' || tipoGraficoCantidades === 'line' },
            tooltip: { enabled: true }
          },
          scales: tipoGraficoCantidades !== 'pie' ? {
            y: { beginAtZero: true }
          } : undefined
        }
      };
      
      if (tipoGraficoCantidades === 'line') {
        config.data.datasets[0].pointBackgroundColor = '#28a745';
        config.data.datasets[0].pointBorderColor = '#fff';
        config.data.datasets[0].pointRadius = 5;
      }
      
      graficoCantidades = new Chart(ctxCantidades, {
        type: tipoGraficoCantidades,
        ...config
      });
    }

    // Gráfico de gastos
    const ctxGastos = document.getElementById('grafico-gastos');
    if (ctxGastos && window.Chart) {
      const config = {
        data: {
          labels: ['Invertido', 'Consumido'],
          datasets: [{
            label: tipoGraficoGastos === 'line' || tipoGraficoGastos === 'bar' ? '$' : undefined,
            data: [data.totalInvertido, data.totalConsumido],
            backgroundColor: tipoGraficoGastos === 'doughnut' ? ['#17a2b8', '#ffc107'] : 
                           tipoGraficoGastos === 'line' ? '#17a2b8' : ['#17a2b8', '#ffc107'],
            borderColor: tipoGraficoGastos === 'line' ? '#17a2b8' : undefined,
            borderWidth: tipoGraficoGastos === 'line' || tipoGraficoGastos === 'bar' ? 2 : undefined,
            fill: tipoGraficoGastos === 'line' ? false : undefined,
            tension: tipoGraficoGastos === 'line' ? 0.4 : undefined
          }]
        },
        options: {
          responsive: true,
          plugins: { 
            legend: { position: 'bottom' },
            tooltip: { enabled: true }
          },
          scales: tipoGraficoGastos === 'line' || tipoGraficoGastos === 'bar' ? {
            y: { beginAtZero: true }
          } : undefined
        }
      };
      
      if (tipoGraficoGastos === 'line') {
        config.data.datasets[0].pointBackgroundColor = '#17a2b8';
        config.data.datasets[0].pointBorderColor = '#fff';
        config.data.datasets[0].pointRadius = 5;
      }
      
      graficoGastos = new Chart(ctxGastos, {
        type: tipoGraficoGastos,
        ...config
      });
    }

    // Gráfico top egresos
    const ctxTop = document.getElementById('grafico-top');
    if (ctxTop && window.Chart && data.topEgresos && data.topEgresos.length) {
      const config = {
        data: {
          labels: data.topEgresos.map(e => e.referencia),
          datasets: [{
            label: 'Egresos',
            data: data.topEgresos.map(e => e.cantidad),
            backgroundColor: tipoGraficoTop === 'line' ? '#dc3545' : '#dc3545',
            borderColor: tipoGraficoTop === 'line' ? '#dc3545' : undefined,
            borderWidth: tipoGraficoTop === 'line' ? 2 : undefined,
            fill: tipoGraficoTop === 'line' ? false : undefined,
            tension: tipoGraficoTop === 'line' ? 0.4 : undefined
          }]
        },
        options: {
          responsive: true,
          indexAxis: tipoGraficoTop === 'bar' ? 'y' : undefined,
          plugins: { legend: { display: false } },
          scales: tipoGraficoTop === 'line' ? {
            y: { beginAtZero: true }
          } : tipoGraficoTop === 'bar' ? undefined : {
            y: { beginAtZero: true }
          }
        }
      };
      
      if (tipoGraficoTop === 'line') {
        config.data.datasets[0].pointBackgroundColor = '#dc3545';
        config.data.datasets[0].pointBorderColor = '#fff';
        config.data.datasets[0].pointRadius = 5;
      }
      
      graficoTop = new Chart(ctxTop, {
        type: tipoGraficoTop,
        ...config
      });
    }

    // Gráfico por tipos
    const ctxTipos = document.getElementById('grafico-tipos');
    if (ctxTipos && window.Chart && data.porTipo) {
      const tipos = Object.keys(data.porTipo);
      const ingresos = tipos.map(t => data.porTipo[t].ingresos || 0);
      const egresos = tipos.map(t => data.porTipo[t].egresos || 0);
      
      const config = {
        data: {
          labels: tipos,
          datasets: tipoGraficoTipos === 'line' ? [
            {
              label: 'Ingresos',
              data: ingresos,
              borderColor: '#28a745',
              backgroundColor: 'rgba(40, 167, 69, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#28a745',
              pointBorderColor: '#fff',
              pointRadius: 5
            },
            {
              label: 'Egresos',
              data: egresos,
              borderColor: '#dc3545',
              backgroundColor: 'rgba(220, 53, 69, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#dc3545',
              pointBorderColor: '#fff',
              pointRadius: 5
            }
          ] : [
            {
              label: 'Ingresos',
              data: ingresos,
              backgroundColor: '#28a745'
            },
            {
              label: 'Egresos',
              data: egresos,
              backgroundColor: '#dc3545'
            }
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom' } },
          scales: tipoGraficoTipos === 'line' ? {
            y: { beginAtZero: true }
          } : undefined
        }
      };
      
      graficoTipos = new Chart(ctxTipos, {
        type: tipoGraficoTipos,
        ...config
      });
    }
  }

  // Cargar gráficos al iniciar
  if (window.Chart) {
    cargarGraficos();
  }

  // Actualizar gráficos cuando cambian los filtros
  if (filtroTipoProducto) filtroTipoProducto.addEventListener('change', cargarGraficos);
  if (filtroProducto) filtroProducto.addEventListener('change', cargarGraficos);
});

