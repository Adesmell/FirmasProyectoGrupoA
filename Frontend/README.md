# Frontend - Sistema de Firma Digital de Documentos

## 📋 Descripción

Este es el frontend del sistema de firma digital de documentos, desarrollado con React y Vite. Proporciona una interfaz de usuario moderna e intuitiva para la gestión de documentos, certificados digitales y procesos de firma electrónica.

## 🚀 Características Principales

- **Interfaz Moderna**: UI responsive con TailwindCSS
- **Autenticación Segura**: Sistema de login/registro con JWT
- **Rutas Protegidas**: Navegación segura con React Router
- **Gestión de Estado**: Context API para manejo de autenticación
- **Subida de Archivos**: Interfaz drag & drop para documentos
- **Gestión de Certificados**: Carga y gestión de certificados P12
- **Experiencia de Usuario**: Diseño intuitivo y accesible

## 🛠️ Stack Tecnológico

- **Framework**: React 18
- **Build Tool**: Vite
- **Estilos**: TailwindCSS + PostCSS
- **Navegación**: React Router DOM v7
- **HTTP Client**: Axios
- **Iconos**: Lucide React
- **Linting**: ESLint
- **Desarrollo**: Hot Module Replacement (HMR)

## 📁 Estructura del Proyecto

```
src/
├── components/           # Componentes reutilizables
│   ├── auth/            # Componentes de autenticación
│   │   ├── LoginPage.jsx      # Página de inicio de sesión
│   │   ├── RegisterPage.jsx   # Página de registro
│   │   └── ProtectedRoute.jsx # Componente de rutas protegidas
│   └── Pages/           # Páginas principales
│       └── Principal.jsx      # Página principal de la aplicación
├── context/             # Contextos de React
│   └── AuthContext.jsx       # Contexto de autenticación
├── App.jsx             # Componente principal de la aplicación
├── main.jsx           # Punto de entrada de React
└── index.css          # Estilos globales
```

## 🎨 Diseño y UI/UX

### Paleta de Colores
- **Primario**: Gradiente azul (blue-50 a indigo-50)
- **Acentos**: Colores de TailwindCSS
- **Tema**: Moderno y profesional

### Características de Diseño
- **Responsive**: Adaptable a todos los dispositivos
- **Accesibilidad**: Cumple estándares WCAG
- **Animaciones**: Transiciones suaves
- **Iconografía**: Lucide React icons

## 🔧 Instalación y Configuración

### Prerrequisitos
- Node.js (v18 o superior)
- npm, yarn o pnpm
- Backend ejecutándose en puerto 3000

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd Frontend

# Instalar dependencias
npm install
# o
yarn install
# o
pnpm install
```

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Configuración del Backend
VITE_BACKEND_PORT=3002
VITE_API_URL=http://localhost:3002/api
VITE_API_TIMEOUT=30000

# Configuración del Frontend
VITE_FRONTEND_PORT=5173
VITE_APP_NAME=Sistema de Firma Digital
```

## 🚀 Ejecución

### Desarrollo
```bash
# Iniciar servidor de desarrollo
npm run dev
# o
yarn dev
# o
pnpm dev

# La aplicación estará disponible en http://localhost:5173
```

### Construcción para Producción
```bash
# Construir para producción
npm run build
# o
yarn build
# o
pnpm build

# Previsualizar build de producción
npm run preview
# o
yarn preview
# o
pnpm preview
```

### Linting
```bash
# Ejecutar ESLint
npm run lint
# o
yarn lint
# o
pnpm lint
```

## 🔐 Autenticación y Seguridad

### Sistema de Autenticación
- **JWT Tokens**: Almacenados de forma segura
- **Rutas Protegidas**: Acceso controlado a páginas sensibles
- **Contexto Global**: Estado de autenticación compartido
- **Redirección Automática**: Login/logout seamless

