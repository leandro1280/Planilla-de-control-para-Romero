// Script principal de la aplicación
document.addEventListener('DOMContentLoaded', function() {
  // Manejar logout
  const logoutLink = document.getElementById('logoutLink');
  if (logoutLink) {
    logoutLink.addEventListener('click', async function(e) {
      e.preventDefault();
      
      try {
        // Intentar POST primero
        const response = await fetch('/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include'
        });
        
        // Independientemente de la respuesta, redirigir a login
        window.location.href = '/auth/login';
      } catch (error) {
        console.error('Error en logout:', error);
        // Si falla, redirigir con GET
        window.location.href = '/auth/logout';
      }
    });
  }
  
  // Cerrar dropdowns cuando se hace clic fuera
  document.addEventListener('click', function(event) {
    const isClickInsideDropdown = event.target.closest('.dropdown');
    if (!isClickInsideDropdown) {
      // Cerrar todos los dropdowns abiertos
      const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
      openDropdowns.forEach(dropdown => {
        const bsDropdown = bootstrap.Dropdown.getInstance(dropdown.previousElementSibling || dropdown.parentElement);
        if (bsDropdown) {
          bsDropdown.hide();
        }
      });
    }
  });
  
  // Prevenir que los dropdowns se cierren cuando se hace clic dentro
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    menu.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  });
});
