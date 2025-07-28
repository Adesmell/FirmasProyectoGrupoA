import { Router } from "express";
import { login, register, verifySession } from "../Controllers/usercontroller";
import { uploadDocumento, getDocumentosByUsuario, previewDocumento, downloadDocumento, deleteDocumento } from '../Controllers/Documentoscontroller';
import { uploadCertificado, getCertificado, generateCertificado, deleteCertificado, generateCertificatePyHanko } from '../Controllers/CertificadoController';
import { validateCertificatePassword, signDocument, getDocument, downloadSignedDocument } from '../Controllers/DocumentSigningController';
import { uploadDoc } from '../Almacenamiento/DocumentosStorage';
import { uploadCert } from '../Almacenamiento/CertificadoStorage';
import { testAuth } from '../Middleware/testAuthMiddleware';
const router = Router();

// Rutas públicas
router.post("/login", login);
router.post("/register", register);

// Rutas protegidas - Documentos (con middleware de prueba)
router.post('/documentos/upload', testAuth, uploadDoc.single('archivo'), uploadDocumento);
router.get('/documentos/usuario', testAuth, getDocumentosByUsuario);
router.get('/documentos/preview/:id', testAuth, previewDocumento);
router.get('/documentos/download/:id', testAuth, downloadDocumento);
router.delete('/documentos/:id', testAuth, (req, res, next) => {
	Promise.resolve(deleteDocumento(req, res, next)).catch(next);
});

// Rutas de firma de documentos (con middleware de prueba)
router.post('/documentos/sign', testAuth, (req, res, next) => {
	Promise.resolve(signDocument(req, res, next)).catch(next);
});
router.get('/documentos/:id', testAuth, (req, res, next) => {
	Promise.resolve(getDocument(req, res, next)).catch(next);
});
router.get('/documentos/signed/:documentId/download', testAuth, (req, res, next) => {
	Promise.resolve(downloadSignedDocument(req, res, next)).catch(next);
});

// Rutas protegidas - Certificados (con middleware de prueba)
router.post('/certificados/upload', testAuth, uploadCert.single('certificado'), (req, res, next) => {
	Promise.resolve(uploadCertificado(req, res, next)).catch(next);
});
router.get('/certificados/usuario', testAuth, (req, res, next) => {
	Promise.resolve(getCertificado(req, res, next)).catch(next);
});
router.post('/certificados/generate', testAuth, (req, res, next) => {
	Promise.resolve(generateCertificado(req, res, next)).catch(next);
});

// Ruta para generar certificado compatible con pyHanko (con middleware de prueba)
router.post('/certificados/generate-pyhanko', testAuth, (req, res, next) => {
	Promise.resolve(generateCertificatePyHanko(req, res, next)).catch(next);
});

// Ruta para validar la contraseña de un certificado (con middleware de prueba)
router.post('/certificados/validate', testAuth, (req, res, next) => {
	Promise.resolve(validateCertificatePassword(req, res, next)).catch(next);
});

// Ruta para validar certificado con pyHanko (con middleware de prueba)


router.delete('/certificados/:id', testAuth, (req, res, next) => {
	Promise.resolve(deleteCertificado(req, res, next)).catch(next);
});

router.get('/auth/session', testAuth, verifySession);

export default router; 