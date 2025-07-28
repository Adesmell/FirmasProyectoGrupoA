import type { NextFunction, Request, Response } from "express";
import fs from "fs";
import { CertificadoService } from "../Services/CertificadoService";
import path from "path";
import crypto from "crypto";
import os from "os";
import { spawn, execSync } from 'child_process';
import { CAService } from "../Services/CAService.js";
import { fileURLToPath } from "url";
import Certificado from "../Models/Certificado";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const uploadCertificado = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const file = req.file;
    const { password } = req.body;
    
    if (!file) {
      return res.status(400).json({ mensaje: "No se subió ningún archivo" });
    }

    // Verificar que existe usuario autenticado
    if (!req.user || !req.user.id) {
      return res.status(401).json({ mensaje: "Usuario no autenticado" });
    }

    // Log para depuración
    console.log("Usuario autenticado:", req.user);
    console.log("ID de usuario:", req.user.id, "Tipo:", typeof req.user.id);

    // Verificar que el archivo sea de tipo p12
    if (path.extname(file.originalname).toLowerCase() !== ".p12") {
      fs.unlinkSync(file.path);
      return res.status(400).json({ mensaje: "El archivo debe ser de tipo .p12" });
    }

    // Asegurar que el ID de usuario sea una cadena
    const userId = req.user.id.toString();
    console.log("ID de usuario (después de toString):", userId);
    console.log("Tipo de userId:", typeof userId);
    console.log("Usuario completo:", req.user);
    
    // Verificar si ya existe un certificado con el mismo nombre
    try {
      const existingCerts = await CertificadoService.getCertificatesByUserId(userId);
      const duplicateName = existingCerts.find(cert => cert.fileName === file.originalname);
      if (duplicateName) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ 
          mensaje: `Ya tienes un certificado con el nombre '${file.originalname}'. Por favor, renombra el archivo o elimina el certificado existente.` 
        });
      }
    } catch (certError) {
      // Si no encuentra certificados, continúa (es normal para usuarios nuevos)
      console.log("Usuario sin certificados previos o error menor:", certError);
    }

    if (!password) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ mensaje: "Se requiere una contraseña para el certificado" });
    }

    // Detectar si el certificado viene del sistema o es un archivo externo
    const isSystemGenerated = file.originalname.includes('certificado_') && file.originalname.includes('.p12');
    
    console.log('🔍 Analizando certificado...');
    console.log('📁 Ruta del archivo:', file.path);
    console.log('📏 Tamaño del archivo:', fs.statSync(file.path).size, 'bytes');
    console.log('📄 Nombre original:', file.originalname);
    console.log('🏭 Certificado del sistema:', isSystemGenerated ? 'SÍ' : 'NO');
    
    const fileContent = fs.readFileSync(file.path);
    console.log('📄 Contenido del archivo leído:', fileContent.length, 'bytes');
    
    // Verificar que el archivo no esté vacío
    if (fileContent.length === 0) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ mensaje: 'El archivo está vacío' });
    }
    
    // Solo validar contraseña si es un certificado externo
    if (!isSystemGenerated) {
      console.log('🔑 Validando contraseña para certificado externo...');
      console.log('🔑 Contraseña proporcionada:', password ? '***' : 'NO PROPORCIONADA');
      
      if (!password) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ mensaje: 'Se requiere una contraseña para certificados externos' });
      }
      
      // Validar usando OpenSSL (compatible con versión 0.9.8k)
      try {
        console.log('🔄 Validando contraseña con OpenSSL...');
        const { execSync } = require('child_process');
        
        // Comando simple para validar PKCS#12
        const result = execSync(`openssl pkcs12 -info -noout -in "${file.path}" -passin pass:"${password}"`, { 
          stdio: 'pipe',
          encoding: 'utf8'
        });
        
        console.log('✅ Validación con OpenSSL exitosa');
        console.log('📋 Información del certificado:', result.trim());
        
      } catch (opensslError: any) {
        console.error('❌ Error validando contraseña con OpenSSL:', opensslError.message);
        
        // Si OpenSSL falla, verificar si es un problema de formato
        console.log('🔍 Verificando si el archivo es un PKCS#12 válido...');
        
        try {
          // Intentar extraer información básica del archivo
          const basicInfo = execSync(`openssl pkcs12 -info -noout -in "${file.path}"`, { 
            stdio: 'pipe',
            encoding: 'utf8'
          });
          console.log('✅ Archivo PKCS#12 válido, pero contraseña incorrecta');
        } catch (formatError: any) {
          console.log('❌ Archivo no es un PKCS#12 válido');
        }
        
        fs.unlinkSync(file.path);
        return res.status(400).json({ 
          mensaje: 'La contraseña del certificado .p12 es incorrecta',
          error: opensslError.message 
        });
      }
    } else {
      console.log('✅ Certificado del sistema detectado, omitiendo validación de contraseña');
    }

    // Encriptar y guardar en la base de datos
    const certificateId = await CertificadoService.encryptAndStoreCertificate(
      file.path,
      password,
      userId
    );

    res.status(201).json({
      mensaje: "Certificado cargado y encriptado correctamente",
      certificateId,
      certificado: {
        id: certificateId,
        nombre: file.originalname,
        fechaSubida: new Date(),
        emisor: "Sistema de Firma Digital", 
      }
    });
  } catch (error) {
    console.error("Error al subir certificado:", error);

    // Asegurar que el archivo temporal se elimina en caso de error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      mensaje: "Error al procesar el certificado",
      error: (error as Error).message,
    });
  }
};

