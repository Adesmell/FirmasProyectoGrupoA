import { api, getToken } from './authService';
import API_CONFIG from '../../config/api.js';

export async function uploadCertificate(file, password) {
  console.log('📤 Subiendo certificado...');
  console.log('📁 Nombre del archivo:', file.name);
  console.log('📏 Tamaño del archivo:', file.size, 'bytes');
  console.log('🔍 Tipo del archivo:', file.type);
  console.log('🔑 Contraseña proporcionada:', password ? '***' : 'NO PROPORCIONADA');
  
  // Verificar que el archivo no esté vacío
  if (file.size === 0) {
    throw new Error('El archivo está vacío');
  }
  
  const formData = new FormData();
  formData.append('certificado', file);
  formData.append('password', password);
  
  // Log del FormData
  console.log('📋 FormData creado:');
  for (let [key, value] of formData.entries()) {
    if (key === 'certificado') {
      console.log(`  - ${key}: ${value.name} (${value.size} bytes)`);
    } else {
      console.log(`  - ${key}: ${value}`);
    }
  }
  
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/certificados/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.mensaje || 'Error al subir el certificado');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al subir certificado:', error);
    throw error;
  }
}

export async function getUserCertificates() {
  try {
    const response = await api.get('/certificados/usuario');
    return response.data.certificados || [];
  } catch (error) {
    // Si es un 404, significa que el usuario no tiene certificados (normal)
    if (error.response && error.response.status === 404) {
      console.log('Usuario sin certificados registrados');
      return [];
    }
    // Solo mostrar error para otros códigos de estado
    console.error('Error al obtener certificados:', error);
    throw error;
  }
}

export async function deleteCertificate(certificateId) {
  try {
    const response = await api.delete(`/certificados/${certificateId}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar certificado:', error);
    throw error;
  }
}

export async function createSystemCertificate(certificateData) {
  try {
    console.log('🏗️ Creando certificado del sistema...', certificateData);
    
    const response = await api.post('/certificados/create-system', certificateData);
    return response.data;
  } catch (error) {
    console.error('Error al crear certificado del sistema:', error);
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || error.response.data.error || 'Error al crear certificado del sistema');
    }
    throw error;
  }
}

export async function getSystemCertificates() {
  try {
    const response = await api.get('/certificados/system');
    return response.data.certificates || [];
  } catch (error) {
    console.error('Error al obtener certificados del sistema:', error);
    throw error;
  }
}