# 🖋️ Sistema de Firmas Digitales - SignatureFlow

Un sistema completo de firmas digitales que permite a los usuarios subir documentos, gestionar certificados digitales y firmar documentos PDF de forma segura.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [API Endpoints](#-api-endpoints)
- [Arquitectura](#-arquitectura)
- [Seguridad](#-seguridad)
- [Contribución](#-contribución)

## ✨ Características

### 🔐 Autenticación y Autorización
- **Registro de usuarios** con validación de contraseñas robustas
- **Verificación de email** obligatoria con Nodemailer
- **Inicio de sesión** con JWT tokens
- **Políticas de contraseña** (mínimo 8 caracteres, mayúsculas, minúsculas, números, caracteres especiales)
- **Validación de email** en tiempo real
- **Sesiones persistentes** con refresh tokens
- **Base de datos híbrida** (PostgreSQL para usuarios, MongoDB para documentos/certificados)

### 📄 Gestión de Documentos
- **Subida de documentos** (PDF, imágenes)
- **Previsualización** de documentos en el navegador
- **Descarga** de documentos originales y firmados
- **Eliminación** segura de documentos
- **Gestión de estados** (subiendo, listo, firmado, error)

### 🔑 Gestión de Certificados
- **Subida de certificados P12** con encriptación AES-256
- **Generación de certificados** del sistema
- **Validación de contraseñas** de certificados
- **Almacenamiento seguro** con salt y IV únicos
- **Certificados del sistema** vs certificados externos

### ✍️ Firma Digital
- **Firma de documentos PDF** usando pyHanko
- **Selección de posición** de firma interactiva
- **Validación de certificados** con OpenSSL
- **Descarga automática** de documentos firmados
- **QR codes** integrados en firmas

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **TypeScript** - Tipado estático
- **PostgreSQL** - Base de datos relacional (usuarios)
- **MongoDB** - Base de datos NoSQL (documentos y certificados)
- **Sequelize** - ORM para PostgreSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación con tokens
- **bcryptjs** - Encriptación de contraseñas
- **multer** - Manejo de archivos
- **crypto** - Encriptación AES-256
- **pyHanko** - Firma digital de PDFs
- **OpenSSL** - Validación de certificados
- **Nodemailer** - Envío de emails de verificación

### Frontend
- **React 18** - Biblioteca de UI
- **Vite** - Build tool y dev server
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de CSS
- **Lucide React** - Iconos
- **Axios** - Cliente HTTP
- **React Router** - Enrutamiento
- **Context API** - Estado global

### Herramientas de Desarrollo
- **ESLint** - Linting de código
- **Prettier** - Formateo de código
- **PostCSS** - Procesamiento de CSS
- **Autoprefixer** - Prefijos CSS automáticos

## 📁 Estructura del Proyecto

```
FirmasProyecto/
├── Backend/                          # Servidor Node.js/Express
│   ├── API_Pyhanko/                 # Scripts Python para firma
│   │   ├── firmar-pdf.py           # Firma de documentos
│   │   └── requirements.txt         # Dependencias Python
│   ├── src/
│   │   ├── Controllers/            # Controladores de la API
│   │   │   ├── usercontroller.ts   # Autenticación
│   │   │   ├── Documentoscontroller.ts # Gestión de documentos
│   │   │   ├── CertificadoController.ts # Gestión de certificados
│   │   │   └── DocumentSigningController.ts # Firma digital
│   │   ├── Models/                 # Modelos de MongoDB
│   │   │   ├── Usuario.ts         # Modelo de usuario
│   │   │   ├── Documento.ts       # Modelo de documento
│   │   │   └── Certificado.ts     # Modelo de certificado
│   │   ├── Services/               # Lógica de negocio
│   │   │   ├── CAService.ts       # Servicios de CA
│   │   │   └── CertificadoService.ts # Gestión de certificados
│   │   ├── Middleware/             # Middlewares
│   │   │   └── authMiddleware.ts  # Autenticación JWT
│   │   ├── Rutas/                 # Definición de rutas
│   │   │   ├── rutas.ts           # Rutas de producción
│   │   │   └── testRutas.ts       # Rutas de testing
│   │   ├── Almacenamiento/        # Configuración de archivos
│   │   │   ├── DocumentosStorage.ts # Multer para documentos
│   │   │   └── CertificadoStorage.ts # Multer para certificados
│   │   └── Repositorio/           # Acceso a datos
│   │       └── UsuariosRepository.ts # Repositorio de usuarios
│   ├── SistemaCA/                  # Certificados del sistema
│   ├── uploads/                    # Archivos subidos
│   ├── package.json               # Dependencias Node.js
│   └── tsconfig.json             # Configuración TypeScript
├── Frontend/                       # Aplicación React
│   ├── src/
│   │   ├── components/            # Componentes React
│   │   │   ├── auth/             # Componentes de autenticación
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   ├── RegisterForm.jsx
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── document/         # Componentes de documentos
│   │   │   │   ├── DocumentList.jsx
│   │   │   │   ├── DocumentUpload.jsx
│   │   │   │   └── DocumentPreview.jsx
│   │   │   ├── certificate/      # Componentes de certificados
│   │   │   │   ├── CertificateUpload.jsx
│   │   │   │   ├── CertificateList.jsx
│   │   │   │   └── CertificateGenerator.jsx
│   │   │   ├── signing/          # Componentes de firma
│   │   │   │   ├── DocumentSigningModal.jsx
│   │   │   │   └── PDFSignatureSelector.jsx
│   │   │   ├── ui/               # Componentes de UI
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   └── Notification.jsx
│   │   │   └── services/         # Servicios de API
│   │   │       ├── authService.js
│   │   │       ├── UploadService.js
│   │   │       └── CertificateService.js
│   │   ├── context/              # Context API
│   │   │   └── AuthContext.jsx   # Contexto de autenticación
│   │   ├── config/               # Configuración
│   │   │   └── api.js           # Configuración de API
│   │   ├── App.jsx              # Componente principal
│   │   └── main.jsx             # Punto de entrada
│   ├── public/                   # Archivos estáticos
│   │   └── pdfjs/               # PDF.js para previsualización
│   ├── package.json             # Dependencias React
│   ├── vite.config.ts           # Configuración Vite
│   └── tailwind.config.js       # Configuración Tailwind
└── README.md                     # Este archivo
```

## 🚀 Instalación

### Prerrequisitos
- **Node.js** 18+ 
- **npm** o **yarn**
- **MongoDB** 5.0+
- **Python** 3.8+ (para pyHanko)
- **OpenSSL** (para validación de certificados)

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd FirmasProyecto
```

### 2. Instalar dependencias del Backend
```bash
cd Backend
npm install
```

### 3. Instalar dependencias del Frontend
```bash
cd ../Frontend
npm install
```

### 4. Instalar dependencias Python
```bash
cd ../Backend/API_Pyhanko
pip install -r requirements.txt
```

### 5. Configurar variables de entorno
```bash
# Backend/.env
# PostgreSQL (Usuarios)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password
POSTGRES_DB=firmas_digitales

# MongoDB (Documentos y Certificados)
MONGODB_URI=mongodb://localhost:27017/firmas_digitales

# JWT y Servidor
JWT_SECRET=tu_clave_secreta_muy_segura_para_jwt_2024
PORT=3002
NODE_ENV=development

# Email (Gmail)
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu_app_password_gmail

# Frontend/.env
VITE_API_URL=http://localhost:3002/api
VITE_BACKEND_PORT=3002
```

## ⚙️ Configuración

### Base de Datos Híbrida

#### PostgreSQL (Usuarios)
```bash
# Instalar PostgreSQL
# Windows: https://www.postgresql.org/download/windows/
# macOS: brew install postgresql
# Linux: sudo apt-get install postgresql

# Crear base de datos
createdb firmas_digitales

# O conectarse y crear
psql -U postgres
CREATE DATABASE firmas_digitales;
```

#### MongoDB (Documentos y Certificados)
```bash
# Iniciar MongoDB
mongod

# Crear base de datos
use firmas_digitales
```

### Certificados del Sistema
```bash
# Generar certificados CA
cd Backend/SistemaCA
openssl genrsa -out ca.key 2048
openssl req -new -x509 -key ca.key -out ca.crt -days 365
```

### Configuración de pyHanko
```bash
# Instalar pyHanko
pip install pyhanko

# Verificar instalación
python -c "import pyhanko; print('pyHanko instalado correctamente')"
```

## 🎯 Uso

### Desarrollo

#### Backend
```bash
cd Backend
npm run dev
# Servidor corriendo en http://localhost:3002
```

#### Frontend
```bash
cd Frontend
npm run dev
# Aplicación corriendo en http://localhost:5173
```

### Producción

#### Backend
```bash
cd Backend
npm run build
npm start
```

#### Frontend
```bash
cd Frontend
npm run build
# Los archivos se generan en dist/
```

## 🔌 API Endpoints

### Autenticación
```
POST /api/register          # Registro de usuario
POST /api/login            # Inicio de sesión
GET  /api/auth/session     # Verificar sesión
```

### Documentos
```
POST   /api/documentos/upload                    # Subir documento
GET    /api/documentos/usuario                   # Listar documentos
GET    /api/documentos/preview/:id               # Previsualizar documento
GET    /api/documentos/download/:id              # Descargar documento
DELETE /api/documentos/:id                       # Eliminar documento
```

### Certificados
```
POST   /api/certificados/upload                  # Subir certificado
GET    /api/certificados/usuario                 # Listar certificados
POST   /api/certificados/generate                # Generar certificado
POST   /api/certificados/generate-pyhanko        # Generar certificado pyHanko
DELETE /api/certificados/:id                     # Eliminar certificado
POST   /api/certificados/validate                # Validar contraseña
```

### Firma Digital
```
POST /api/documentos/sign                        # Firmar documento
GET  /api/documentos/signed/:id/download         # Descargar documento firmado
```

## 🏗️ Arquitectura

### Backend (Arquitectura MVC)
- **Models**: Definición de esquemas MongoDB
- **Views**: Respuestas JSON de la API
- **Controllers**: Lógica de negocio y manejo de requests
- **Services**: Operaciones complejas y reutilizables
- **Middleware**: Autenticación, validación, logging
- **Routes**: Definición de endpoints

### Frontend (Arquitectura Component-Based)
- **Components**: Componentes reutilizables
- **Services**: Llamadas a API y lógica de negocio
- **Context**: Estado global de la aplicación
- **Hooks**: Lógica reutilizable
- **Utils**: Funciones auxiliares

### Flujo de Datos
1. **Usuario interactúa** con el frontend
2. **Frontend llama** a la API del backend
3. **Backend valida** y procesa la solicitud
4. **Base de datos** almacena/recupera datos
5. **Backend responde** con JSON
6. **Frontend actualiza** la UI

## 🔒 Seguridad

### Autenticación
- **JWT tokens** con expiración de 1 hora
- **Refresh tokens** para renovación automática
- **bcrypt** para hash de contraseñas
- **Validación robusta** de contraseñas

### Encriptación
- **AES-256-CBC** para certificados externos
- **Salt único** por certificado
- **IV aleatorio** para cada encriptación
- **Almacenamiento seguro** de claves

### Validación
- **Sanitización** de inputs
- **Validación de tipos** con TypeScript
- **Validación de esquemas** con Mongoose
- **CORS configurado** para desarrollo

### Archivos
- **Validación de tipos** de archivo
- **Límites de tamaño** configurados
- **Almacenamiento temporal** para procesamiento
- **Limpieza automática** de archivos temporales

## 🧪 Testing

### Backend
```bash
cd Backend
npm test
```

### Frontend
```bash
cd Frontend
npm test
```

## 📊 Características Técnicas

### Rendimiento
- **Compresión** de archivos PDF
- **Streaming** para archivos grandes
- **Caché** de certificados en memoria
- **Optimización** de consultas MongoDB

### Escalabilidad
- **Arquitectura modular** para fácil extensión
- **Separación de responsabilidades**
- **APIs RESTful** bien definidas
- **Configuración por entorno**

### Mantenibilidad
- **TypeScript** para tipado estático
- **ESLint** para consistencia de código
- **Documentación** inline y README
- **Logs estructurados** para debugging

## 🤝 Contribución

1. **Fork** el proyecto
2. **Crea** una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abre** un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🔄 Flujo de Firmas del Sistema

### 📋 Proceso Completo de Firma Digital

#### 1. **Registro y Autenticación**
```
Usuario → Registro → Verificación Email → Login → Dashboard
```
- **Registro**: Usuario se registra con email y contraseña
- **Verificación**: Sistema envía email con token de verificación
- **Login**: Usuario verifica email y accede al sistema
- **Autenticación**: JWT token se genera y almacena

#### 2. **Gestión de Certificados**
```
Usuario → Subir Certificado P12 → Validar Contraseña → Almacenar Encriptado
```
- **Subida**: Usuario sube certificado P12 con contraseña
- **Validación**: OpenSSL valida la contraseña del certificado
- **Encriptación**: Certificado se encripta con AES-256-CBC
- **Almacenamiento**: Se guarda en MongoDB con salt e IV únicos

#### 3. **Gestión de Documentos**
```
Usuario → Subir PDF → Previsualizar → Listo para Firma
```
- **Subida**: Usuario sube documento PDF
- **Validación**: Sistema verifica tipo y tamaño de archivo
- **Almacenamiento**: Documento se guarda en sistema de archivos
- **Metadatos**: Información se almacena en MongoDB

#### 4. **Proceso de Firma Digital**
```
Seleccionar Documento → Elegir Certificado → Posicionar Firma → Firmar → Descargar
```

##### 4.1 **Selección de Documento y Certificado**
- Usuario selecciona documento PDF a firmar
- Usuario elige certificado digital de su lista
- Sistema valida que el certificado pertenece al usuario

##### 4.2 **Validación de Certificado**
```
Sistema → Desencriptar Certificado → Validar Contraseña → Cargar en Memoria
```
- **Desencriptación**: Sistema desencripta certificado con contraseña
- **Validación**: OpenSSL verifica integridad del certificado
- **Carga**: Certificado se carga temporalmente para firma

##### 4.3 **Posicionamiento de Firma**
```
Usuario → Seleccionar Página → Definir Coordenadas → Aplicar Posición
```
- **Interfaz**: Usuario interactúa con previsualización del PDF
- **Coordenadas**: Sistema captura posición X, Y, ancho, alto
- **Validación**: Se verifica que la posición es válida

##### 4.4 **Proceso de Firma con pyHanko**
```
Backend → Python Script → pyHanko → PDF Firmado → Base64 → Frontend
```

**Detalles técnicos:**
```python
# Backend/API_Pyhanko/firmar-pdf.py
1. Recibe parámetros: certificado, contraseña, PDF, posición
2. Carga certificado P12 con pyHanko
3. Aplica firma digital en coordenadas especificadas
4. Genera PDF firmado con metadatos
5. Retorna PDF en Base64 al frontend
```

##### 4.5 **Almacenamiento y Descarga**
```
PDF Firmado → Guardar en Sistema → Actualizar BD → Descarga Automática
```
- **Guardado**: PDF firmado se guarda en `uploads/`
- **Base de datos**: Se actualiza estado del documento a "firmado"
- **Descarga**: Frontend recibe Base64 y descarga automáticamente

#### 5. **Seguridad y Validaciones**

##### 5.1 **Autenticación en Cada Paso**
- **JWT Token**: Validado en cada request
- **Autorización**: Usuario solo accede a sus documentos/certificados
- **Sesión**: Tokens expiran automáticamente

##### 5.2 **Encriptación de Certificados**
```
Certificado Original → AES-256-CBC → Salt + IV → Almacenamiento Seguro
```
- **Algoritmo**: AES-256-CBC para máxima seguridad
- **Salt**: 16 bytes aleatorios por certificado
- **IV**: 16 bytes aleatorios por encriptación
- **Derivación**: PBKDF2 con 100,000 iteraciones

##### 5.3 **Validación de Integridad**
- **Certificados**: Validación con OpenSSL antes de usar
- **Documentos**: Verificación de tipo y tamaño
- **Firmas**: Verificación de coordenadas y parámetros

#### 6. **Arquitectura de Datos**

##### 6.1 **Base de Datos Híbrida**
```
PostgreSQL (Usuarios):
├── usuarios
│   ├── id (INTEGER, PK)
│   ├── nombre (VARCHAR)
│   ├── apellido (VARCHAR)
│   ├── email (VARCHAR, UNIQUE)
│   ├── contraseña (VARCHAR, HASHED)
│   ├── emailVerificado (BOOLEAN)
│   ├── verificationToken (VARCHAR)
│   └── verificationTokenExpires (TIMESTAMP)

MongoDB (Documentos y Certificados):
├── documentos
│   ├── _id (ObjectId)
│   ├── usuario_id (String)
│   ├── nombre_original (String)
│   ├── ruta (String)
│   ├── estado (String)
│   └── rutaFirmado (String)

└── certificados
    ├── _id (ObjectId)
    ├── userId (String)
    ├── fileName (String)
    ├── certificateData (Buffer)
    ├── encryptionSalt (String)
    ├── encryptionIV (String)
    └── type (String)
```

##### 6.2 **Flujo de Datos**
```
Frontend (React) ↔ Backend (Node.js/Express) ↔ Base de Datos
     ↓                    ↓                           ↓
  Interfaz           Lógica de Negocio         Almacenamiento
  Usuario           Validaciones               Persistencia
  Componentes       Autenticación             Consultas
```

#### 7. **Manejo de Errores**

##### 7.1 **Errores de Autenticación**
- Token expirado → Redirigir a login
- Usuario no autorizado → Error 401
- Certificado no válido → Mensaje específico

##### 7.2 **Errores de Firma**
- Contraseña incorrecta → Reintentar
- Certificado corrupto → Eliminar y re-subir
- PDF inválido → Validar formato
- Error de pyHanko → Log detallado

##### 7.3 **Errores de Sistema**
- Base de datos → Reintentar conexión
- Archivos → Limpiar temporales
- Memoria → Garbage collection automático

#### 8. **Optimizaciones de Rendimiento**

##### 8.1 **Procesamiento de Archivos**
- **Streaming**: Para archivos grandes
- **Temporales**: Limpieza automática
- **Compresión**: PDFs optimizados
- **Caché**: Certificados en memoria

##### 8.2 **Base de Datos**
- **Índices**: Optimizados para consultas frecuentes
- **Conexiones**: Pool configurado
- **Consultas**: Eficientes con Mongoose/Sequelize

#### 9. **Monitoreo y Logs**

##### 9.1 **Logs del Sistema**
```
[INFO] Usuario registrado: user@example.com
[DEBUG] Certificado validado: cert.p12
[WARN] Intento de acceso no autorizado
[ERROR] Error en firma: Invalid password
```

##### 9.2 **Métricas Importantes**
- Tiempo de respuesta de firma
- Tasa de éxito de validaciones
- Uso de memoria y CPU
- Errores por tipo

---

## 📞 Soporte

Para soporte técnico o preguntas sobre el proyecto:
- 📧 Email: soporte@signatureflow.com
- 📱 Discord: [Servidor de la comunidad]
- 📖 Documentación: [Wiki del proyecto]

---

**Desarrollado con ❤️ por el equipo de SignatureFlow** 