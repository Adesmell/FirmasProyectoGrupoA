# Backend - Sistema de Firma Digital de Documentos

## 📋 Descripción

Este es el backend del sistema de firma digital de documentos, desarrollado con Node.js, Express y TypeScript. Proporciona una API REST completa para la gestión de usuarios, documentos y certificados digitales con funcionalidades de autenticación segura y almacenamiento encriptado.

## 🚀 Características Principales

- **Autenticación JWT**: Sistema seguro de autenticación con tokens
- **Gestión de Documentos**: Subida, almacenamiento y gestión de archivos
- **Certificados Digitales**: Almacenamiento encriptado de certificados P12
- **Base de Datos MongoDB**: Persistencia de datos con Mongoose ODM
- **Middleware de Seguridad**: Validación y protección de rutas
- **Logging**: Registro de actividades con Morgan
- **CORS**: Configurado para comunicación con frontend

## 🛠️ Stack Tecnológico

- **Runtime**: Node.js con TypeScript
- **Framework**: Express.js
- **Base de Datos**: MongoDB con Mongoose
- **Autenticación**: JSON Web Tokens (JWT)
- **Encriptación**: bcrypt para contraseñas
- **Subida de Archivos**: Multer
- **Variables de Entorno**: dotenv
- **Logging**: Morgan
- **CORS**: cors middleware
- **Firma Digital**: Pyhanko (Python)
- **Certificados**: PKCS#12 con cryptography

## 📁 Estructura del Proyecto

```
src/
├── Almacenamiento/     # Gestión de archivos y almacenamiento
├── Controllers/        # Controladores de la API
├── Middleware/         # Middleware personalizado
├── Models/            # Modelos de datos (Mongoose)
│   ├── Usuario.ts     # Modelo de usuario
│   ├── Documento.ts   # Modelo de documento
│   └── Certificado.ts # Modelo de certificado
├── Repositorio/       # Capa de acceso a datos
├── Rutas/            # Definición de rutas de la API
├── Services/         # Lógica de negocio
└── index.ts          # Punto de entrada de la aplicación
```

## 🗄️ Modelos de Datos

### Usuario
- Información básica del usuario
- Credenciales de autenticación

### Documento
- `nombre_original`: Nombre original del archivo
- `nombre_archivo`: Nombre del archivo en el sistema
- `ruta`: Ruta de almacenamiento
- `tamano`: Tamaño del archivo en bytes
- `tipo_archivo`: Tipo MIME del archivo
- `fecha_subida`: Timestamp de subida
- `usuario_id`: ID del usuario propietario

### Certificado
- `userId`: ID del usuario propietario
- `fileName`: Nombre del archivo de certificado
- `encryptionSalt`: Salt para encriptación
- `encryptionIV`: Vector de inicialización
- `certificateData`: Datos del certificado (Buffer)
- `type`: Tipo de certificado (por defecto P12)
- `createdAt`: Fecha de creación

## 🔧 Instalación y Configuración

### Prerrequisitos
- Node.js (v18 o superior)
- MongoDB (local o remoto)
- npm o bun

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd Backend

# Instalar dependencias de Node.js
npm install
# o
bun install

# Instalar dependencias de Python para firma digital
cd API_Pyhanko
pip install -r requirements.txt
cd ..
```

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Puerto del servidor (puede ser 3002 o 3003)
PORT=3002

# Configuración de MongoDB
MONGODB_URI=mongodb://localhost:27017/Documentos
MONGODB_USER=tu_usuario_mongodb
MONGODB_PASS=tu_contraseña_mongodb
MONGODB_DB=Documentos

# JWT Secret (genera una clave segura)
JWT_SECRET=tu_clave_secreta_muy_segura

# Configuración de archivos
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Otras configuraciones...
```

## 🚀 Ejecución

### Desarrollo
```bash
# Con npm
npm run dev

# Con bun
bun run dev

# Ejecutar directamente
tsx src/index.ts
```

### Producción
```bash
# Compilar TypeScript
npx tsc

# Ejecutar
node dist/index.js
```

## 🔐 Seguridad

- **Autenticación JWT**: Tokens seguros para autenticación
- **Encriptación de Contraseñas**: bcrypt con salt
- **Certificados Encriptados**: Almacenamiento seguro con salt e IV únicos
- **Firma Digital PKCS#7**: Pyhanko para firmas digitales válidas
- **Validación de Entrada**: Middleware de validación
- **CORS Configurado**: Comunicación segura con frontend

## 📡 API Endpoints

Todos los endpoints están bajo el prefijo `/api/`

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/logout` - Cerrar sesión

### Documentos
- `GET /api/documentos` - Listar documentos del usuario
- `POST /api/documentos/upload` - Subir documento
- `GET /api/documentos/:id` - Obtener documento específico
- `DELETE /api/documentos/:id` - Eliminar documento

### Certificados
- `POST /api/certificados/upload` - Subir certificado
- `GET /api/certificados` - Obtener certificado del usuario
- `DELETE /api/certificados` - Eliminar certificado

## 🧪 Testing

```bash
# Ejecutar tests (si están configurados)
npm test
```

## 📝 Logging

El sistema utiliza Morgan para logging en desarrollo:
- Requests HTTP
- Errores de conexión
- Estados de la aplicación

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y confidencial.

## 🔧 Troubleshooting

### Problemas Comunes

1. **Error de conexión a MongoDB**
   - Verificar que MongoDB esté ejecutándose
   - Comprobar las credenciales en `.env`
   - Verificar la URI de conexión

2. **Error de puerto en uso**
   - Cambiar el puerto en `.env`
   - Verificar que no haya otra aplicación usando el puerto

3. **Errores de autenticación**
   - Verificar que `JWT_SECRET` esté configurado
   - Comprobar que los tokens no hayan expirado

## 📞 Soporte

Para soporte técnico, contacta al equipo de desarrollo.
