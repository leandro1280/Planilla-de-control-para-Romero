// Sistema de notificaciones para administradores
let notificacionesInterval = null;

// Función para formatear fecha relativa
function formatearFechaRelativa(fecha) {
  const ahora = new Date();
  const fechaNotif = new Date(fecha);
  const diffMs = ahora - fechaNotif;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Hace unos segundos';
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  
  return fechaNotif.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Función para obtener icono según el tipo
function getIconoTipo(tipo) {
  switch(tipo) {
    case 'producto_creado':
    case 'producto_actualizado':
      return 'bi-box-seam';
    case 'movimiento_creado':
      return 'bi-arrow-left-right';
    case 'usuario_creado':
      return 'bi-person-plus';
    default:
      return 'bi-bell';
  }
}

// Función para obtener clase de icono según el tipo
function getIconoClass(tipo) {
  switch(tipo) {
    case 'producto_creado':
    case 'producto_actualizado':
      return 'producto';
    case 'movimiento_creado':
      return 'movimiento';
    case 'usuario_creado':
      return 'usuario';
    default:
      return '';
  }
}

// Función para cargar notificaciones
async function cargarNotificaciones() {
  try {
    const response = await fetch('/api/notificaciones?limite=10', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.error('Error en respuesta de notificaciones:', response.status);
      return;
    }
    
    const result = await response.json();
    
    if (result.success && result.data) {
      const noLeidas = result.data.noLeidas || 0;
      const notificaciones = result.data.notificaciones || [];
      
      actualizarBadge(noLeidas);
      renderizarNotificaciones(notificaciones);
      
      // Mostrar/ocultar botón "Marcar todas como leídas"
      const markAllReadBtn = document.getElementById('markAllRead');
      if (markAllReadBtn) {
        markAllReadBtn.style.display = noLeidas > 0 ? 'block' : 'none';
      }
    } else {
      console.error('Error en datos de notificaciones:', result);
      const list = document.getElementById('notificationList');
      if (list) {
        list.innerHTML = '<li class="px-3 py-3 text-center text-danger"><small><i class="bi bi-exclamation-triangle me-1"></i>Error al cargar notificaciones</small></li>';
      }
    }
  } catch (error) {
    console.error('Error cargando notificaciones:', error);
    const list = document.getElementById('notificationList');
    if (list) {
      list.innerHTML = '<li class="px-3 py-3 text-center text-danger"><small><i class="bi bi-exclamation-triangle me-1"></i>Error de conexión</small></li>';
    }
  }
}

// Función para actualizar el badge de notificaciones
function actualizarBadge(noLeidas) {
  const badge = document.getElementById('notificationBadge');
  if (badge) {
    if (noLeidas > 0) {
      badge.textContent = noLeidas > 99 ? '99+' : noLeidas;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }
}

// Función para renderizar notificaciones
function renderizarNotificaciones(notificaciones) {
  const list = document.getElementById('notificationList');
  if (!list) {
    console.error('notificationList no encontrado');
    return;
  }
  
  if (!notificaciones || notificaciones.length === 0) {
    list.innerHTML = '<li class="px-3 py-4 text-center text-muted"><small><i class="bi bi-inbox me-1"></i>No hay notificaciones</small></li>';
    return;
  }
  
  const html = notificaciones.map(notif => {
    const iconoClass = getIconoClass(notif.tipo);
    const icono = getIconoTipo(notif.tipo);
    const noLeida = !notif.leido ? 'unread' : '';
    
    return `
      <li class="notification-item ${noLeida}" data-id="${notif._id}" data-leido="${notif.leido}">
        <div class="d-flex align-items-start gap-2">
          <div class="notification-icon ${iconoClass}">
            <i class="bi ${icono}"></i>
          </div>
          <div class="flex-grow-1">
            <p class="mb-1 small fw-normal">${notif.mensaje || 'Notificación'}</p>
            <span class="notification-time">${formatearFechaRelativa(notif.createdAt)}</span>
          </div>
          ${!notif.leido ? '<span class="badge bg-primary rounded-pill align-self-start" style="font-size: 0.6rem; padding: 0.15rem 0.4rem;">Nueva</span>' : ''}
        </div>
      </li>
    `;
  }).join('');
  
  list.innerHTML = html;
  
  // Agregar event listeners a las notificaciones
  const notificationItems = list.querySelectorAll('.notification-item');
  notificationItems.forEach(item => {
    item.addEventListener('click', async function(e) {
      e.stopPropagation();
      const notifId = this.getAttribute('data-id');
      const yaLeido = this.getAttribute('data-leido') === 'true';
      
      if (!yaLeido && notifId) {
        // Marcar como leída
        await marcarComoLeida(notifId);
        this.classList.remove('unread');
        this.setAttribute('data-leido', 'true');
        const badge = this.querySelector('.badge');
        if (badge) badge.remove();
        
        // Recargar notificaciones para actualizar el badge
        setTimeout(() => cargarNotificaciones(), 500);
      }
    });
  });
}

// Función para marcar notificación como leída
async function marcarComoLeida(notifId) {
  try {
    await fetch(`/api/notificaciones/${notifId}/leer`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
  }
}

// Función para marcar todas como leídas
async function marcarTodasComoLeidas() {
  try {
    const response = await fetch('/api/notificaciones/leer-todas', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (response.ok) {
      cargarNotificaciones();
    } else {
      console.error('Error en respuesta:', response.status);
    }
  } catch (error) {
    console.error('Error marcando todas como leídas:', error);
  }
}

// Inicializar sistema de notificaciones
document.addEventListener('DOMContentLoaded', function() {
  // Solo para administradores
  const notificationDropdown = document.getElementById('notificationDropdown');
  if (!notificationDropdown) return;
  
  // Cargar notificaciones al iniciar
  cargarNotificaciones();
  
  // Cargar notificaciones cada 30 segundos
  notificacionesInterval = setInterval(cargarNotificaciones, 30000);
  
  // Event listener para el botón "Marcar todas como leídas"
  const markAllReadBtn = document.getElementById('markAllRead');
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', marcarTodasComoLeidas);
  }
  
  // Cargar notificaciones cuando se abre el dropdown
  const dropdown = notificationDropdown.closest('.dropdown');
  if (dropdown) {
    dropdown.addEventListener('shown.bs.dropdown', function() {
      cargarNotificaciones();
    });
  }
});

// Limpiar intervalo al salir de la página
window.addEventListener('beforeunload', function() {
  if (notificacionesInterval) {
    clearInterval(notificacionesInterval);
  }
});