### Flujo de Autenticación
1. Usuario ingresa credenciales
2. Frontend envía request al backend
3. Backend valida y retorna JWT
4. Token se almacena en contexto
5. Rutas protegidas verifican autenticación

## 📱 Páginas y Componentes

### Páginas Principales

#### LoginPage
- Formulario de inicio de sesión
- Validación de campos
- Manejo de errores
- Redirección post-login

#### RegisterPage
- Formulario de registro de usuario
- Validación de contraseñas
- Términos y condiciones
- Confirmación de registro

#### Principal
- Dashboard principal
- Gestión de documentos
- Subida de archivos
- Gestión de certificados
- Proceso de firma

### Componentes de Autenticación

#### ProtectedRoute
- Wrapper para rutas protegidas
- Verificación de autenticación
- Redirección automática
- Manejo de estados de carga

#### AuthContext
- Estado global de autenticación
- Funciones de login/logout
- Persistencia de sesión
- Manejo de tokens

## 🌐 Integración con Backend

### API Endpoints Utilizados

```javascript
// Autenticación
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout

// Documentos
GET /api/documentos
POST /api/documentos/upload
DELETE /api/documentos/:id

// Certificados
POST /api/certificados/upload
GET /api/certificados
DELETE /api/certificados
```

### Configuración de Axios
```javascript
// Configuración base
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 🎯 Funcionalidades Principales

### Gestión de Documentos
- **Subida**: Drag & drop o selección manual
- **Visualización**: Lista de documentos subidos
- **Descarga**: Acceso a documentos almacenados
- **Eliminación**: Borrado seguro de documentos

### Gestión de Certificados
- **Carga**: Subida de certificados P12
- **Validación**: Verificación de formato
- **Almacenamiento**: Encriptación automática
- **Gestión**: Renovación y eliminación

### Proceso de Firma
- **Selección**: Elegir documento a firmar
- **Certificado**: Aplicar certificado digital
- **Firma**: Proceso de firma electrónica
- **Descarga**: Documento firmado

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén configurados)
npm run test
# o
yarn test
# o
pnpm test
```

## 📦 Build y Deployment

### Optimizaciones de Build
- **Tree Shaking**: Eliminación de código no usado
- **Minificación**: Compresión de archivos
- **Code Splitting**: Carga lazy de componentes
- **Asset Optimization**: Optimización de imágenes

### Deployment
```bash
# Build para producción
npm run build

# Los archivos estarán en la carpeta 'dist'
# Subir contenido de 'dist' a tu servidor web
```

## 🔧 Configuración Avanzada

### Vite Configuration
```javascript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3002'
    }
  }
});
```

### TailwindCSS Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      // Personalizaciones del tema
    },
  },
  plugins: [],
};
```

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

1. **Error de conexión con backend**
   - Verificar que el backend esté ejecutándose
   - Comprobar la URL en `.env`
   - Verificar configuración de CORS

2. **Problemas de autenticación**
   - Limpiar localStorage
   - Verificar tokens JWT
   - Comprobar configuración de contexto

3. **Errores de build**
   - Limpiar node_modules y reinstalar
   - Verificar versiones de dependencias
   - Comprobar configuración de Vite

4. **Problemas de estilos**
   - Verificar configuración de TailwindCSS
   - Comprobar importación de estilos
   - Revisar configuración de PostCSS

## 📞 Soporte

Para soporte técnico, contacta al equipo de desarrollo.

## 🚀 Roadmap

### Próximas Funcionalidades
- [ ] Modo oscuro
- [ ] Internacionalización (i18n)
- [ ] PWA (Progressive Web App)
- [ ] Notificaciones push
- [ ] Firma en lote
- [ ] Plantillas de documentos
- [ ] Historial de firmas
- [ ] Integración con servicios de nube

### Mejoras Técnicas
- [ ] Tests unitarios y de integración
- [ ] Storybook para componentes
- [ ] Optimización de performance
- [ ] Accesibilidad mejorada
- [ ] SEO optimization