export const getCertificado = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Verificar que existe usuario autenticado
    if (!req.user || !req.user.id) {
      return res.status(401).json({ mensaje: "Usuario no autenticado" });
    }

    const userId = req.user.id.toString();
    console.log("🔍 Buscando certificados para el usuario ID:", userId);
    console.log("🔍 Tipo de userId:", typeof userId);
    console.log("🔍 Usuario completo:", req.user);
    
    // Buscar certificados del usuario
    const certificados = await CertificadoService.getCertificatesByUserId(userId);
    console.log("📋 Certificados encontrados:", certificados.length);

    if (!certificados || certificados.length === 0) {
      console.log("❌ No se encontraron certificados");
      return res
        .status(200)
        .json({ 
          mensaje: "No se encontraron certificados para este usuario",
          certificados: []
        });
    }

    console.log("✅ Certificados encontrados:", certificados.map(cert => ({
      id: cert.id,
      nombre: cert.fileName,
      fechaSubida: cert.createdAt
    })));

    res.status(200).json({
      mensaje: `Se encontraron ${certificados.length} certificado(s)`,
      certificados: certificados.map(cert => ({
        id: cert.id,
        nombre: cert.fileName,
        alias: cert.alias || cert.fileName,
        fechaSubida: cert.createdAt,
        emisor: cert.issuer || "Sistema de Firma Digital",
        validFrom: cert.validFrom,
        validTo: cert.validTo,
        userId: cert.userId,
        tipo: cert.type
      }))
    });
  } catch (error) {
    console.error("❌ Error al obtener certificado:", error);
    res
      .status(500)
      .json({
        mensaje: "Error al obtener el certificado",
        error: (error as Error).message,
        certificados: []
      });
  }
};

