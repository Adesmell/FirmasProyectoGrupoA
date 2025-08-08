import { Router } from "express";
import multer from "multer";
import { auth } from "../Middleware/authMiddleware";
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
  deleteCertificado 
} from "../Controllers/CertificadoController";
import { 
  getNotificaciones,
  marcarComoLeida,
  crearSolicitudFirma,
  aceptarSolicitudFirma,
  rechazarSolicitudFirma,
  getEstadisticasNotificaciones
} from "../Controllers/NotificacionController";
import { uploadDoc } from "../Almacenamiento/DocumentosStorage";
import { uploadCert } from "../Almacenamiento/CertificadoStorage";

const router = Router();

// Middleware para manejar errores de multer
const handleMulterError = (error, req, res, next) => {
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
router.delete('/certificados/:id', auth, deleteCertificado);

// Rutas protegidas - Notificaciones
router.get('/notifications', auth, getNotificaciones);
router.put('/notifications/:id/read', auth, marcarComoLeida);
router.post('/signature-requests', auth, crearSolicitudFirma);
router.post('/signature-requests/:id/accept', auth, aceptarSolicitudFirma);
router.post('/signature-requests/:id/reject', auth, rechazarSolicitudFirma);
router.get('/notifications/stats', auth, getEstadisticasNotificaciones);

export default router;
