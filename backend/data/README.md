# 📁 Carpeta de Datos para Importación

## Cómo usar la importación inteligente de productos:

### 1. Prepara tu archivo Excel

Coloca tu archivo Excel aquí con cualquiera de estos nombres:
- `productos.xlsx` (preferido)
- `productos.xls`

### 2. Estructura del Excel

Tu archivo Excel debe tener estas columnas (el script detecta variantes comunes):

#### Columnas requeridas:
- **REFERENCIA** (o "Referencia", "REF", "Código")
- **DESCRIPCIÓN DE PRODUCTO** (o "Nombre", "Producto")

#### Columnas opcionales:
- **EQUIPO DONDE SE APLICA** (o "Equipo", "Máquina")
- **DISPONIBLES** (o "Existencia", "Stock", "Cantidad")
- **DETALLE** (o "Nota", "Observaciones")
- **TIPO** (opcional - el script lo infiere automáticamente)
- **COSTO** (o "Costo Unitario", "Precio")

### 3. Ejecuta el script

```bash
cd backend
npm run import:smart
```

### 4. ¿Cómo funciona la inferencia inteligente?

El script aprende automáticamente:
- Si un producto "CAD-40" tiene tipo "Cadena" o dice "cadena" en algún campo, los próximos productos con "CAD" también serán clasificados como "Cadena"
- Detecta patrones en referencias: CAD → Cadena, ROD → Rodamiento, etc.
- Busca palabras clave en nombres y descripciones

### Ejemplo:

| REFERENCIA | DESCRIPCIÓN DE PRODUCTO | DISPONIBLES | DETALLE |
|------------|------------------------|-------------|---------|
| CAD-40 | ASA 40 simple | 12 | cadena de transmisión |
| CAD-50 | ASA 50 simple | 8 | |

El segundo producto automáticamente será clasificado como tipo "Cadena" porque comparte el prefijo "CAD" con el primero.

