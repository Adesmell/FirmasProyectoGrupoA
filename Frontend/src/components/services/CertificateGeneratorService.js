import { api, getToken } from './authService';
import API_CONFIG from '../../config/api.js';

/**
 * Genera un certificado auto-firmado para el usuario
 * @param {Object} certificateData - Datos del certificado
 * @param {string} certificateData.commonName - Nombre común (CN)
 * @param {string} certificateData.organization - Organización (O)
 * @param {string} certificateData.country - País (C)
 * @param {string} certificateData.email - Email
 * @param {string} certificateData.password - Contraseña para el archivo .p12
 * @param {number} certificateData.validityDays - Días de validez (por defecto 365)
 */
export async function generateSelfSignedCertificate(certificateData) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/certificados/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        commonName: certificateData.commonName,
        organization: certificateData.organization || '',
        country: certificateData.country || 'MX',
        email: certificateData.email,
        password: certificateData.password,
        validityDays: certificateData.validityDays || 365
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.mensaje || 'Error al generar el certificado');
    }

    // El servidor devuelve el archivo .p12 como blob
    const blob = await response.blob();
    
    // Extraer el nombre del archivo del header Content-Disposition
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `certificado_${certificateData.commonName.replace(/\s+/g, '_')}.p12`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    return {
      file: blob,
      filename: filename
    };
  } catch (error) {
    console.error('Error al generar certificado:', error);
    throw error;
  }
}

/**
 * Genera un certificado compatible con pyHanko para el usuario
 * @param {Object} certificateData - Datos del certificado
 * @param {string} certificateData.commonName - Nombre común (CN) - REQUERIDO
 * @param {string} certificateData.organization - Organización (O)
 * @param {string} certificateData.organizationalUnit - Unidad organizacional (OU)
 * @param {string} certificateData.locality - Localidad (L)
 * @param {string} certificateData.state - Estado/Provincia (ST)
 * @param {string} certificateData.country - País (C)
 * @param {string} certificateData.email - Email
 * @param {string} certificateData.password - Contraseña para el archivo .p12 - REQUERIDO
 */
export async function generatePyHankoCertificate(certificateData) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/certificados/generate-pyhanko`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        commonName: certificateData.commonName,
        organization: certificateData.organization || 'Test Organization',
        organizationalUnit: certificateData.organizationalUnit || 'IT',
        locality: certificateData.locality || 'Guayaquil',
        state: certificateData.state || 'Guayas',
        country: certificateData.country || 'EC',
        email: certificateData.email,
        password: certificateData.password
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.mensaje || errorData.error || 'Error al generar el certificado compatible con pyHanko');
    }

    // El servidor devuelve el archivo .p12 como blob
    const blob = await response.blob();
    
    // Extraer el nombre del archivo del header Content-Disposition
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `certificado_${certificateData.commonName.replace(/\s+/g, '_')}.p12`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    return {
      file: blob,
      filename: filename
    };
  } catch (error) {
    console.error('Error al generar certificado compatible con pyHanko:', error);
    throw error;
  }
}

/**
 * Valida los datos del certificado antes de generar
 */
export function validateCertificateData(data) {
  const errors = [];

  if (!data.commonName || data.commonName.trim().length < 2) {
    errors.push('El nombre común debe tener al menos 2 caracteres');
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Debe proporcionar un email válido');
  }

  if (!data.password || data.password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }

  if (data.country && data.country.length !== 2) {
    errors.push('El código de país debe tener 2 caracteres (ej: MX, US, ES)');
  }

  return errors;
}

/**
 * Valida los datos del certificado compatible con pyHanko
 */
export function validatePyHankoCertificateData(data) {
  const errors = [];

  if (!data.commonName || data.commonName.trim().length < 2) {
    errors.push('El nombre común debe tener al menos 2 caracteres');
  }

  if (!data.password || data.password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }

  // Validar que los campos no contengan caracteres especiales
  const nameRegex = /^[a-zA-Z0-9\s]+$/;
  if (data.commonName && !nameRegex.test(data.commonName)) {
    errors.push('El nombre común solo puede contener letras, números y espacios');
  }

  if (data.organization && !nameRegex.test(data.organization)) {
    errors.push('La organización solo puede contener letras, números y espacios');
  }

  if (data.organizationalUnit && !nameRegex.test(data.organizationalUnit)) {
    errors.push('La unidad organizacional solo puede contener letras, números y espacios');
  }

  if (data.locality && !nameRegex.test(data.locality)) {
    errors.push('La localidad solo puede contener letras, números y espacios');
  }

  if (data.state && data.state.length !== 2) {
    errors.push('El código de estado debe tener 2 caracteres (ej: Guayas = GS)');
  }

  if (data.country && data.country.length !== 2) {
    errors.push('El código de país debe tener 2 caracteres (ej: EC, MX, US)');
  }

  return errors;
}

/**
 * Descarga un archivo blob como .p12
 */
export function downloadCertificate(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
