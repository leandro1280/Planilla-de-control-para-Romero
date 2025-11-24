#!/bin/bash
# Script de setup para Render
# Este script verifica que todo esté listo para deployment

echo "🔍 Verificando configuración para Render..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi
echo "✅ Node.js: $(node --version)"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi
echo "✅ npm: $(npm --version)"

# Verificar package.json
if [ ! -f "package.json" ]; then
    echo "❌ package.json no encontrado"
    exit 1
fi
echo "✅ package.json encontrado"

# Verificar que start script existe
if ! grep -q '"start"' package.json; then
    echo "❌ Script 'start' no encontrado en package.json"
    exit 1
fi
echo "✅ Script 'start' encontrado"

# Verificar server.js
if [ ! -f "server.js" ]; then
    echo "❌ server.js no encontrado"
    exit 1
fi
echo "✅ server.js encontrado"

# Verificar health.js route
if [ ! -f "routes/health.js" ]; then
    echo "⚠️  routes/health.js no encontrado (recomendado)"
else
    echo "✅ routes/health.js encontrado"
fi

# Verificar variables de entorno críticas
echo ""
echo "📋 Variables de entorno requeridas:"
echo "   - NODE_ENV=production"
echo "   - MONGODB_URI=mongodb+srv://..."
echo "   - JWT_SECRET=(32+ caracteres)"
echo ""
echo "⚠️  Asegúrate de configurar estas variables en Render Dashboard"

# Generar JWT_SECRET de ejemplo
echo ""
echo "🔑 Para generar JWT_SECRET, ejecuta:"
echo "   node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""

echo ""
echo "✅ Verificación completada"
echo ""
echo "📚 Próximos pasos:"
echo "   1. Configurar MongoDB Atlas"
echo "   2. Crear servicio en Render"
echo "   3. Configurar variables de entorno"
echo "   4. Deploy!"
echo ""
echo "📖 Ver DEPLOYMENT_RENDER.md para guía completa"

