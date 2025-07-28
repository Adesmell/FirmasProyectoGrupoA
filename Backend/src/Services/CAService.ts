import fs from "fs";
import path from "path";
import { spawn } from 'child_process';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CAService {
  private static sistemaCAPath = path.join(process.cwd(), "SistemaCA");
  private static caCertPath = path.join(CAService.sistemaCAPath, "ca.crt");
  private static caKeyPath = path.join(CAService.sistemaCAPath, "ca.key");
  private static caSerialPath = path.join(CAService.sistemaCAPath, "ca.srl");

  /**
   * Inicializa el sistema CA creando la carpeta y certificados necesarios
   */
  static async initializeCA(): Promise<void> {
    try {
      console.log("🔧 Inicializando sistema CA...");
      
      // Crear carpeta SistemaCA si no existe
      if (!fs.existsSync(CAService.sistemaCAPath)) {
        console.log("📁 Creando carpeta SistemaCA...");
        fs.mkdirSync(CAService.sistemaCAPath, { recursive: true });
        console.log("✅ Carpeta SistemaCA creada");
      } else {
        console.log("✅ Carpeta SistemaCA encontrada");
      }

      // Verificar si ya existen los certificados CA
      if (!fs.existsSync(CAService.caCertPath) || !fs.existsSync(CAService.caKeyPath)) {
        console.log("🔧 Generando certificados CA...");
        await CAService.generateCACertificates();
      } else {
        console.log("ℹ️ Certificados CA ya existen");
      }

      console.log("✅ Sistema CA inicializado correctamente");
    } catch (error) {
      console.error("❌ Error inicializando sistema CA:", error);
      throw error;
    }
  }

  /**
   * Genera los certificados CA usando OpenSSL
   */
  private static async generateCACertificates(): Promise<void> {
    try {
      console.log("🔧 Generando certificado CA raíz...");
      
      // Generar clave privada CA
      const genKeyProcess = spawn('openssl', [
        'genrsa',
        '-out', CAService.caKeyPath,
        '2048'
      ]);

      await new Promise((resolve, reject) => {
        genKeyProcess.on('close', (code) => {
          if (code === 0) {
            console.log("✅ Clave privada CA generada");
            resolve(undefined);
          } else {
            reject(new Error("Error generando clave privada CA"));
          }
        });
        genKeyProcess.on('error', reject);
      });

      // Crear archivo de configuración para el certificado CA
      const caConfigPath = path.join(CAService.sistemaCAPath, "ca.cnf");
      const caConfigContent = `[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_ca
prompt = no

[req_distinguished_name]
C = MX
ST = Estado de México
L = Ciudad de México
O = Sistema de Firma Digital
OU = Autoridad Certificadora
CN = Sistema CA

[v3_ca]
basicConstraints = CA:TRUE
keyUsage = keyCertSign, cRLSign
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer:always
`;

      fs.writeFileSync(caConfigPath, caConfigContent);

      // Generar certificado CA
      const genCertProcess = spawn('openssl', [
        'req',
        '-new',
        '-x509',
        '-days', '3650',
        '-key', CAService.caKeyPath,
        '-out', CAService.caCertPath,
        '-config', caConfigPath,
        '-extensions', 'v3_ca'
      ]);

      await new Promise((resolve, reject) => {
        genCertProcess.on('close', (code) => {
          if (code === 0) {
            console.log("✅ Certificado CA generado");
            resolve(undefined);
          } else {
            reject(new Error("Error generando certificado CA"));
          }
        });
        genCertProcess.on('error', reject);
      });

      // Crear archivo de serie
      fs.writeFileSync(CAService.caSerialPath, "01");

      // Limpiar archivo de configuración temporal
      if (fs.existsSync(caConfigPath)) {
        fs.unlinkSync(caConfigPath);
      }

      console.log("✅ Certificados CA generados exitosamente");
    } catch (error) {
      console.error("Error en generateCACertificates:", error);
      throw error;
    }
  }

  /**
   * Verifica si el sistema CA está configurado correctamente
   */
  static isCAConfigured(): boolean {
    return fs.existsSync(CAService.caCertPath) && 
           fs.existsSync(CAService.caKeyPath) && 
           fs.existsSync(CAService.caSerialPath);
  }

  /**
   * Obtiene la ruta del certificado CA
   */
  static getCACertPath(): string {
    return CAService.caCertPath;
  }

  /**
   * Obtiene la ruta de la clave privada CA
   */
  static getCAKeyPath(): string {
    return CAService.caKeyPath;
  }

  /**
   * Obtiene la ruta del archivo de serie CA
   */
  static getCASerialPath(): string {
    return CAService.caSerialPath;
  }

  /**
   * Obtiene la ruta de la carpeta SistemaCA
   */
  static getSistemaCAPath(): string {
    return CAService.sistemaCAPath;
  }

  /**
   * Verifica la validez de los certificados CA
   */
  static async validateCACertificates(): Promise<boolean> {
    try {
      if (!CAService.isCAConfigured()) {
        console.log("⚠️ Certificados CA no encontrados");
        return false;
      }

      // Verificar que los archivos no estén vacíos
      const certStats = fs.statSync(CAService.caCertPath);
      const keyStats = fs.statSync(CAService.caKeyPath);
      const serialStats = fs.statSync(CAService.caSerialPath);

      if (certStats.size === 0 || keyStats.size === 0 || serialStats.size === 0) {
        console.log("⚠️ Certificados CA están vacíos");
        return false;
      }

      console.log("✅ Certificados CA válidos");
      return true;
    } catch (error) {
      console.error("❌ Error validando certificados CA:", error);
      return false;
    }
  }
} 