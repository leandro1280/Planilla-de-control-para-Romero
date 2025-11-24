const RegistroAuditoria = require('../models/RegistroAuditoria');

// @desc    Obtener registros de auditoría
// @route   GET /auditoria
// @access  Private (solo administrador)
exports.getAuditoriaLogs = async (req, res) => {
    // Timeout de 8 segundos para esta operación
    const timeout = setTimeout(() => {
        if (!res.headersSent) {
            console.error('⏱️ Timeout en auditoría después de 8 segundos');
            return res.status(503).render('error', {
                title: 'Timeout',
                message: 'La consulta de auditoría está tardando demasiado. Por favor intenta nuevamente.',
                layout: 'main'
            });
        }
    }, 8000);

    try {
        const { usuario, accion, entidad, fechaDesde, fechaHasta, pagina = 1, porPagina = 20 } = req.query;
        const paginaActual = parseInt(pagina);
        const limite = parseInt(porPagina);
        const salto = (paginaActual - 1) * limite;

        const query = {};

        // Filtro por usuario
        if (usuario && usuario !== 'todos') {
            query.usuario = usuario;
        }

        // Filtro por acción
        if (accion && accion !== 'todos') {
            query.accion = accion;
        }

        // Filtro por entidad
        if (entidad && entidad !== 'todos') {
            query.entidad = entidad;
        }

        // Filtro por rango de fechas
        if (fechaDesde || fechaHasta) {
            query.fecha = {};
            if (fechaDesde) {
                query.fecha.$gte = new Date(fechaDesde);
            }
            if (fechaHasta) {
                const hasta = new Date(fechaHasta);
                hasta.setHours(23, 59, 59, 999); // Incluir todo el día
                query.fecha.$lte = hasta;
            }
        }

        // Helper para agregar timeout a promesas
        const withTimeout = (promise, ms) => {
            return Promise.race([
                promise,
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error(`Timeout después de ${ms}ms`)), ms)
                )
            ]);
        };

        // Contar total de registros con timeout
        let totalRegistros = 0;
        let totalPaginas = 0;
        try {
            totalRegistros = await withTimeout(
                RegistroAuditoria.countDocuments(query),
                8000
            );
            totalPaginas = Math.ceil(totalRegistros / limite);
        } catch (countError) {
            console.error('Error contando registros de auditoría:', countError.message);
            clearTimeout(timeout);
            return res.status(500).render('error', {
                title: 'Error',
                message: 'Error al contar registros de auditoría. Por favor intenta nuevamente o verifica tu conexión.',
                layout: 'main'
            });
        }

        // Obtener registros paginados con timeout
        let registros = [];
        try {
            registros = await withTimeout(
                RegistroAuditoria.find(query)
                    .populate('usuario', 'nombre email')
                    .sort({ fecha: -1 })
                    .skip(salto)
                    .limit(limite)
                    .lean(),
                8000
            );
        } catch (findError) {
            console.error('Error obteniendo registros de auditoría:', findError.message);
            clearTimeout(timeout);
            return res.status(500).render('error', {
                title: 'Error',
                message: 'Error al obtener registros de auditoría. Por favor intenta nuevamente o verifica tu conexión.',
                layout: 'main'
            });
        }

        // Obtener lista de usuarios únicos (con timeout y error handling)
        // Simplificado: solo obtener los primeros 50 usuarios para el filtro
        const User = require('../models/User');
        let usuarios = [];
        try {
            usuarios = await withTimeout(
                User.find({}).select('_id nombre').limit(50).lean(),
                3000 // Timeout más corto
            );
        } catch (userError) {
            console.error('Error obteniendo usuarios para filtro:', userError.message);
            // Continuar sin usuarios en el filtro
        }

        // Obtener entidades únicas - simplificado, usar valores por defecto si falla
        let entidadesUnicas = ['Producto', 'Movimiento', 'Mantenimiento', 'Usuario'];
        try {
            const ultimosRegistros = await withTimeout(
                RegistroAuditoria.find({}).select('entidad').limit(100).lean(),
                2000 // Timeout más corto
            );
            const entidades = [...new Set(ultimosRegistros.map(r => r.entidad).filter(Boolean))];
            if (entidades.length > 0) {
                entidadesUnicas = entidades;
            }
        } catch (entityError) {
            // Usar valores por defecto si falla
            console.warn('Usando entidades por defecto:', entityError.message);
        }

        clearTimeout(timeout);
        
        console.log(`📋 Auditoría - Registros encontrados: ${totalRegistros}, Mostrando: ${registros.length}, Página: ${paginaActual}/${totalPaginas}`);

        res.render('auditoria/index', {
            title: 'Auditoría - Romero Panificados',
            currentPage: 'auditoria',
            registros: registros || [],
            usuarios: usuarios || [],
            entidades: entidadesUnicas || [],
            usuario: {
                nombre: req.user.nombre,
                email: req.user.email,
                rol: req.user.rol
            },
            filtros: {
                usuario: usuario || 'todos',
                accion: accion || 'todos',
                entidad: entidad || 'todos',
                fechaDesde: fechaDesde || '',
                fechaHasta: fechaHasta || ''
            },
            paginacion: {
                paginaActual: paginaActual,
                totalPaginas: totalPaginas,
                totalRegistros: totalRegistros,
                tieneAnterior: paginaActual > 1,
                tieneSiguiente: paginaActual < totalPaginas,
                desde: salto + 1,
                hasta: Math.min(salto + limite, totalRegistros)
            }
        });
    } catch (error) {
        clearTimeout(timeout);
        console.error('Error obteniendo auditoría:', error);
        
        if (!res.headersSent) {
            res.status(500).render('error', {
                title: 'Error',
                message: error.message || 'Error al cargar la auditoría. Por favor intenta nuevamente.',
                layout: 'main'
            });
        }
    }
};
