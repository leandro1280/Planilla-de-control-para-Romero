# Sistema de Gestión de Stock - Romero Panificados

Sistema de control de inventario interno desarrollado para Maquinarias de Romero. Permite gestionar productos, registrar movimientos de entrada/salida, visualizar estadísticas en tiempo real y generar reportes.

## 🚀 Características Principales

-   **Dashboard Interactivo**: Visualización gráfica de la distribución de productos y tarjetas con métricas clave (stock crítico, movimientos del mes).
-   **Gestión de Inventario**: Alta, baja y modificación de productos con categorización y control de stock.
-   **Control de Movimientos**: Registro detallado de ingresos y egresos de mercadería.
-   **Alertas de Stock**: Identificación automática de productos con stock bajo o crítico.
-   **Exportación a Excel**: Descarga de reportes completos de inventario con un solo clic.
-   **Seguridad**: Autenticación de usuarios y roles (Administrador, Visor).

## 🛠️ Tecnologías Utilizadas

-   **Backend**: Node.js, Express
-   **Base de Datos**: MongoDB (Mongoose)
-   **Frontend**: Handlebars (HBS), Bootstrap 5, Chart.js
-   **Herramientas**: `xlsx` (Reportes), `bcryptjs` (Seguridad)

## 📋 Requisitos Previos

-   Node.js (v14 o superior)
-   MongoDB (Instancia local o Atlas)

## ⚙️ Instalación y Configuración

1.  **Clonar el repositorio** (o descargar el código):
    ```bash
    git clone <url-del-repo>
    cd backend
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno**:
    Crea un archivo `.env` en la raíz de la carpeta `backend` basándote en el archivo `.env.example`.
    ```env
    PORT=3000
    MONGODB_URI=mongodb://localhost:27017/romero_stock
    JWT_SECRET=tu_clave_secreta_segura
    ADMIN_PASSWORD=Admin123!
    ```

4.  **Iniciar la aplicación**:
    *   Modo desarrollo (con recarga automática):
        ```bash
        npm run dev
        ```
    *   Modo producción:
        ```bash
        npm start
        ```

5.  **Acceder al sistema**:
    Abre tu navegador en `http://localhost:3000`.
    *   **Usuario Admin por defecto**: `admin@romero.com`
    *   **Contraseña**: La que definiste en `ADMIN_PASSWORD` (o `Admin123!` por defecto).

## 📱 Uso del Sistema

### Dashboard
Panel principal con resumen del estado del inventario y gráficos de distribución.

### Inventario
Listado completo de productos.
-   Usa los filtros para buscar por nombre, referencia o estado de stock.
-   Usa el botón **"Exportar Excel"** para descargar el reporte.

### Movimientos
Registra entradas y salidas de productos. El sistema validará que haya stock suficiente para los egresos.

## 🔒 Roles de Usuario

-   **Administrador**: Acceso total (Crear/Editar/Eliminar productos, Registrar movimientos, Crear usuarios).
-   **Visor**: Solo lectura de inventario y movimientos (No puede modificar datos).

---
Desarrollado para Romero Panificados.
