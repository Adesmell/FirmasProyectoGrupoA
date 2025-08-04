import API_CONFIG from '../../config/api.js';

// Función para verificar disponibilidad de email
export const checkEmailAvailability = async (email) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/check-email?email=${encodeURIComponent(email)}`);
    
    if (!response.ok) {
      throw new Error('Error en la verificación de email');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error verificando disponibilidad de email:', error);
    throw error;
  }
};

// Función para validar formato de email
export const validateEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Función para debounce de verificación de email
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Función para verificar email con debounce
export const checkEmailWithDebounce = debounce(async (email, setEmailStatus) => {
  if (!validateEmailFormat(email)) {
    setEmailStatus('idle');
    return;
  }

  setEmailStatus('checking');
  
  try {
    const data = await checkEmailAvailability(email);
    setEmailStatus(data.isAvailable ? 'available' : 'taken');
  } catch (error) {
    console.error('Error en verificación de email:', error);
    setEmailStatus('idle');
  }
}, 500); // 500ms de debounce 