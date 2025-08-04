// Controlador para firma de documentos PDF usando pyhanko
import type { Request, Response, NextFunction } from "express";
import { execSync } from 'child_process';
import tmp from 'tmp';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface IDocumentoWithSigning {
  _id: any;
  nombre_original: string;
  nombre_archivo: string;
  ruta: string;
  tamano: number;
  tipo_archivo: string;
  fecha_subida: Date;
  usuario_id?: string;
  url?: string;
  estado?: string;
  fechaFirma?: Date;
  firmadoPor?: string;
  rutaFirmado?: string;
  datosSignatura?: any;
}

// Función para validar la contraseña del certificado de forma simple
export const validateCertificatePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { certificateId, password } = req.body;
    const userId = (req as any).user.id;

    if (!certificateId) {
      return res.status(400).json({ message: 'ID del certificado es requerido' });
    }

    console.log('🔍 Validando certificado:', certificateId);
    console.log('🔑 Contraseña proporcionada:', password ? 'SÍ' : 'NO');

    // Buscar el certificado
    const Certificado = (await import('../Models/Certificado')).default;
    const certificate = await Certificado.findOne({ _id: certificateId, userId });
    if (!certificate) {
      return res.status(404).json({ message: 'Certificado no encontrado' });
    }

    let tempDir: any = null;
    
    try {
      // Crear directorio temporal para el certificado
      tempDir = tmp.dirSync({ unsafeCleanup: true });
      const tempCertPath = path.join(tempDir.name, 'temp_cert.p12');

      // Obtener datos del certificado
      let certData: Buffer;
      
      // Siempre requerir contraseña para validar cualquier tipo de certificado
      if (!password) {
        return res.status(400).json({ 
          message: 'Se requiere contraseña del certificado para validar',
          valid: false 
        });
      }

      // Verificar si es un certificado del sistema (sin encriptar)
      if (!certificate.encryptionSalt || !certificate.encryptionIV) {
        console.log('✅ Certificado del sistema (sin encriptar)');
        
        // Para certificados del sistema, validar con la contraseña proporcionada
        if (certificate.certificateData && certificate.certificateData.length > 0) {
          // Escribir el certificado del sistema al archivo temporal
          fs.writeFileSync(tempCertPath, certificate.certificateData);
          
          // Validar usando OpenSSL con la contraseña del usuario
          try {
            execSync(`openssl pkcs12 -info -noout -in "${tempCertPath}" -passin pass:"${password}"`, { 
              stdio: 'pipe',
              encoding: 'utf8',
              timeout: 10000
            });

            return res.json({ 
              message: 'Certificado del sistema válido',
              valid: true 
            });
          } catch (opensslError: any) {
            console.error('Error validando certificado del sistema con OpenSSL:', opensslError.message);
            return res.status(400).json({ 
              message: 'Contraseña del certificado incorrecta',
              valid: false 
            });
          }
        } else {
          return res.status(400).json({ 
            message: 'Certificado del sistema inválido',
            valid: false 
          });
        }
      } else {
        console.log('🔐 Certificado externo (encriptado)');
        
        // Desencriptar certificados externos
        const { CertificadoService } = await import('../Services/CertificadoService');
        certData = await CertificadoService.decryptCertificate(certificate._id!.toString(), password);
      }

      fs.writeFileSync(tempCertPath, certData);

      // Validar usando OpenSSL directamente
      try {
        execSync(`openssl pkcs12 -info -noout -in "${tempCertPath}" -passin pass:"${password}"`, { 
          stdio: 'pipe',
          encoding: 'utf8',
          timeout: 10000
        });

        return res.json({ 
          message: 'Contraseña válida',
          valid: true 
        });
      } catch (opensslError: any) {
        console.error('Error validando certificado con OpenSSL:', opensslError.message);
        return res.status(400).json({ 
          message: 'Contraseña del certificado incorrecta',
          valid: false 
        });
      }

    } catch (error) {
      console.error('Error al validar contraseña del certificado:', error);
      return res.status(400).json({ 
        message: 'Contraseña del certificado incorrecta',
        valid: false 
      });
    } finally {
      // Limpiar archivos temporales de forma segura
      if (tempDir) {
        try {
          fs.removeSync(tempDir.name);
        } catch (cleanupError) {
          console.error('Error limpiando archivos temporales:', cleanupError);
        }
      }
    }
  } catch (error) {
    console.error('Error en validación de certificado:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Función para firmar documento de forma simple
export const signDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { documentId, certificateId, password, signaturePosition, qrData } = req.body;
    const userId = (req as any).user.id;

    console.log('🔍 Datos recibidos en signDocument:');
    console.log('  documentId:', documentId);
    console.log('  certificateId:', certificateId);
    console.log('  password:', password ? 'PROVIDED' : 'MISSING');
    console.log('  signaturePosition:', signaturePosition);
    console.log('  userId:', userId);

    if (!documentId || !certificateId || !password) {
      console.log('❌ Validación fallida:');
      console.log('  documentId:', !!documentId);
      console.log('  certificateId:', !!certificateId);
      console.log('  password:', !!password);
      return res.status(400).json({ message: 'Documento, certificado y contraseña son requeridos' });
    }

    // Validar que documentId sea un ObjectId válido
    const mongoose = await import('mongoose');
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      console.log('❌ documentId no es un ObjectId válido:', documentId);
      return res.status(400).json({ message: 'ID de documento inválido' });
    }

    if (!mongoose.Types.ObjectId.isValid(certificateId)) {
      console.log('❌ certificateId no es un ObjectId válido:', certificateId);
      return res.status(400).json({ message: 'ID de certificado inválido' });
    }

    // Buscar documento y certificado
    const Documento = (await import('../Models/Documento')).default;
    const Certificado = (await import('../Models/Certificado')).default;
    
    const document = await Documento.findOne({ _id: documentId, usuario_id: userId });
    const certificate = await Certificado.findOne({ _id: certificateId, userId });

    if (!document) {
      console.log('❌ Documento no encontrado:', { documentId, userId });
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    if (!certificate) {
      console.log('❌ Certificado no encontrado:', { certificateId, userId });
      return res.status(404).json({ message: 'Certificado no encontrado' });
    }

    // Verificar que el documento tenga una ruta válida
    if (!document.ruta) {
      console.log('❌ Documento sin ruta válida:', { documentId, ruta: document.ruta });
      return res.status(400).json({ message: 'El documento no está completamente procesado. Por favor, espera unos segundos y vuelve a intentar.' });
    }

    // Verificar que el archivo del documento exista
    if (!fs.existsSync(document.ruta)) {
      console.log('❌ Archivo de documento no existe:', document.ruta);
      return res.status(404).json({ message: 'El archivo del documento no se encuentra en el servidor' });
    }

    // Crear archivos temporales
    const tempDir = tmp.dirSync({ unsafeCleanup: true });
    const tempPdfInput = path.join(tempDir.name, 'input.pdf');
    const tempPdfOutput = path.join(tempDir.name, 'output.pdf');
    const tempCert = path.join(tempDir.name, 'cert.p12');
    const tempCaCert = path.join(tempDir.name, 'ca.crt');

    try {
      // Copiar archivos
      fs.copyFileSync(document.ruta, tempPdfInput);
      
      // Obtener datos del certificado
      let certData: Buffer;
      
      // Verificar si es un certificado del sistema (sin encriptar)
      if (!certificate.encryptionSalt || !certificate.encryptionIV) {
        console.log('✅ Certificado del sistema (sin encriptar)');
        certData = certificate.certificateData;
      } else {
        console.log('🔐 Certificado externo (encriptado)');
        // Desencriptar certificados externos
        const { CertificadoService } = await import('../Services/CertificadoService');
        certData = await CertificadoService.decryptCertificate(certificate._id!.toString(), password);
      }
      
      fs.writeFileSync(tempCert, certData);
      
      // Copiar certificado CA
      const caCertPath = path.join(__dirname, '../../SistemaCA/ca.crt');
      if (fs.existsSync(caCertPath)) {
        fs.copyFileSync(caCertPath, tempCaCert);
      } else {
        // Crear certificado CA temporal si no existe
        const tempCaKey = path.join(tempDir.name, 'ca.key');
        execSync(`openssl genrsa -out "${tempCaKey}" 2048`, { stdio: 'pipe', cwd: tempDir.name });
        execSync(`openssl req -new -x509 -key "${tempCaKey}" -out "${tempCaCert}" -days 365 -subj "/C=EC/ST=GS/L=Guayaquil/O=Test CA/CN=Test CA"`, { stdio: 'pipe', cwd: tempDir.name });
      }

      // Ejecutar Python con pyHanko
      const pythonScriptPath = path.join(__dirname, '../../API_Pyhanko/firmar-pdf.py');
      const page = signaturePosition?.page || 1;
      const x1 = signaturePosition?.x || 100; //Tamaño del certificado
      const y1 = signaturePosition?.y || 275; //Tamaño del certificado - movido más arriba
      const x2 = signaturePosition?.x2 || 250; //Tamaño del certificado
      const y2 = signaturePosition?.y2 || 250; //Tamaño del certificado - movido más arriba

      const command = `python "${pythonScriptPath}" "${tempCert}" "${password}" "${tempPdfInput}" "${tempPdfOutput}" "${page}" "${x1}" "${y1}" "${x2}" "${y2}" "${tempCaCert}"`;
      
      execSync(command, { 
        stdio: 'pipe',
        encoding: 'utf8',
        timeout: 30000
      });

      // Leer PDF firmado
      const signedPdfBuffer = fs.readFileSync(tempPdfOutput);
      
      // Crear ruta permanente para el archivo firmado
      const uploadsDir = path.join(__dirname, '../../uploads');
      const signedFileName = `firmado-${document.nombre_archivo}`;
      const signedFilePath = path.join(uploadsDir, signedFileName);
      
      // Asegurar que el directorio existe
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Copiar el archivo firmado a ubicación permanente
      fs.copyFileSync(tempPdfOutput, signedFilePath);
      console.log('✅ Archivo firmado guardado en:', signedFilePath);
      
      // Actualizar documento en BD
      document.estado = 'firmado';
      document.fechaFirma = new Date();
      document.firmadoPor = certificate.fileName;
      document.rutaFirmado = signedFilePath;
      await document.save();

      // Enviar respuesta con el PDF firmado como base64
      const pdfBase64 = signedPdfBuffer.toString('base64');
      res.json({ 
        success: true,
        message: 'Documento firmado exitosamente',
        pdfBase64: pdfBase64,
        fileName: `documento-firmado-${document._id}.pdf`
      });

    } catch (error) {
      console.error('Error al firmar documento:', error);
      res.status(500).json({ 
        message: 'Error al firmar el documento',
        error: (error as Error).message 
      });
    } finally {
      // Limpiar archivos temporales
      fs.removeSync(tempDir.name);
    }

  } catch (error) {
    console.error('Error en firma de documento:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};



// Función para obtener documento
export const getDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const Documento = (await import('../Models/Documento')).default;
    const document = await Documento.findOne({ _id: id, usuario_id: userId });

    if (!document) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    res.json(document);
  } catch (error) {
    console.error('Error obteniendo documento:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Función para descargar documento firmado
export const downloadSignedDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { documentId } = req.params;
    const userId = (req as any).user.id;

    console.log('🔍 Descargando documento firmado:');
    console.log('  documentId:', documentId);
    console.log('  userId:', userId);

    const Documento = (await import('../Models/Documento')).default;
    const document = await Documento.findOne({ _id: documentId, usuario_id: userId });

    if (!document) {
      console.log('❌ Documento no encontrado');
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    console.log('✅ Documento encontrado:', {
      id: document._id,
      nombre: document.nombre_original,
      estado: document.estado,
      rutaFirmado: document.rutaFirmado
    });

    if (!document.rutaFirmado || !fs.existsSync(document.rutaFirmado)) {
      console.log('❌ Documento firmado no encontrado en ruta:', document.rutaFirmado);
      return res.status(404).json({ message: 'Documento firmado no encontrado' });
    }

    console.log('✅ Archivo firmado encontrado, enviando...');
    const signedPdfBuffer = fs.readFileSync(document.rutaFirmado);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="documento-firmado.pdf"');
    res.send(signedPdfBuffer);

  } catch (error) {
    console.error('Error descargando documento firmado:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
