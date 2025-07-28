import { Router } from "express";
import { login, register, verifySession, verifyEmail, resendVerificationEmail } from "../Controllers/usercontroller";
import { uploadDocumento, getDocumentosByUsuario, previewDocumento, downloadDocumento, deleteDocumento } from '../Controllers/Documentoscontroller';
import { uploadCertificado, getCertificado, generateCertificado, deleteCertificado, generateCertificatePyHanko } from '../Controllers/CertificadoController';
import { validateCertificatePassword, signDocument, getDocument, downloadSignedDocument } from '../Controllers/DocumentSigningController';
import { uploadDoc } from '../Almacenamiento/DocumentosStorage';
import { uploadCert } from '../Almacenamiento/CertificadoStorage';
import { auth } from '../Middleware/authMiddleware';
const router = Router();

// Rutas públicas
router.post("/login", (req, res) => {
	Promise.resolve(login(req, res)).catch((error) => {
		console.error('Error in login:', error);
		res.status(500).json({ message: 'Error interno del servidor' });
	});
});
router.post("/register", (req, res) => {
	Promise.resolve(register(req, res)).catch((error) => {
		console.error('Error in register:', error);
		res.status(500).json({ message: 'Error interno del servidor' });
	});
});

// Rutas de verificación de email
router.get("/verify-email/:token", (req, res) => {
	Promise.resolve(verifyEmail(req, res)).catch((error) => {
		console.error('Error en verifyEmail:', error);
		res.status(500).json({ message: 'Error interno del servidor' });
	});
});
router.post("/resend-verification", (req, res) => {
	Promise.resolve(resendVerificationEmail(req, res)).catch((error) => {
		console.error('Error en resendVerificationEmail:', error);
		res.status(500).json({ message: 'Error interno del servidor' });
	});
});

// Endpoint temporal para listar usuarios (solo para debugging)
router.get("/users", async (req, res) => {
  try {
    const { UsuariosRepository } = await import('../Repositorio/UsuariosRepository');
    const usuariosRepository = new UsuariosRepository();
    const users = await usuariosRepository.getUsuarios();
    res.json({ 
      count: users.length, 
      users: users.map(u => ({ 
        id: u.id, 
        email: u.email, 
        nombre: u.nombre,
        apellido: u.apellido 
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Rutas protegidas - Documentos
router.post('/documentos/upload', auth, uploadDoc.single('archivo'), uploadDocumento);
router.get('/documentos/usuario', auth, getDocumentosByUsuario);
router.get('/documentos/preview/:id', auth, previewDocumento);
router.get('/documentos/download/:id', auth, downloadDocumento);
router.delete('/documentos/:id', auth, (req, res, next) => {
	Promise.resolve(deleteDocumento(req, res, next)).catch(next);
});

// Rutas de firma de documentos
router.post('/documentos/sign', auth, (req, res, next) => {
	Promise.resolve(signDocument(req, res, next)).catch(next);
});
router.get('/documentos/:id', auth, (req, res, next) => {
	Promise.resolve(getDocument(req, res, next)).catch(next);
});
router.get('/documentos/signed/:documentId/download', auth, (req, res, next) => {
	Promise.resolve(downloadSignedDocument(req, res, next)).catch(next);
});

// Rutas protegidas - Certificados
router.post('/certificados/upload', auth, uploadCert.single('certificado'), (req, res, next) => {
	Promise.resolve(uploadCertificado(req, res, next)).catch(next);
});
router.get('/certificados/usuario', auth, (req, res, next) => {
	Promise.resolve(getCertificado(req, res, next)).catch(next);
});
router.post('/certificados/generate', auth, (req, res, next) => {
	Promise.resolve(generateCertificado(req, res, next)).catch(next);
});

// Ruta para generar certificado compatible con pyHanko
router.post('/certificados/generate-pyhanko', auth, (req, res, next) => {
	Promise.resolve(generateCertificatePyHanko(req, res, next)).catch(next);
});

// Ruta para validar la contraseña de un certificado
router.post('/certificados/validate', auth, (req, res, next) => {
	Promise.resolve(validateCertificatePassword(req, res, next)).catch(next);
});

router.delete('/certificados/:id', auth, (req, res, next) => {
	Promise.resolve(deleteCertificado(req, res, next)).catch(next);
});

router.get('/auth/session', auth, (req, res) => {
	Promise.resolve(verifySession(req, res)).catch((error) => {
		console.error('Error en verifySession:', error);
		res.status(500).json({ message: 'Error interno del servidor' });
	});
});

export default router;
