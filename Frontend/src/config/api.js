// Configuración centralizada de la API
const API_CONFIG = {
  // Puerto del backend - usa variable de entorno o default a 3002
  BACKEND_PORT: import.meta.env.VITE_BACKEND_PORT || '3002',
  // URL base del backend - usa variable de entorno o construye con el puerto
  BASE_URL: import.meta.env.VITE_API_URL || `http://localhost:${import.meta.env.VITE_BACKEND_PORT || '3002'}/api`,
  // Timeout para las peticiones
  TIMEOUT: import.meta.env.VITE_API_TIMEOUT || 30000,
};

export default API_CONFIG; 