export const generateCertificado = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Verificar que existe usuario autenticado
    if (!req.user || !req.user.id) {
      return res.status(401).json({ mensaje: "Usuario no autenticado" });
    }

    const { commonName, organization, country, email, password, validityDays } = req.body;

    // Validar datos requeridos
    if (!commonName || !email || !password) {
      return res.status(400).json({ 
        mensaje: "Se requieren los campos: commonName, email y password" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        mensaje: "La contraseña debe tener al menos 6 caracteres" 
      });
    }

    const userId = req.user.id.toString();
    
    // Verificar si ya existe un certificado con el mismo nombre
    try {
      const existingCerts = await CertificadoService.getCertificatesByUserId(userId);
      const fileName = `certificado_${commonName.replace(/\s+/g, '_')}.p12`;
      const duplicateName = existingCerts.find(cert => cert.fileName === fileName);
      if (duplicateName) {
        return res.status(400).json({ 
          mensaje: `Ya tienes un certificado con el nombre '${fileName}'. Por favor, usa un nombre diferente.` 
        });
      }
    } catch (certError) {
      // Si no encuentra certificados, continúa (es lo esperado)
      console.log("Usuario sin certificados previos, continuando...");
    }

    // Verificar que el sistema CA esté configurado
    if (!CAService.isCAConfigured()) {
      return res.status(500).json({ 
        mensaje: "Sistema CA no configurado. Contacta al administrador." 
      });
    }

    // Generar certificado firmado por el CA
    let tempDir: string | null = null;
    try {
      console.log('Generando certificado de usuario firmado por CA...');
      
      // Crear directorio temporal
      tempDir = path.join(os.tmpdir(), `user_cert_${crypto.randomUUID()}`);
      fs.mkdirSync(tempDir, { recursive: true });
      
      // Rutas de archivos temporales
      const userKeyPath = path.join(tempDir, 'user.key');
      const userCsrPath = path.join(tempDir, 'user.csr');
      const userCertPath = path.join(tempDir, 'user.crt');
      const userP12Path = path.join(tempDir, 'user.p12');
      
      // 1. Generar clave privada del usuario
      console.log('1. Generando clave privada del usuario...');
      const genKeyProcess = spawn('openssl', [
        'genrsa',
        '-out', userKeyPath,
        '2048'
      ]);

      await new Promise((resolve, reject) => {
        genKeyProcess.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Clave privada generada');
            // Verificar que el archivo se creó
            if (fs.existsSync(userKeyPath)) {
              console.log('✅ Archivo de clave verificado:', userKeyPath);
              resolve(undefined);
            } else {
              reject(new Error('Archivo de clave no encontrado después de generación'));
            }
          } else {
            reject(new Error('Error generando clave privada'));
          }
        });
        genKeyProcess.on('error', reject);
      });

      // 2. Crear archivo de configuración para el CSR
      const csrConfigPath = path.join(tempDir, 'user.cnf');
      const csrConfigContent = `[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = ${country || 'MX'}
ST = Estado de México
L = Ciudad de México
O = ${organization || 'Usuario'}
OU = Usuario
CN = ${commonName}
emailAddress = ${email}

[v3_req]
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = clientAuth, emailProtection
subjectAltName = @alt_names

[alt_names]
DNS.1 = ${commonName}
DNS.2 = localhost
`;

      fs.writeFileSync(csrConfigPath, csrConfigContent);

      // 3. Generar CSR (Certificate Signing Request)
      console.log('2. Generando CSR...');
      const genCsrProcess = spawn('openssl', [
        'req',
        '-new',
        '-key', userKeyPath,
        '-out', userCsrPath,
        '-config', csrConfigPath
      ]);

      await new Promise((resolve, reject) => {
        genCsrProcess.on('close', (code) => {
          if (code === 0) {
            console.log('✅ CSR generado');
            // Verificar que el archivo se creó
            if (fs.existsSync(userCsrPath)) {
              console.log('✅ Archivo CSR verificado:', userCsrPath);
              resolve(undefined);
            } else {
              reject(new Error('Archivo CSR no encontrado después de generación'));
            }
          } else {
            reject(new Error('Error generando CSR'));
          }
        });
        genCsrProcess.on('error', reject);
      });

      // 4. Firmar el CSR con el CA del sistema
      console.log('3. Firmando certificado con CA del sistema...');
      const signCertProcess = spawn('openssl', [
        'x509',
        '-req',
        '-in', userCsrPath,
        '-CA', CAService.getCACertPath(),
        '-CAkey', CAService.getCAKeyPath(),
        '-CAcreateserial',
        '-CAserial', CAService.getCASerialPath(),
        '-out', userCertPath,
        '-days', (validityDays || 365).toString(),
        '-extensions', 'v3_req',
        '-extfile', csrConfigPath
      ]);

      await new Promise((resolve, reject) => {
        signCertProcess.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Certificado firmado por CA');
            // Verificar que el archivo se creó
            if (fs.existsSync(userCertPath)) {
              console.log('✅ Archivo de certificado verificado:', userCertPath);
              resolve(undefined);
            } else {
              reject(new Error('Archivo de certificado no encontrado después de firma'));
            }
          } else {
            reject(new Error('Error firmando certificado'));
          }
        });
        signCertProcess.on('error', reject);
      });

      // 5. Crear archivo P12 con certificado y clave
      console.log('4. Creando archivo P12...');
      console.log('Rutas de archivos:');
      console.log('- userKeyPath:', userKeyPath, 'exists:', fs.existsSync(userKeyPath));
      console.log('- userCertPath:', userCertPath, 'exists:', fs.existsSync(userCertPath));
      console.log('- userP12Path:', userP12Path);
      console.log('- CA cert path:', CAService.getCACertPath(), 'exists:', fs.existsSync(CAService.getCACertPath()));
      
      const createP12Process = spawn('openssl', [
        'pkcs12',
        '-export',
        '-out', userP12Path,
        '-inkey', userKeyPath,
        '-in', userCertPath,
        '-certfile', CAService.getCACertPath(),
        '-passout', `pass:${password}`
      ]);

      await new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';
        
        createP12Process.stdout.on('data', (data) => {
          stdout += data.toString();
          console.log('OpenSSL stdout:', data.toString());
        });
        
        createP12Process.stderr.on('data', (data) => {
          stderr += data.toString();
          console.log('OpenSSL stderr:', data.toString());
        });
        
        createP12Process.on('close', (code) => {
          console.log('OpenSSL process exited with code:', code);
          if (code === 0) {
            console.log('✅ Archivo P12 creado');
            // Verificar que el archivo se creó
            if (fs.existsSync(userP12Path)) {
              console.log('✅ Archivo P12 verificado:', userP12Path);
              const stats = fs.statSync(userP12Path);
              console.log('📊 Tamaño del archivo P12:', stats.size, 'bytes');
              resolve(undefined);
            } else {
              console.error('❌ Archivo P12 no encontrado después de creación');
              reject(new Error('Archivo P12 no encontrado después de creación'));
            }
          } else {
            console.error('❌ Error creando archivo P12. Code:', code);
            console.error('stderr:', stderr);
            reject(new Error(`Error creando archivo P12. Code: ${code}. stderr: ${stderr}`));
          }
        });
        createP12Process.on('error', (error) => {
          console.error('❌ Error ejecutando OpenSSL:', error);
          reject(error);
        });
      });

      // 6. Leer el archivo generado ANTES de guardarlo en la base de datos
      console.log('5. Leyendo archivo P12 para respuesta...');
      const certBuffer = fs.readFileSync(userP12Path);
      
      // 7. NO guardar automáticamente en la base de datos - el usuario decidirá
      // console.log('6. Guardando certificado en base de datos...');
      // const certificateId = await CertificadoService.encryptAndStoreCertificate(
      //   userP12Path,
      //   password,
      //   userId
      // );
      
      // 8. Eliminar el archivo P12 temporal después de usarlo
      if (fs.existsSync(userP12Path)) {
        fs.unlinkSync(userP12Path);
      }
      
      // 9. Limpiar archivos temporales
      fs.rmSync(tempDir, { recursive: true, force: true });
      
      console.log('✅ Certificado de usuario generado exitosamente');
      
      // Enviar el archivo .p12 como respuesta
      res.setHeader('Content-Type', 'application/x-pkcs12');
      res.setHeader('Content-Disposition', `attachment; filename="certificado_${commonName.replace(/\s+/g, '_')}.p12"`);
      res.send(certBuffer);
      
    } catch (error) {
      console.error('Error generando certificado de usuario:', error);
      
      // Limpiar archivos temporales en caso de error
      try {
        if (tempDir && fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      } catch (cleanupError) {
        console.error('Error limpiando archivos temporales:', cleanupError);
      }
      
      res.status(500).json({
        mensaje: "Error al generar el certificado de usuario",
        error: (error as Error).message,
      });
    }

  } catch (error) {
    console.error("Error al generar certificado:", error);
    res.status(500).json({
      mensaje: "Error al generar el certificado",
      error: (error as Error).message,
    });
  }
};

