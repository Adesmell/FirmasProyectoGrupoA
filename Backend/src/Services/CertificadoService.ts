import crypto from "crypto";
import Certificado from "../Models/Certificado";
import mongoose from "mongoose";
import * as fs from "fs";

export class CertificadoService {
  /**
   * Deriva una clave a partir de una contraseña y un salt
   */
  static deriveKey(password: string, salt: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 100000, 32, "sha512", (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey);
      });
    });
  }

  /**
   * Encripta y almacena un certificado P12 (versión simplificada)
   */
  static async encryptAndStoreCertificate(
    filePath: string,
    password: string,
    userId: string
  ): Promise<string> {
    console.log('🔍 encryptAndStoreCertificate llamado con:');
    console.log('  filePath:', filePath);
    console.log('  password:', password ? '***' : 'NO PROPORCIONADA');
    console.log('  userId:', userId);
    console.log('  tipo de userId:', typeof userId);
    
    // Validaciones básicas
    if (!fs.existsSync(filePath)) throw new Error("El archivo .p12 no existe");
    if (!password) throw new Error("La contraseña es requerida");
    if (!userId) throw new Error("ID de usuario inválido");

    // Verificar si ya existe un certificado con el mismo nombre para este usuario
    const fileName = filePath.split('/').pop() || filePath.split('\\').pop();
    const existingCertificate = await Certificado.findOne({ userId, fileName });
    if (existingCertificate) throw new Error(`Ya existe un certificado con el nombre '${fileName}' para este usuario`);

    // Leer archivo del certificado
    const fileContent = fs.readFileSync(filePath);

    // Para certificados del sistema, no encriptar
    const isSystemGenerated = fileName?.includes('certificado_') && fileName?.includes('.p12');
    
    if (isSystemGenerated) {
      // Guardar sin encriptar para certificados del sistema
      const certificate = new Certificado({
        userId: userId,
        fileName: fileName,
        certificateData: fileContent, // Sin encriptar
        type: "p12",
        esCertificadoSistema: true, // Marcar como certificado del sistema
        alias: fileName?.replace('.p12', '') || 'Certificado del Sistema', // Usar el nombre del archivo como alias
        issuer: "Sistema de Firma Digital",
        validFrom: new Date(),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
      });

      const savedCertificate = await certificate.save() as mongoose.Document & {
        _id: mongoose.Types.ObjectId;
      };
      
      console.log('✅ Archivo .p12 almacenado sin encriptar (certificado del sistema)');
      return savedCertificate._id.toString();
    } else {
      // Encriptar solo para certificados externos
      const salt = crypto.randomBytes(16);
      const iv = crypto.randomBytes(16);
      const key = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha512");
      const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
      
      let encryptedData = cipher.update(fileContent);
      encryptedData = Buffer.concat([encryptedData, cipher.final()]);

      const certificate = new Certificado({
        userId: userId,
        fileName: fileName,
        encryptionSalt: salt.toString("hex"),
        encryptionIV: iv.toString("hex"),
        certificateData: encryptedData,
        type: "p12",
      });

      const savedCertificate = await certificate.save() as mongoose.Document & {
        _id: mongoose.Types.ObjectId;
      };
      
      console.log('✅ Archivo .p12 cifrado y almacenado con éxito');
      return savedCertificate._id.toString();
    }
  }

  /**
   * Desencripta y recupera un certificado (versión simplificada)
   */
  static async decryptAndRetrieveCertificate(certificateId: string, password: string, outputPath: string): Promise<void> {
    // Buscar el certificado
    const certificate = await Certificado.findById(certificateId);
    if (!certificate) throw new Error('Certificado no encontrado');

    // Si no tiene salt/IV, es un certificado del sistema (sin encriptar)
    if (!certificate.encryptionSalt || !certificate.encryptionIV) {
      fs.writeFileSync(outputPath, certificate.certificateData);
      return;
    }

    // Desencriptar certificados externos
    const derivedKey = await this.deriveKey(password, certificate.encryptionSalt);
    const iv = Buffer.from(certificate.encryptionIV, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);
    const decrypted = Buffer.concat([
      decipher.update(certificate.certificateData),
      decipher.final()
    ]);

    fs.writeFileSync(outputPath, decrypted);
  }

  /**
   * Desencripta un certificado y retorna el buffer (versión simplificada)
   */
  static async decryptCertificate(certificateId: string, password: string): Promise<Buffer> {
    // Buscar el certificado
    const certificate = await Certificado.findById(certificateId);
    if (!certificate) throw new Error('Certificado no encontrado');

    // Si no tiene salt/IV, es un certificado del sistema (sin encriptar)
    if (!certificate.encryptionSalt || !certificate.encryptionIV) {
      console.log('✅ Certificado del sistema (sin encriptar)');
      return certificate.certificateData;
    }

    console.log('🔐 Desencriptando certificado externo...');
    // Desencriptar certificados externos
    const derivedKey = await this.deriveKey(password, certificate.encryptionSalt);
    const iv = Buffer.from(certificate.encryptionIV, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);
    const decrypted = Buffer.concat([
      decipher.update(certificate.certificateData),
      decipher.final()
    ]);

    return decrypted;
  }

  /**
   * Obtiene todos los certificados de un usuario
   */
  static async getCertificatesByUserId(userId: string) {
    if (!userId) throw new Error("ID de usuario inválido");
  
    try {
      console.log("🔍 Buscando certificados en BD para usuario:", userId);
      const certificates = await Certificado.find({ userId }).sort({ createdAt: -1 });
      console.log("📊 Certificados encontrados en BD:", certificates.length);
      
      const mappedCertificates = certificates.map(cert => ({
        id: cert._id,
        fileName: cert.fileName,
        alias: cert.alias,
        issuer: cert.issuer,
        validFrom: cert.validFrom,
        validTo: cert.validTo,
        createdAt: cert.createdAt,
        userId: cert.userId,
        type: cert.type
      }));
      
      console.log("📋 Certificados mapeados:", mappedCertificates.map(cert => ({
        id: cert.id,
        fileName: cert.fileName,
        createdAt: cert.createdAt
      })));
      
      return mappedCertificates;
    } catch (error) {
      console.error("❌ Error al buscar certificados:", error);
      throw new Error(`Error al buscar certificados: ${(error as Error).message}`);
    }
  }

  /**
   * Obtiene un certificado específico por ID
   */
  static async getCertificateById(certificateId: string) {
    if (!certificateId) throw new Error("ID de certificado inválido");
  
    try {
      const certificate = await Certificado.findById(certificateId);
      if (!certificate) return null;
      
      return {
        id: certificate._id,
        fileName: certificate.fileName,
        alias: certificate.alias,
        issuer: certificate.issuer,
        validFrom: certificate.validFrom,
        validTo: certificate.validTo,
        createdAt: certificate.createdAt,
        userId: certificate.userId,
        type: certificate.type
      };
    } catch (error) {
      console.error("Error al buscar el certificado:", error);
      throw new Error(`Error al buscar el certificado: ${(error as Error).message}`);
    }
  }

  /**
   * Elimina un certificado por ID
   */
  static async deleteCertificateById(certificateId: string, userId: string) {
    if (!certificateId) throw new Error("ID de certificado inválido");
    if (!userId) throw new Error("ID de usuario inválido");
  
    try {
      const result = await Certificado.findOneAndDelete({ _id: certificateId, userId });
      if (!result) throw new Error("Certificado no encontrado o no pertenece al usuario");
      
      return true;
    } catch (error) {
      console.error("Error al eliminar certificado:", error);
      throw new Error(`Error al eliminar certificado: ${(error as Error).message}`);
    }
  }


}