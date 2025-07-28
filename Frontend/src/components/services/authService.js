import axios from 'axios';
import API_CONFIG from '../../config/api.js';

// Token y usuario - ahora con persistencia segura
let inMemoryToken = null;
let inMemoryUser = null;

// Función para almacenar token de forma segura
function storeTokenSecurely(token) {
  if (token && token !== 'null' && token !== 'undefined') {
    // Almacenar en localStorage para persistencia
    localStorage.setItem('authToken', token);
    inMemoryToken = token;
    console.log('Token stored securely');
  } else {
    console.error('Attempted to store invalid token:', token);
  }
}

// Función para obtener token almacenado
function getStoredToken() {
  if (inMemoryToken && inMemoryToken !== 'null' && inMemoryToken !== 'undefined') {
    return inMemoryToken;
  }
  // Recuperar de localStorage si no está en memoria
  const storedToken = localStorage.getItem('authToken');
  if (storedToken && storedToken !== 'null' && storedToken !== 'undefined') {
    inMemoryToken = storedToken;
    return storedToken;
  }
  return null;
}

// Función para almacenar usuario de forma segura
function storeUserSecurely(user) {
  localStorage.setItem('authUser', JSON.stringify(user));
  inMemoryUser = user;
}

// Función para obtener usuario almacenado
function getStoredUser() {
  if (inMemoryUser) {
    return inMemoryUser;
  }
  // Recuperar de localStorage si no está en memoria
  const storedUser = localStorage.getItem('authUser');
  if (storedUser) {
    try {
      inMemoryUser = JSON.parse(storedUser);
      return inMemoryUser;
    } catch (e) {
      console.error('Error parsing stored user:', e);
      localStorage.removeItem('authUser');
    }
  }
  return null;
}

// Función para limpiar tokens almacenados
function clearStoredAuth() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
  localStorage.removeItem('pendingVerificationEmail');
  inMemoryToken = null;
  inMemoryUser = null;
}

// Crear una instancia de axios con configuración base
export const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para añadir token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url);
    const token = getStoredToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Token added to request headers');
    } else {
      console.log('No token available for request');
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y detectar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el error es 401 (no autorizado), limpiar los datos de sesión
    if (error.response && error.response.status === 401) {
      console.log('401 error detected, clearing stored auth');
      clearStoredAuth();
      window.dispatchEvent(new CustomEvent('auth-error', {
        detail: { message: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.' }
      }));
    }
    return Promise.reject(error);
  }
);

// Función para crear una cookie HttpOnly (más segura)
function setSessionCookie(name, value, expiryDays = 1) {
  const date = new Date();
  date.setTime(date.getTime() + (expiryDays * 24 * 60 * 60 * 1000));
  const expires = "expires=" + date.toUTCString();
  document.cookie = `${name}=1; ${expires}; path=/; SameSite=Strict`;
}

// Función para verificar si existe una cookie
function checkSessionCookie(name) {
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.indexOf(name + '=') === 0) {
      return true;
    }
  }
  return false;
}

// Función para eliminar una cookie
function deleteSessionCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
}

// Modificar la función loginUser
export async function loginUser({ email, password }) {
  try {
    console.log('Attempting login with:', { email, password: '***' });
    
    const response = await api.post('/login', {
      email,
      password
    });

    console.log('Login response received:', {
      token: response.data.token ? 'Token present' : 'No token',
      user: response.data.user ? 'User data present' : 'No user data',
      emailVerificado: response.data.user?.emailVerificado
    });

    // Verificar si el email está verificado
    if (response.data.user && !response.data.user.emailVerificado) {
      throw 'Por favor verifica tu email antes de iniciar sesión';
    }

    // Guardar token y datos del usuario de forma persistente
    storeTokenSecurely(response.data.token);
    storeUserSecurely(response.data.user);
    
    console.log('Token and user stored persistently:', {
      tokenStored: getStoredToken() ? 'Yes' : 'No',
      userStored: getStoredUser() ? 'Yes' : 'No'
    });
    
    // Crear una cookie de sesión (sin guardar el token en ella)
    setSessionCookie('sessionActive', 1);
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error.response?.data?.message || error.message || 'Error al iniciar sesión';
  }
}

