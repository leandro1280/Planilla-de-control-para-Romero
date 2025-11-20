# Scripts de Utilidad

## seedUsers.js

Script para crear usuarios de prueba en la base de datos.

### Uso

```bash
npm run seed:users
```

### Descripción

Este script crea usuarios de prueba de los 3 tipos:
- **Administradores**: Acceso total al sistema
- **Usuarios Nivel 1**: Carga/descarga, agregar productos, no borrar registros
- **Usuarios Comunes**: Solo visualización y descarga

### Usuarios creados

#### Administradores:
- admin@romero.com / Admin123!
- sergio.franco@romero.com / Admin123!
- nahuel.romero@romero.com / Admin123!
- escuela@romero.com / Admin123!

#### Usuarios Nivel 1:
- usuario1@romero.com / User1123!
- guillermo.kleimbielen@romero.com / User1123!
- javier.speroni@romero.com / User1123!

#### Usuarios Comunes:
- usuario.comun@romero.com / UserCom123!
- operario1@romero.com / Oper123!
- operario2@romero.com / Oper123!

### Notas

- Si un usuario ya existe, el script lo omite y muestra un mensaje
- Las contraseñas están en texto plano en el script (se hashean automáticamente al crear)
- Para producción, cambia las contraseñas después de crear los usuarios

