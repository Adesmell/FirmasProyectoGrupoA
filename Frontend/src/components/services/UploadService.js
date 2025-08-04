import { getToken } from './authService';
import API_CONFIG from '../../config/api.js';

export function uploadpdf(file) {
  const formData = new FormData();
  formData.append('archivo', file);
  
  // Obtener el token de autenticación
  const token = getToken();
  
  return fetch(`${API_CONFIG.BASE_URL}/documentos/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('No autorizado. Por favor, inicie sesión nuevamente.');
      }
      throw new Error('Error al subir el archivo');
    }
    return response.json();
  });
}

// Función para obtener documentos del usuario
export async function getUserDocuments() {
  const token = getToken();
  
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/documentos/usuario`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('No autorizado. Por favor, inicie sesión nuevamente.');
      }
      throw new Error('Error al obtener los documentos');
    }
    
    const data = await response.json();
    
    const mappedDocuments = (data.documentos || []).map(doc => {
      const mappedDoc = {
        id: doc._id || doc.id,
        nombre: doc.nombre_original || doc.nombre || doc.name,
        nombre_archivo: doc.nombre_archivo || '',
        ruta: doc.ruta || '',
        tamano: doc.tamano || doc.tamaño || doc.size || 0,
        tipo_archivo: doc.tipo_archivo || doc.tipo || doc.type || 'application/pdf',
        fecha_subida: doc.fecha_subida || doc.fechaSubida || doc.uploadDate,
        usuario_id: doc.usuario_id || doc.usuarioId,
        estado: doc.estado || 'READY',
        firmado: !!doc.firmadoPor,
        firmadoPor: doc.firmadoPor || doc.signedBy,
        fechaFirma: doc.fechaFirma || doc.signedDate
      };
      
      return mappedDoc;
    });
    
    return mappedDocuments;
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    throw error;
  }
}

// Función para eliminar documento
export async function deleteDocument(documentId) {
  const token = getToken();
  
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/documentos/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('No autorizado. Por favor, inicie sesión nuevamente.');
      }
      if (response.status === 404) {
        throw new Error('Documento no encontrado');
      }
      const errorData = await response.json();
      throw new Error(errorData.mensaje || 'Error al eliminar el documento');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    throw error;
  }
}

// Función para descargar documento
export async function downloadDocument(documentId) {
  const token = getToken();
  
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/documentos/download/${documentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('No autorizado. Por favor, inicie sesión nuevamente.');
      }
      if (response.status === 404) {
        throw new Error('Documento no encontrado');
      }
      throw new Error('Error al descargar el documento');
    }
    
    // Obtener el nombre del archivo del header Content-Disposition
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'documento.pdf';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    // Crear blob y descargar
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    
    return { success: true, filename };
  } catch (error) {
    console.error('Error al descargar documento:', error);
    throw error;
  }
}

// Actualizar la función de firma para incluir correctamente la contraseña
export async function signDocument(documentId, certificateId, password) {
  const token = getToken();
  
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/documentos/${documentId}/firmar`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        certificadoId: certificateId,
        password: password // Añadir la contraseña al cuerpo de la solicitud
      })
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('No autorizado. Por favor, inicie sesión nuevamente.');
      }
      const errorData = await response.json();
      throw new Error(errorData.mensaje || 'Error al firmar el documento');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al firmar documento:', error);
    throw error;
  }
}