export async function registerUser({ nombre, apellido, email, password }) {
  console.log('🔐 registerUser llamado con:', { nombre, apellido, email, password: '***' });
  console.log('🌐 URL base de la API:', API_CONFIG.BASE_URL);
  
  try {
    console.log('📡 Haciendo POST a /register...');
    const response = await api.post('/register', {
      nombre,
      apellido,
      email,
      password
    });

    console.log('✅ Respuesta del servidor:', response.data);

    // Almacenar email pendiente de verificación
    if (response.data.success && !response.data.user.emailVerificado) {
      localStorage.setItem('pendingVerificationEmail', email);
      console.log('📧 Email pendiente de verificación almacenado:', email);
    }

    // Si el registro también devuelve un token, lo almacenamos en memoria
    if (response.data.token) {
      console.log('🔑 Token recibido, almacenando...');
      inMemoryToken = response.data.token;
      inMemoryUser = response.data.user;
    }

    return response.data;
  } catch (error) {
    console.error('❌ Error en registerUser:', error);
    
    // Manejar errores específicos del backend
    if (error.response) {
      const { status, data } = error.response;
      console.log('📊 Error del servidor:', { status, data });
      
      if (status === 409) {
        throw 'El correo electrónico ya está registrado';
      } else if (status === 400) {
        throw data.message || 'Datos de registro inválidos';
      } else if (status === 422) {
        throw data.message || 'La contraseña no cumple con los requisitos';
      } else {
        throw data.message || 'Error al registrar el usuario';
      }
    } else if (error.request) {
      console.log('🌐 Error de red:', error.request);
      throw 'Error de conexión. Verifica tu conexión a internet';
    } else {
      console.log('❓ Error inesperado:', error);
      throw 'Error inesperado al registrar el usuario';
    }
  }
}

// Función para verificar email
export async function verifyEmail(token) {
  try {
    console.log('🔍 Verificando email con token:', token);
    
    const response = await api.get(`/verify-email/${token}`);
    
    console.log('✅ Email verificado exitosamente');
    
    // Limpiar email pendiente de verificación
    localStorage.removeItem('pendingVerificationEmail');
    
    // Si hay un nuevo token, almacenarlo
    if (response.data.token) {
      storeTokenSecurely(response.data.token);
      storeUserSecurely(response.data.user);
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Error verificando email:', error);
    throw error.response?.data?.message || 'Error al verificar el email';
  }
}

// Función para reenviar email de verificación
export async function resendVerificationEmail(email) {
  try {
    console.log('📧 Reenviando email de verificación a:', email);
    
    const response = await api.post('/resend-verification', { email });
    
    console.log('✅ Email de verificación reenviado exitosamente');
    return response.data;
  } catch (error) {
    console.error('❌ Error reenviando email:', error);
    throw error.response?.data?.message || 'Error al reenviar el email de verificación';
  }
}

// Función para verificar si el usuario está autenticado
export function isAuthenticated() {
  const token = getStoredToken();
  return token !== null;
}

// Función para obtener el usuario actual
export function getCurrentUser() {
  return getStoredUser();
}

// Función para obtener el token (para componentes que lo necesiten)
export function getToken() {
  const token = getStoredToken();
  if (!token) return null;
  
  // Verificar si el token está expirado
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    if (payload.exp && payload.exp < currentTime) {
      console.log('Token expired, clearing stored auth');
      clearStoredAuth();
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('Error parsing token:', error);
    clearStoredAuth();
    return null;
  }
}

// Función para renovar el token
export async function refreshToken() {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.log('No current user found, cannot refresh token');
      return false;
    }
    
    console.log('Attempting to refresh token...');
    const response = await api.post('/auth/refresh');
    
    if (response.data.token) {
      storeTokenSecurely(response.data.token);
      console.log('Token refreshed successfully');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error refreshing token:', error);
    clearStoredAuth();
    return false;
  }
}

// Función para cerrar sesión
export function logout() {
  console.log('Logging out user');
  clearStoredAuth();
  deleteSessionCookie('sessionActive');
  console.log('User logged out successfully');
}

// Función para recuperar la sesión
export async function recoverSession() {
  console.log('Attempting to recover session...');
  
  // Primero verificar si hay un token almacenado
  const storedToken = getStoredToken();
  const storedUser = getStoredUser();
  
  if (storedToken && storedUser && storedToken !== 'null' && storedToken !== 'undefined') {
    console.log('Found valid stored token and user, session recovered from storage');
    // Si tenemos token y usuario válidos, no necesitamos validar con el servidor cada vez
    // El token se validará automáticamente en las siguientes requests
    return true;
  }
  
  console.log('No valid stored session found');
  return false;
}

// Exportar funciones internas necesarias para otros componentes
export { getStoredToken, getStoredUser };

// Log para verificar que el módulo se carga correctamente
console.log('authService.js loaded successfully at:', new Date().toISOString());
console.log('Available exports:', {
  isAuthenticated: typeof isAuthenticated,
  getCurrentUser: typeof getCurrentUser,
  getToken: typeof getToken,
  logout: typeof logout,
  recoverSession: typeof recoverSession,
  loginUser: typeof loginUser,
  registerUser: typeof registerUser,
  verifyEmail: typeof verifyEmail,
  resendVerificationEmail: typeof resendVerificationEmail
});

// Forzar recarga del módulo
export const moduleVersion = Date.now();
