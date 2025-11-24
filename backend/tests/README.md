# 🧪 Tests Automatizados

## Configuración

Los tests utilizan **Jest** como framework de testing y **Supertest** para testing de APIs HTTP.

### Instalación

Las dependencias ya están instaladas:
```bash
npm install
```

### Variables de Entorno para Tests

Crear un archivo `.env.test` o configurar:
```env
NODE_ENV=test
MONGODB_URI_TEST=mongodb://localhost:27017/romero_test
JWT_SECRET=test-secret-key-for-testing-only
```

## Ejecutar Tests

### Todos los tests
```bash
npm test
```

### Con cobertura de código
```bash
npm test -- --coverage
```

### Modo watch (desarrollo)
```bash
npm run test:watch
```

### Solo tests de seguridad
```bash
npm run test:security
```

## Estructura de Tests

```
backend/tests/
├── app.test.js          # Configuración global de tests
├── auth.test.js         # Tests de autenticación
├── inventario.test.js   # Tests del módulo de inventario
└── security.test.js     # Tests de seguridad
```

## Tipos de Tests

### 1. Tests Unitarios
Prueban funciones individuales y lógica de negocio:
- Validaciones
- Transformaciones de datos
- Cálculos

### 2. Tests de Integración
Prueban flujos completos de la aplicación:
- Endpoints de API
- Interacción con base de datos
- Autenticación y autorización

### 3. Tests de Seguridad
Prueban medidas de seguridad:
- Protección contra inyecciones
- Validación de inputs
- Rate limiting
- Sanitización de datos

## Ejemplos de Tests

### Test de Endpoint
```javascript
test('Debería crear un producto válido', async () => {
  const res = await request(app)
    .post('/inventario/productos')
    .set('Cookie', `token=${authToken}`)
    .send({
      referencia: 'TEST-001',
      nombre: 'Producto Test',
      existencia: 10
    })
    .expect(200);
  
  expect(res.body.success).toBe(true);
});
```

### Test de Validación
```javascript
test('Debería rechazar producto con campos inválidos', async () => {
  const res = await request(app)
    .post('/inventario/productos')
    .set('Cookie', `token=${authToken}`)
    .send({
      referencia: '<script>alert("xss")</script>',
      existencia: -5
    })
    .expect(400);
  
  expect(res.body.success).toBe(false);
});
```

## Cobertura de Código

El objetivo es mantener al menos **60% de cobertura** en:
- Branches (ramas)
- Functions (funciones)
- Lines (líneas)
- Statements (sentencias)

Ver reporte de cobertura:
```bash
npm test -- --coverage
```

## Mejores Prácticas

1. **Aislamiento**: Cada test debe ser independiente
2. **Cleanup**: Limpiar datos de prueba después de cada test
3. **Nombres descriptivos**: Usar nombres claros que expliquen qué prueba el test
4. **Arrange-Act-Assert**: Estructurar tests en estas tres fases
5. **Mocking**: Usar mocks para dependencias externas cuando sea necesario

## Troubleshooting

### Error: "Cannot find module"
```bash
npm install
```

### Error: "MongoDB connection"
- Verificar que MongoDB esté corriendo
- Verificar `MONGODB_URI_TEST` en `.env`

### Tests lentos
- Usar base de datos en memoria para tests (MongoDB Memory Server)
- Optimizar queries en tests
- Usar `--runInBand` para tests que requieren orden

## Recursos

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

