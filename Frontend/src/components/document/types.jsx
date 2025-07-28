// Document types and interfaces for the signature system

export const DocumentStatus = {
  UPLOADING: 'uploading',
  READY: 'ready',
  SIGNED: 'signed',
  PENDING: 'pending',
  ERROR: 'error'
};

export const createDocument = (file) => ({
  id: Math.random().toString(36).substr(2, 9),
  name: file.name,
  size: file.size,
  type: file.type,
  uploadDate: new Date(),
  status: DocumentStatus.UPLOADING,
  url: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
  signedBy: null,
  signedDate: null
});

export const validateFile = (file, fileType = 'document') => {
  if (fileType === 'document') {
    const allowedTypes = [
      'application/pdf'
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return `Solo se permiten archivos PDF: ${file.name}`;
    }
    if (file.size > maxSize) {
      return `Archivo demasiado grande: ${file.name} (máximo 10MB)`;
    }
  } 
  // Si estamos validando un certificado
  else if (fileType === 'certificate') {
    const maxSize = 5 * 1024 * 1024;
    
    const isP12Extension = file.name.toLowerCase().endsWith('.p12');
    const isP12MimeType = file.type === 'application/x-pkcs12' || 
                         file.type === 'application/pkcs12' ||
                         file.type === '';

    if (!isP12Extension && !isP12MimeType) {
      return `Formato de certificado no válido: ${file.name} (debe ser .p12)`;
    }
    
    if (file.size > maxSize) {
      return `Certificado demasiado grande: ${file.name} (máximo 5MB)`;
    }
  }
  
  return null;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (date) => {
  if (!date || isNaN(new Date(date).getTime())) {
    return 'Fecha no disponible';
  }
  
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};