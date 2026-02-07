# Guía Rápida - Cómo Usar el Sistema

## 🚀 Inicio Rápido

### 1. Instalar dependencias (primera vez)
```bash
npm install
```

### 2. Iniciar el servidor
```bash
npm start
```

### 3. Abrir en el navegador
```
http://localhost:3000
```

### 4. Probar el sistema

#### Opción A: Usar el usuario admin existente
- Email: `admin@example.com`
- Contraseña: `admin123`

#### Opción B: Registrar nuevo usuario
1. Click en "CREATE ACCOUNT"
2. Ingresa email y contraseña (mín. 6 caracteres)
3. Click en "CREATE ACCOUNT"
4. ¡Listo! Ahora puedes hacer login

## 📊 Verificar Estado del Servidor

Abre en tu navegador:
```
http://localhost:3000/api/health
```

Deberías ver:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-02-06T21:43:30.000Z"
}
```

## 🧪 Probar la API con cURL

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"admin123\"}"
```

### Registro
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"nuevo@example.com\",\"password\":\"123456\"}"
```

## 🛑 Detener el Servidor

Presiona `Ctrl + C` en la terminal donde está corriendo

## 🔧 Comandos Útiles

```bash
npm start              # Iniciar servidor
npm run dev            # Modo desarrollo (auto-reload con nodemon)
npm run test           # Ejecutar pruebas de la API
npm install            # Instalar dependencias
```

## ⚠️ Solución Rápida de Problemas

### El servidor no inicia
1. Verifica que instalaste las dependencias: `npm install`
2. Revisa que el puerto 3000 esté libre
3. Verifica el archivo `.env` existe y tiene las credenciales correctas

### No puedo hacer login
1. Verifica credenciales: `admin@example.com` / `admin123`
2. Abre la consola del navegador (F12) para ver errores
3. Verifica que el servidor esté corriendo
4. Prueba el endpoint: `curl http://localhost:3000/api/health`

### Error de conexión a la BD
1. Verifica internet
2. Verifica credenciales en `.env`
3. Confirma que tu IP esté permitida en AWS RDS Security Group

## 📝 Archivos Importantes

- **server.js** - Servidor principal Express
- **routes/auth.js** - Lógica de autenticación (login/registro)
- **config/database.js** - Conexión a MySQL
- **.env** - Credenciales (⚠️ NO COMPARTIR)
- **script.js** - Frontend JavaScript
- **index.html** - Página principal

## 🎯 Siguiente Paso

¡El sistema está listo! Ahora puedes:
- ✅ Hacer login con el usuario admin
- ✅ Registrar nuevos usuarios
- ✅ Personalizar el diseño en `style.css`
- ✅ Agregar más funcionalidades en `routes/`
- ✅ Crear un dashboard después del login

## 🔐 Configuración de Variables de Entorno

El archivo `.env` contiene:
```env
DB_HOST=mi-estacion.c36ymicqsptw.us-east-2.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=123456789admin
DB_NAME=accounts
DB_PORT=3306
PORT=3000
NODE_ENV=development
```

---

**¿Necesitas ayuda?** Revisa el README.md completo
