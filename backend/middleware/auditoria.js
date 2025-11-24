const RegistroAuditoria = require('../models/RegistroAuditoria');

/**
 * Obtiene la IP real del cliente, considerando proxies y load balancers
 * @param {Object} req - Request de Express
 * @returns {string} - IP del cliente
 */
const obtenerIP = (req) => {
  // Probar en orden de prioridad
  const ip = 
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||  // Proxy/Load Balancer
    req.headers['x-real-ip'] ||                                // Nginx
    req.connection?.remoteAddress ||                           // Conexión directa
    req.socket?.remoteAddress ||                               // Socket
    req.ip ||                                                  // Express IP
    'Desconocida';
  
  // Limpiar IPv6 mapped IPv4
  return ip.replace(/^::ffff:/, '');
};

/**
 * Registra una acción en el historial de auditoría
 * @param {Object} req - Objeto request de Express (para obtener usuario e IP)
 * @param {string} accion - Tipo de acción (CREAR, MODIFICAR, ELIMINAR, LOGIN, LOGOUT, etc.)
 * @param {string} entidad - Nombre de la entidad afectada (Producto, Mantenimiento, Usuario, etc.)
 * @param {string|Object} entidadId - ID de la entidad afectada (opcional)
 * @param {Object} detalles - Detalles adicionales de la acción (opcional)
 */
const registrarAuditoria = async (req, accion, entidad, entidadId = null, detalles = {}) => {
  // Desactivar auditoría temporalmente si está causando problemas de rendimiento
  // Se puede reactivar cuando MongoDB esté más estable
  if (process.env.DISABLE_AUDIT === 'true') {
    return;
  }

  // No bloquear - ejecutar de forma completamente asíncrona
  // No usar await para que no bloquee el request principal
  setImmediate(async () => {
    try {
    // Validar acción
    const accionesPermitidas = ['CREAR', 'MODIFICAR', 'ELIMINAR', 'LOGIN', 'LOGOUT', 'OTRO'];
    if (!accionesPermitidas.includes(accion)) {
      console.warn(`⚠️ Acción de auditoría no válida: ${accion}`);
      return;
    }

    // Obtener usuario (puede ser null en algunos casos como login)
    const usuarioId = req.user ? req.user._id : null;
    
    // Para acciones de login, el usuario podría estar en req.body o ya autenticado
    // Si no hay usuario pero es LOGIN, permitimos null para registrar intentos fallidos
    if (!usuarioId && accion !== 'LOGIN') {
      console.warn(`⚠️ Intento de auditoría sin usuario autenticado: ${accion} ${entidad}`);
      return;
    }

    // Obtener IP real
    const ip = obtenerIP(req);

    // Preparar detalles con información adicional si está disponible
    const detallesCompletos = {
      ...detalles,
      // Agregar user-agent si está disponible
      ...(req.headers['user-agent'] && {
        userAgent: req.headers['user-agent'].substring(0, 200) // Limitar longitud
      })
    };

    // Crear registro de auditoría
    const nuevoRegistro = new RegistroAuditoria({
      usuario: usuarioId,
      accion,
      entidad,
      entidadId: entidadId ? entidadId : undefined,
      detalles: Object.keys(detallesCompletos).length > 0 ? detallesCompletos : undefined,
      ip,
      fecha: new Date()
    });

      // Guardar de forma asíncrona con timeout muy corto para no bloquear
      const savePromise = nuevoRegistro.save();
      
      // Timeout de 2 segundos para guardar auditoría (no bloquear requests)
      Promise.race([
        savePromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout guardando auditoría')), 2000)
        )
      ]).catch(error => {
        // Solo loggear error, no lanzar para no interrumpir el flujo
        // No mostrar en consola para no saturar logs
      });
    } catch (error) {
      // Capturar cualquier error inesperado sin interrumpir el flujo
      // No loggear para no saturar
    }
  });
  
  // Retornar inmediatamente sin esperar
  return;
};

module.exports = {
  registrarAuditoria,
  obtenerIP
};
