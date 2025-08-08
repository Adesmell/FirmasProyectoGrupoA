import { Router } from "express";
import multer from "multer";
import { auth } from "../Middleware/authMiddleware";
import jwt from "jsonwebtoken";
import { 
  registrarUsuario, 
  iniciarSesion, 
  verificarEmail, 
  reenviarEmailVerificacion,
  checkEmailAvailability,
  requestPasswordReset,
  resetPassword,
  verifyResetToken,
  getUsuarios
} from "../Controllers/usercontroller";
import { 
  uploadDocumento, 
  getDocumentosByUsuario, 
  previewDocumento, 
  downloadDocumento, 
  deleteDocumento 
} from "../Controllers/Documentoscontroller";
import { 
  signDocument, 
  validateCertificatePassword,
  getDocument,
  downloadSignedDocument
} from "../Controllers/DocumentSigningController";
import { 
  uploadCertificado, 
  getCertificadosByUsuario, 
  deleteCertificado,
  generateCertificado,
  generateCertificatePyHanko
} from "../Controllers/CertificadoController";
import { 
  getNotificaciones,
  marcarComoLeida,
  crearSolicitudFirma,
  aceptarSolicitudFirma,
  rechazarSolicitudFirma,
  getEstadisticasNotificaciones
} from "../Controllers/NotificacionController";
import {
  crearSolicitudFirmaMultiple,
  obtenerSolicitudesFirma,
  obtenerHistorialFirmas,
  obtenerEstadisticasFirmas,
  marcarFirmaCompletada
} from "../Controllers/SolicitudFirmaController";
import { uploadDoc } from "../Almacenamiento/DocumentosStorage";
import { uploadCert } from "../Almacenamiento/CertificadoStorage";
import Documento from "../Models/Documento";
import Certificado from "../Models/Certificado";
import SolicitudFirma from "../Models/SolicitudFirma";
import Usuario from "../Models/UsuarioPostgres";

const router = Router();

// Middleware para manejar errores de multer
const handleMulterError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ mensaje: 'El archivo es demasiado grande. Máximo 10MB' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ mensaje: 'Demasiados archivos. Solo se permite uno por vez' });
    }
    return res.status(400).json({ mensaje: 'Error al procesar el archivo' });
  }
  if (error.message === 'Solo se permiten archivos PDF') {
    return res.status(400).json({ mensaje: error.message });
  }
  next(error);
};

// Rutas públicas
router.post('/register', registrarUsuario);
router.post('/login', iniciarSesion);
router.get('/verify-email/:token', verificarEmail);
router.post('/resend-verification', reenviarEmailVerificacion);
router.post('/check-email', checkEmailAvailability);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/verify-reset-token', verifyResetToken);
router.get('/verify-reset-token/:token', verifyResetToken);

// Rutas protegidas - Usuarios
router.get('/user/profile', auth, (req, res) => {
  res.json({ user: req.user });
});
router.get('/usuarios', auth, getUsuarios);

// Endpoint para renovar token
router.post('/auth/refresh', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Obtener datos del usuario desde PostgreSQL
    const user = await Usuario.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    // Crear nuevo token
    const token = jwt.sign({ 
      id: user.id,
      emailVerificado: user.emailVerificado
    }, process.env.JWT_SECRET || "KBewxVc$WSWtCkZ9YvJ!6K", { expiresIn: "1h" });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        firstName: user.nombre,
        lastName: user.apellido,
        email: user.email,
        emailVerificado: user.emailVerificado
      },
    });
  } catch (error) {
    console.error('❌ Error renovando token:', error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Rutas protegidas - Documentos
router.post('/documentos/upload', auth, uploadDoc.single('archivo'), handleMulterError, uploadDocumento);
router.get('/documentos/usuario', auth, getDocumentosByUsuario);
router.get('/documentos/preview/:id', auth, previewDocumento);
router.get('/documentos/download/:id', auth, downloadDocumento);
router.delete('/documentos/:id', auth, deleteDocumento);

// Rutas protegidas - Firmas
router.post('/documentos/sign', auth, signDocument);
router.post('/certificados/validate-password', auth, validateCertificatePassword);
router.get('/documentos/:id', auth, getDocument);
router.get('/documentos/:documentId/signed', auth, downloadSignedDocument);

// Rutas protegidas - Certificados
router.post('/certificados/upload', auth, uploadCert.single('certificado'), uploadCertificado);
router.get('/certificados/usuario', auth, getCertificadosByUsuario);
router.post('/certificados/generate', auth, generateCertificado);
router.post('/certificados/generate-pyhanko', auth, generateCertificatePyHanko);
router.delete('/certificados/:id', auth, deleteCertificado);

// Rutas protegidas - Notificaciones
router.get('/notifications', auth, getNotificaciones);
router.put('/notifications/:id/read', auth, marcarComoLeida);
router.post('/signature-requests', auth, crearSolicitudFirma);
router.post('/signature-requests/:id/accept', auth, aceptarSolicitudFirma);
router.post('/signature-requests/:id/reject', auth, rechazarSolicitudFirma);
router.get('/notifications/stats', auth, getEstadisticasNotificaciones);

// Rutas protegidas - Solicitudes de Firma Múltiple
router.post('/signature-requests/multiple', auth, crearSolicitudFirmaMultiple);
router.get('/signature-requests', auth, obtenerSolicitudesFirma);
router.post('/signature-requests/:id/complete', auth, marcarFirmaCompletada);

// Rutas protegidas - Historial de Firmas
router.get('/signature-history', auth, obtenerHistorialFirmas);
router.get('/signature-stats', auth, obtenerEstadisticasFirmas);

// Ruta para estadísticas generales del usuario
router.get('/user-stats', auth, async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }
    
    // Obtener estadísticas de documentos
    const documentos = await Documento.find({ usuarioId: userId });
    const documentosFirmados = documentos.filter((doc: any) => doc.estado === 'firmado');
    
    // Obtener estadísticas de certificados
    const certificados = await Certificado.find({ usuarioId: userId });
    
    // Obtener estadísticas de solicitudes de firma
    const solicitudesFirma = await SolicitudFirma.find({ 
      $or: [
        { solicitanteId: userId },
        { 'firmantes.usuarioId': userId }
      ]
    });
    
    const solicitudesPendientes = solicitudesFirma.filter((sol: any) => 
      sol.estado === 'activa'
    );
    
    res.json({
      success: true,
      stats: {
        totalDocumentos: documentos.length,
        documentosFirmados: documentosFirmados.length,
        totalCertificados: certificados.length,
        solicitudesPendientes: solicitudesPendientes.length,
        totalSolicitudes: solicitudesFirma.length
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas del usuario:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener estadísticas del usuario' 
    });
  }
});

export default router;
