# 🔒 Guía de Seguridad - Sistema de Gestión Romero

## Medidas de Seguridad Implementadas

### 1. Autenticación y Autorización

- **JWT Tokens**: Autenticación mediante tokens JWT con expiración
- **Bcrypt**: Hash de contraseñas con bcryptjs (10 rounds)
- **Validación de Roles**: Control de acceso basado en roles (administrador, supervisor, operario)
- **Rate Limiting en Auth**: 
  - Máximo 5 intentos de login cada 15 minutos por IP
  - Protección contra fuerza bruta

### 2. Protección contra Inyecciones

#### NoSQL Injection
- **express-mongo-sanitize**: Sanitiza automáticamente queries MongoDB
- Elimina operadores peligrosos (`$ne`, `$gt`, `$regex`, etc.)
- Logging de intentos de inyección

#### XSS (Cross-Site Scripting)
- **Helmet**: Headers de seguridad HTTP
- **Escapado de HTML**: `escape()` en validadores
- **Content Security Policy**: Política de contenido restrictiva
- **Sanitización de inputs**: Middleware `sanitize.js` que elimina:
  - Etiquetas `<script>`, `<iframe>`
  - Event handlers (`onclick`, `onerror`, etc.)
  - URLs `javascript:`

### 3. Rate Limiting

- **API General**: 100 requests cada 15 minutos
- **Autenticación**: 5 intentos cada 15 minutos
- **Operaciones de Escritura**: 20 operaciones por minuto
- **Importaciones**: 3 importaciones cada 5 minutos

### 4. Validación de Inputs

- **express-validator**: Validación exhaustiva de todos los inputs
- **Sanitización de strings**: Eliminación de caracteres peligrosos
- **Validación de tipos**: Verificación de tipos de datos
- **Límites de longitud**: Prevención de DoS por inputs muy largos
- **Validación de ObjectIds**: Verificación de IDs de MongoDB

### 5. HTTP Security Headers (Helmet)

- **Content-Security-Policy**: Política de contenido restrictiva
- **HSTS**: HTTP Strict Transport Security (1 año)
- **X-Frame-Options**: Previene clickjacking
- **X-Content-Type-Options**: Previene MIME sniffing
- **Referrer-Policy**: Control de información de referrer

### 6. HTTP Parameter Pollution (HPP)

- Previene manipulación de parámetros HTTP
- Whitelist de parámetros que permiten múltiples valores

### 7. Seguridad de Cookies

- **httpOnly**: Cookies no accesibles vía JavaScript
- **secure**: Cookies solo sobre HTTPS (en producción)
- **sameSite**: Protección CSRF

### 8. Manejo de Errores

- **No exposición de detalles**: Errores no revelan información sensible
- **Logging seguro**: Logs no incluyen contraseñas o tokens
- **Error handling centralizado**: Manejo consistente de errores

### 9. Protección de Archivos

- **Multer**: Validación de tipos MIME
- **Límite de tamaño**: 5MB para archivos Excel
- **Validación de extensiones**: Solo `.xlsx`, `.xls`, `.csv`

### 10. Base de Datos

- **MongoDB Sanitization**: Prevención de inyección NoSQL
- **Índices únicos**: Prevención de duplicados
- **Validación de esquemas**: Mongoose schemas con validaciones
- **Timeouts en queries**: Prevención de queries colgadas

## Checklist de Seguridad

### Desarrollo
- [x] Validación de todos los inputs
- [x] Sanitización de datos de usuario
- [x] Autenticación robusta
- [x] Autorización por roles
- [x] Rate limiting
- [x] Headers de seguridad
- [x] Protección XSS
- [x] Protección NoSQL Injection
- [x] Logging de seguridad
- [x] Manejo seguro de errores

### Producción
- [ ] HTTPS habilitado
- [ ] Variables de entorno seguras
- [ ] Backup automatizado
- [ ] Monitoreo de seguridad
- [ ] Auditoría de logs
- [ ] Actualizaciones de dependencias
- [ ] Firewall configurado
- [ ] Certificados SSL válidos

## Recomendaciones Adicionales

### Configuración de Producción

1. **Variables de Entorno**:
   ```env
   NODE_ENV=production
   JWT_SECRET=<secret-fuerte-y-aleatorio>
   MONGODB_URI=<uri-segura-con-autenticacion>
   ```

2. **HTTPS**: Siempre usar HTTPS en producción
   - Configurar certificados SSL válidos
   - Redirigir HTTP a HTTPS

3. **CORS**: Configurar CORS restrictivo si hay frontend separado
   ```javascript
   app.use(cors({
     origin: 'https://tu-dominio.com',
     credentials: true
   }));
   ```

4. **Monitoreo**: Implementar logging y alertas
   - Alertas por intentos de inyección
   - Alertas por rate limiting
   - Monitoreo de accesos no autorizados

5. **Actualizaciones**: Mantener dependencias actualizadas
   ```bash
   npm audit
   npm audit fix
   ```

## Reportar Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, por favor contacta al equipo de desarrollo de forma responsable.

## Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

