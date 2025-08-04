import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Op } from "sequelize";
import Usuario from "../Models/UsuarioPostgres";
import EmailService from "../Services/EmailService";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "tu_clave_secreta_muy_segura_para_jwt_2024";

export const register = async (req: Request, res: Response) => {
  try {
    const { nombre, apellido, email, password } = req.body;
    console.log('📝 Registro recibido:', { nombre, apellido, email, password: '***' });

    // Validar campos requeridos
    if (!nombre || !apellido || !email || !password) {
      console.log('❌ Campos faltantes:', { 
        nombre: !nombre, 
        apellido: !apellido, 
        email: !email, 
        password: !password 
      });
      return res.status(400).json({ 
        message: "Todos los campos son requeridos",
        missing: {
          nombre: !nombre,
          apellido: !apellido,
          email: !email,
          password: !password
        }
      });
    }

    // Verificar si el usuario ya existe en PostgreSQL (lógica invertida)
    const existingUser = await Usuario.findOne({ 
      where: { email: email.toLowerCase() } 
    });
    if (!existingUser) {
      console.log('❌ Usuario NO existe en PostgreSQL:', email);
      return res.status(409).json({ message: "El correo electrónico NO está registrado, no puedes usarlo" });
    }
    // Si existe, dejar pasar y continuar con el registro...

    // Validar contraseña
    if (password.length < 8) {
      return res.status(422).json({ message: "La contraseña debe tener al menos 8 caracteres" });
    }

    // Generar token de verificación
    const verificationToken = EmailService.generateVerificationToken();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Encriptar contraseña
    console.log('🔐 Encriptando contraseña...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('✅ Contraseña encriptada exitosamente');

    // Crear nuevo usuario en PostgreSQL
    const newUser = await Usuario.create({
      nombre,
      apellido,
      email: email.toLowerCase(),
      contraseña: hashedPassword,
      emailVerificado: false,
      verificationToken,
      verificationTokenExpires
    });

    console.log('✅ Usuario creado exitosamente en PostgreSQL:', { 
      id: newUser.id, 
      email: newUser.email,
      nombre: newUser.nombre,
      apellido: newUser.apellido,
      emailVerificado: newUser.emailVerificado
    });

    // Enviar email de verificación
    console.log('📧 Enviando email de verificación...');
    const emailSent = await EmailService.sendVerificationEmail(
      newUser.email, 
      verificationToken, 
      newUser.nombre
    );

    if (!emailSent) {
      console.log('⚠️ Error enviando email de verificación, pero usuario creado');
    }

    // Generar token JWT temporal (sin verificación)
    const token = jwt.sign({ 
      id: newUser.id,
      emailVerificado: false
    }, JWT_SECRET, { expiresIn: "1h" });

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente. Por favor verifica tu email para activar tu cuenta.",
      token,
      user: {
        id: newUser.id,
        firstName: newUser.nombre,
        lastName: newUser.apellido,
        email: newUser.email,
        emailVerificado: newUser.emailVerificado
      },
      emailSent
    });
  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    console.log('🔍 Verificando email con token:', token);

    // Buscar usuario con el token en PostgreSQL
    const user = await Usuario.findOne({ 
      where: { 
        verificationToken: token,
        verificationTokenExpires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      console.log('❌ Token inválido o expirado');
      return res.status(400).json({ 
        message: "Token de verificación inválido o expirado" 
      });
    }

    // Verificar si ya está verificado para evitar procesamiento duplicado
    if (user.emailVerificado) {
      console.log('⚠️ Usuario ya verificado:', user.email);
      return res.status(400).json({ 
        message: "El email ya está verificado" 
      });
    }

    // Verificar email
    user.emailVerificado = true;
    user.clearVerificationToken();
    await user.save();

    console.log('✅ Email verificado exitosamente para:', user.email);

    // Enviar email de bienvenida
    await EmailService.sendWelcomeEmail(user.email, user.nombre);

    // Generar nuevo token con email verificado
    const token_jwt = jwt.sign({ 
      id: user.id,
      emailVerificado: true
    }, JWT_SECRET, { expiresIn: "1h" });

    res.json({
      success: true,
      message: "Email verificado exitosamente. ¡Bienvenido a SignatureFlow!",
      token: token_jwt,
      user: {
        id: user.id,
        firstName: user.nombre,
        lastName: user.apellido,
        email: user.email,
        emailVerificado: user.emailVerificado
      }
    });
  } catch (error) {
    console.error('❌ Error verificando email:', error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    console.log('📧 Reenviando email de verificación a:', email);

    const user = await Usuario.findOne({ 
      where: { email: email.toLowerCase() } 
    });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (user.emailVerificado) {
      return res.status(400).json({ message: "El email ya está verificado" });
    }

    // Generar nuevo token
    const verificationToken = EmailService.generateVerificationToken();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();

    // Enviar email
    const emailSent = await EmailService.sendVerificationEmail(
      user.email, 
      verificationToken, 
      user.nombre
    );

    if (emailSent) {
      res.json({ 
        success: true, 
        message: "Email de verificación reenviado exitosamente" 
      });
    } else {
      res.status(500).json({ 
        message: "Error enviando email de verificación" 
      });
    }
  } catch (error) {
    console.error('❌ Error reenviando email:', error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Intento de login:', { email, password: password ? '***' : 'missing' });

    // Buscar usuario en PostgreSQL
    const user = await Usuario.findOne({ 
      where: { email: email.toLowerCase() } 
    });
    console.log('👤 Usuario encontrado:', user ? 'SÍ' : 'NO');
   
    if (!user) {
      console.log('❌ Usuario no encontrado para email:', email);
      return res.status(400).json({ message: "Credenciales inválidas" });
    }

    // Verificar contraseña
    console.log('🔑 Verificando contraseña...');
    const isMatch = await bcrypt.compare(password, user.contraseña);
    console.log('🔑 Contraseña correcta:', isMatch);
    
    if (!isMatch) {
      console.log('❌ Contraseña incorrecta para usuario:', email);
      return res.status(400).json({ message: "Credenciales inválidas" });
    }

    // Verificar si el email está verificado (temporalmente deshabilitado para pruebas)
    if (!user.emailVerificado) {
      console.log('⚠️ Usuario no verificado, pero permitiendo login para pruebas:', email);
      // Comentado temporalmente para pruebas
      // return res.status(403).json({ 
      //   message: "Por favor verifica tu email antes de iniciar sesión",
      //   emailVerificado: false
      // });
    }
    
    // Actualizar último acceso
    user.ultimoAcceso = new Date();
    await user.save();
    
    console.log('✅ Login exitoso para usuario:', email);
    const token = jwt.sign({ 
      id: user.id,
      emailVerificado: user.emailVerificado
    }, JWT_SECRET, { expiresIn: "1h" });

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
    console.error('❌ Error en login:', error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const verifySession = async (req: any, res: Response) => {
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
    }, JWT_SECRET, { expiresIn: "1h" });

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
    console.error('❌ Error verificando sesión:', error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Verificar configuración de email al iniciar
export const testEmailConfig = async () => {
  try {
    const isConnected = await EmailService.verifyConnection();
    if (isConnected) {
      console.log('✅ Configuración de email verificada correctamente');
    } else {
      console.log('❌ Error en configuración de email');
    }
  } catch (error) {
    console.error('❌ Error verificando configuración de email:', error);
  }
};