export const deleteCertificado = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Verificar que existe usuario autenticado
    if (!req.user || !req.user.id) {
      return res.status(401).json({ mensaje: "Usuario no autenticado" });
    }

    const { id } = req.params;
    const userId = req.user.id.toString();

    if (!id) {
      return res.status(400).json({ mensaje: "ID de certificado requerido" });
    }

    // Eliminar el certificado
    await CertificadoService.deleteCertificateById(id, userId);

    res.status(200).json({
      mensaje: "Certificado eliminado correctamente"
    });
  } catch (error) {
    console.error("Error al eliminar certificado:", error);
    res.status(500).json({
      mensaje: "Error al eliminar el certificado",
      error: (error as Error).message,
    });
  }
};

// Generar certificado compatible con pyHanko usando OpenSSL
export const generateCertificatePyHanko = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Verificar que existe usuario autenticado
    if (!req.user || !req.user.id) {
      return res.status(401).json({ mensaje: "Usuario no autenticado" });
    }

    const {
      commonName,
      organization,
      organizationalUnit,
      locality,
      state,
      country,
      email,
      password
    } = req.body;

    // Validar campos requeridos
    if (!commonName || !password) {
      return res.status(400).json({ error: 'Nombre común y contraseña son requeridos' });
    }

    // Limpiar y limitar longitud de los campos
    const cleanName = (commonName || 'User').replace(/[^a-zA-Z0-9\s]/g, '').trim().substring(0, 64);
    const cleanOrg = (organization || 'Test Organization').replace(/[^a-zA-Z0-9\s]/g, '').trim().substring(0, 64);
    const cleanOU = (organizationalUnit || 'IT').replace(/[^a-zA-Z0-9\s]/g, '').trim().substring(0, 64);
    const cleanEmail = (email || 'test@example.com').replace(/[^a-zA-Z0-9@.-]/g, '').trim().substring(0, 64);
    const cleanLocality = (locality || 'Guayaquil').replace(/[^a-zA-Z0-9\s]/g, '').trim().substring(0, 64);
    const cleanState = (state || 'Guayas').replace(/[^a-zA-Z0-9\s]/g, '').trim().substring(0, 2);
    const cleanCountry = (country || 'EC').replace(/[^a-zA-Z]/g, '').trim().substring(0, 2);

    const userId = req.user.id.toString();
    let tempDir: string | null = null;

    try {
      // Crear directorio temporal
      tempDir = path.join(os.tmpdir(), `pyhanko_cert_${crypto.randomUUID()}`);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const keyFile = path.join(tempDir, 'user.key');
      const certFile = path.join(tempDir, 'user.crt');
      const p12File = path.join(tempDir, 'user.p12');

      try {
        // Generar clave privada RSA 2048 bits
        console.log('🔑 Generando clave privada RSA...');
        execSync(`openssl genrsa -out "${keyFile}" 2048`, { 
          stdio: 'pipe',
          cwd: tempDir 
        });

        // Crear archivo de configuración para el certificado
        const configContent = `[req]
distinguished_name = req_distinguished_name
prompt = no
req_extensions = v3_req
string_mask = utf8only

[req_distinguished_name]
C = ${cleanCountry}
ST = ${cleanState}
L = ${cleanLocality}
O = ${cleanOrg}
OU = ${cleanOU}
CN = ${cleanName}
emailAddress = ${cleanEmail}

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = 127.0.0.1
`;

        const configFile = path.join(tempDir, 'openssl.conf');
        fs.writeFileSync(configFile, configContent);

        // Generar certificado firmado por la CA
        const caKeyPath = CAService.getCAKeyPath();
        const caCertPath = CAService.getCACertPath();

        console.log('📝 Generando solicitud de certificado...');
        execSync(`openssl req -new -key "${keyFile}" -out "${tempDir}/user.csr" -config "${configFile}"`, { 
          stdio: 'pipe',
          cwd: tempDir 
        });

        console.log('🔐 Firmando certificado con CA...');
        execSync(`openssl x509 -req -in "${tempDir}/user.csr" -CA "${caCertPath}" -CAkey "${caKeyPath}" -CAcreateserial -out "${certFile}" -days 365 -extensions v3_req -extfile "${configFile}"`, { 
          stdio: 'pipe',
          cwd: tempDir 
        });

        // Convertir a PKCS#12
        console.log('📦 Convirtiendo a formato PKCS#12...');
        execSync(`openssl pkcs12 -export -out "${p12File}" -inkey "${keyFile}" -in "${certFile}" -passout pass:"${password}"`, { 
          stdio: 'pipe',
          cwd: tempDir 
        });

        // Verificar que el archivo P12 se creó correctamente
        if (!fs.existsSync(p12File)) {
          throw new Error('No se pudo crear el archivo P12');
        }

        // Leer el archivo P12 para enviarlo como respuesta
        const certBuffer = fs.readFileSync(p12File);

        // NO guardar automáticamente en la base de datos - el usuario decidirá
        // const fileName = `certificado_${cleanName.replace(/\s+/g, '_')}.p12`;
        // const certificateId = await CertificadoService.encryptAndStoreCertificate(
        //   p12File,
        //   password,
        //   userId
        // );

        // Limpiar archivos temporales
        if (tempDir && fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }

        console.log('✅ Certificado compatible con pyHanko generado exitosamente');

        // Enviar el archivo .p12 como respuesta
        const fileName = `certificado_${cleanName.replace(/\s+/g, '_')}.p12`;
        res.setHeader('Content-Type', 'application/x-pkcs12');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(certBuffer);

      } catch (error: any) {
        console.error('Error en el proceso de generación:', error);
        throw new Error(`Error generando certificado: ${error.message}`);
      }

    } catch (error: any) {
      console.error('Error generando certificado compatible con pyHanko:', error);
      
      // Limpiar archivos temporales en caso de error
      if (tempDir && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }

      res.status(500).json({
        mensaje: "Error al generar el certificado compatible con pyHanko",
        error: error.message,
      });
    }

  } catch (error: any) {
    console.error("Error al generar certificado compatible con pyHanko:", error);
    res.status(500).json({
      mensaje: "Error al generar el certificado",
      error: error.message,
    });
  }
};


