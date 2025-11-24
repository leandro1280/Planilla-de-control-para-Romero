# Correcciones Necesarias en Tests

## Problemas Identificados

1. **Rutas de Vistas vs APIs**: 
   - `/inventario` renderiza vistas (HTML) - devuelve 200 con HTML
   - `/inventario/productos` es una API - devuelve JSON
   - El middleware `protect` redirige (302) cuando no hay token en rutas de vistas
   - El middleware `protect` devuelve JSON (401) cuando no hay token en rutas API

2. **Token de Autenticación**:
   - El login guarda token en cookie
   - También lo devuelve en el body
   - Los tests necesitan leer de cookie

3. **Tests que están fallando**:
   - Tests esperando JSON pero recibiendo redirects (302)
   - Tests esperando 200 pero token no se está enviando correctamente

## Solución

### Opción 1: Usar rutas API en los tests
Crear rutas API específicas para tests que devuelvan JSON

### Opción 2: Ajustar tests para rutas de vistas
Aceptar que las rutas de vistas redirigen cuando no hay auth, y testear con auth

### Opción 3: Modificar middleware para detectar requests de tests
Agregar header especial en tests para que siempre devuelva JSON

## Implementación Recomendada

Usar Opción 2 + mejorar obtención de token:
- Obtener token de cookie correctamente
- Enviar token en Cookie header
- Ajustar expectativas según tipo de ruta (vista vs API)

