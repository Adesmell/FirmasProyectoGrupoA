// Servicio para firma de documentos PDF
import axios from 'axios';
import { getToken } from './authService';
import API_CONFIG from '../../config/api.js';

export const signDocumentWithCertificate = async (documentId, certificateId, password, signaturePosition, qrData, canvasDimensions) => {
  try {
    const token = getToken();
    
    // Debug: Verificar el token
    console.log('🔍 Debug - Token obtenido:', token ? 'SÍ' : 'NO');
    console.log('🔍 Debug - Token valor:', token);
    console.log('🔍 Debug - Token tipo:', typeof token);
    
    if (!token) {
      throw new Error('No hay token de autenticación disponible');
    }
    
    const response = await axios.post(`${API_CONFIG.BASE_URL}/documentos/sign`, {
      documentId,
      certificateId,
      password,
      signaturePosition,
      qrData,
      canvasDimensions
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error al firmar documento:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Error al firmar el documento');
    }
    throw new Error('Error de conexión al firmar el documento');
  }
};



export const validateCertificatePassword = async (certificateId, password) => {
  try {
    const token = getToken();
    
    // Siempre enviar contraseña para validar cualquier tipo de certificado
    const requestData = {
      certificateId,
      password
    };
    
    const response = await axios.post(`${API_CONFIG.BASE_URL}/certificados/validate-password`, requestData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error al validar contraseña del certificado:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Error al validar la contraseña');
    }
    throw new Error('Error de conexión al validar la contraseña');
  }
};

export const getDocumentForSigning = async (documentId) => {
  try {
    const token = getToken();
    
    const response = await axios.get(`${API_CONFIG.BASE_URL}/documentos/${documentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error al obtener documento:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Error al obtener el documento');
    }
    throw new Error('Error de conexión al obtener el documento');
  }
};

export const downloadSignedDocument = async (documentId) => {
  try {
    const token = getToken();
    
    const response = await axios.get(`${API_CONFIG.BASE_URL}/documentos/signed/${documentId}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'blob' // Importante para descargar archivos
    });

    // Crear URL del blob y descargar
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `documento-firmado-${documentId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error al descargar documento firmado:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Error al descargar el documento firmado');
    }
    throw new Error('Error de conexión al descargar el documento');
  }
};
