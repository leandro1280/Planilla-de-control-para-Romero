// @desc    Mostrar página de perfiles
// @route   GET /perfiles
// @access  Private
exports.getPerfiles = async (req, res) => {
  try {
    const perfiles = {
      administrador: {
        nombre: 'Administrador',
        icono: 'bi-shield-check',
        color: 'danger',
        descripcion: 'Rol con acceso completo al sistema. Control total sobre inventario, movimientos, usuarios y configuraciones.',
        funciones: [
          'Gestionar el inventario completo',
          'Crear, editar y eliminar productos',
          'Registrar y modificar movimientos',
          'Gestionar usuarios del sistema',
          'Ver notificaciones del sistema',
          'Descargar planillas y reportes',
          'Acceso a todas las funcionalidades'
        ],
        permisos: {
          inventario: {
            ver: true,
            crear: true,
            editar: true,
            eliminar: true,
            descargar: true
          },
          movimientos: {
            ver: true,
            crear: true,
            editar: true,
            eliminar: true,
            descargar: true
          },
          usuarios: {
            ver: true,
            crear: true,
            editar: true,
            eliminar: true,
            activarDesactivar: true
          },
          notificaciones: {
            ver: true,
            marcarLeidas: true
          },
          dashboard: {
            acceso: true
          }
        }
      },
      supervisor: {
        nombre: 'Supervisor',
        icono: 'bi-person-badge',
        color: 'primary',
        descripcion: 'Rol para coordinadores y personal autorizado. Puede gestionar inventario y movimientos, pero no eliminar registros ni gestionar usuarios.',
        funciones: [
          'Ver el inventario completo',
          'Crear y editar productos',
          'Registrar ingresos y egresos de stock',
          'Agregar componentes al sistema',
          'Ver movimientos y estadísticas',
          'Descargar planillas de uso',
          'NO puede eliminar registros de movimientos',
          'NO puede gestionar usuarios'
        ],
        permisos: {
          inventario: {
            ver: true,
            crear: true,
            editar: true,
            eliminar: false,
            descargar: true
          },
          movimientos: {
            ver: true,
            crear: true,
            editar: false,
            eliminar: false,
            descargar: true
          },
          usuarios: {
            ver: false,
            crear: false,
            editar: false,
            eliminar: false,
            activarDesactivar: false
          },
          notificaciones: {
            ver: false,
            marcarLeidas: false
          },
          dashboard: {
            acceso: true
          }
        }
      },
      operario: {
        nombre: 'Operario',
        icono: 'bi-person',
        color: 'secondary',
        descripcion: 'Rol para personal operativo. Solo puede visualizar y descargar información de componentes utilizados.',
        funciones: [
          'Ver inventario (solo lectura)',
          'Buscar y filtrar productos',
          'Ver movimientos de productos',
          'Descargar planillas de componentes utilizados',
          'Visualizar estadísticas y gráficos',
          'NO puede modificar datos',
          'NO puede crear productos o movimientos',
          'NO puede gestionar usuarios'
        ],
        permisos: {
          inventario: {
            ver: true,
            crear: false,
            editar: false,
            eliminar: false,
            descargar: true
          },
          movimientos: {
            ver: true,
            crear: false,
            editar: false,
            eliminar: false,
            descargar: true
          },
          usuarios: {
            ver: false,
            crear: false,
            editar: false,
            eliminar: false,
            activarDesactivar: false
          },
          notificaciones: {
            ver: false,
            marcarLeidas: false
          },
          dashboard: {
            acceso: true
          }
        }
      }
    };

    res.render('perfiles/index', {
      title: 'Perfiles y Roles - Romero Panificados',
      currentPage: 'perfiles',
      perfiles: perfiles,
      usuario: {
        nombre: req.user.nombre,
        email: req.user.email,
        rol: req.user.rol
      }
    });
  } catch (error) {
    res.status(500).render('error', {
      title: 'Error',
      message: error.message
    });
  }
};

