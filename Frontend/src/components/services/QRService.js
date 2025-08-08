// Servicio para generar códigos QR usando API externa (compatible con navegador)
const QR_API_BASE_URL = 'https://api.qrserver.com/v1/create-qr-code/';

/**
 * Genera un código QR con los datos mínimos del certificado
 * @param {Object} certificate - Datos del certificado
 * @returns {Promise<{qrImageUrl: string, qrData: Object, qrText: string}>}
 */
export const generateQRForCertificate = async (certificate) => {
  if (!certificate) {
    throw new Error('Certificado requerido para generar QR');
  }

  try {
    // Extraer solo la información necesaria del certificado
    const subject = certificate.subject || {};
    const nombre = subject.commonName || certificate.alias || certificate.fileName || 'Sin nombre';
    const organizacion = subject.organizationName || 'Sin organización';
    const correo = subject.emailAddress || 'sin@correo.com';
    const fechaFirma = new Date().toLocaleString();

    // Texto plano para el QR
    const qrText = `Firmado por: ${nombre}\nCorreo: ${correo}\nOrganización: ${organizacion}\nFecha: ${fechaFirma}`;
    
    // Generar URL del QR usando API externa
    const qrImageUrl = `${QR_API_BASE_URL}?size=120x120&data=${encodeURIComponent(qrText)}&format=png`;
    
    console.log('🔍 Generando QR con datos:', { nombre, organizacion, correo, fechaFirma });
    
    return {
      qrImageUrl,
      qrData: { nombre, organizacion, correo, fechaFirma },
      qrText
    };
  } catch (error) {
    console.error('Error al generar código QR:', error);
    throw new Error('No se pudo generar el código QR');
  }
};
