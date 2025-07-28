import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const emailUser = process.env.EMAIL_USER || 'test@example.com';
    const emailPass = process.env.EMAIL_PASS || 'test-password';
    
    console.log('📧 Configurando EmailService con:', { emailUser, emailPass: emailPass ? '***' : 'undefined' });
    
    // Si no hay credenciales válidas, usar un transporter de prueba
    if (!emailUser || emailUser === 'test@example.com' || !emailPass || emailPass === 'test-password') {
      console.log('⚠️ Usando transporter de prueba (no se enviarán emails reales)');
      this.transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 1025,
        secure: false,
        ignoreTLS: true
      });
    } else {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass
        }
      });
    }
  }

  // Generar token de verificación
  generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Enviar email de verificación
  async sendVerificationEmail(email: string, token: string, nombre: string): Promise<boolean> {
    const verificationUrl = `http://localhost:5173/verify-email?token=${token}`;
    
    console.log('📧 Intentando enviar email de verificación a:', email);
    console.log('🔗 URL de verificación:', verificationUrl);
    
    // Si no hay credenciales válidas, simular envío exitoso
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    
    if (!emailUser || emailUser === 'test@example.com' || !emailPass || emailPass === 'test-password') {
      console.log('✅ Simulando envío de email (modo desarrollo)');
      console.log('📧 Email simulado enviado a:', email);
      console.log('🔗 Token de verificación:', token);
      console.log('🔗 URL completa:', verificationUrl);
      return true;
    }
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verifica tu cuenta - SignatureFlow</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🖋️ SignatureFlow</div>
            <h1>¡Bienvenido a SignatureFlow!</h1>
          </div>
          <div class="content">
            <h2>Hola ${nombre},</h2>
            <p>Gracias por registrarte en <strong>SignatureFlow</strong>, tu plataforma de firmas digitales.</p>
            <p>Para completar tu registro y activar tu cuenta, por favor verifica tu dirección de email haciendo clic en el botón de abajo:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">✅ Verificar mi cuenta</a>
            </div>
            
            <p><strong>¿No puedes hacer clic en el botón?</strong></p>
            <p>Copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px; font-size: 12px;">
              ${verificationUrl}
            </p>
            
            <p><strong>Importante:</strong></p>
            <ul>
              <li>Este enlace expira en 24 horas</li>
              <li>Si no solicitaste esta cuenta, puedes ignorar este email</li>
              <li>Para soporte técnico, contacta a soporte@signatureflow.com</li>
            </ul>
          </div>
          <div class="footer">
            <p>© 2024 SignatureFlow. Todos los derechos reservados.</p>
            <p>Este email fue enviado a ${email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions: EmailOptions = {
      to: email,
      subject: '🖋️ Verifica tu cuenta - SignatureFlow',
      html: html
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de verificación enviado a:', email);
      return true;
    } catch (error) {
      console.error('❌ Error enviando email de verificación:', error);
      return false;
    }
  }

  // Enviar email de bienvenida
  async sendWelcomeEmail(email: string, nombre: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>¡Bienvenido a SignatureFlow!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🖋️ SignatureFlow</div>
            <h1>¡Cuenta verificada exitosamente!</h1>
          </div>
          <div class="content">
            <h2>¡Felicidades ${nombre}!</h2>
            <p>Tu cuenta ha sido verificada exitosamente. Ya puedes comenzar a usar <strong>SignatureFlow</strong> para tus firmas digitales.</p>
            
            <h3>🚀 ¿Qué puedes hacer ahora?</h3>
            <div class="feature">
              <strong>📄 Subir documentos</strong><br>
              Sube tus documentos PDF para firmarlos digitalmente
            </div>
            <div class="feature">
              <strong>🔑 Gestionar certificados</strong><br>
              Sube o genera certificados digitales para firmar
            </div>
            <div class="feature">
              <strong>✍️ Firmar documentos</strong><br>
              Firma tus documentos con certificados válidos
            </div>
            <div class="feature">
              <strong>📥 Descargar firmados</strong><br>
              Descarga tus documentos firmados automáticamente
            </div>
            
            <p><strong>¡Comienza ahora!</strong></p>
            <p>Inicia sesión en tu cuenta y sube tu primer documento para firmar.</p>
          </div>
          <div class="footer">
            <p>© 2024 SignatureFlow. Todos los derechos reservados.</p>
            <p>Gracias por confiar en nosotros para tus firmas digitales.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions: EmailOptions = {
      to: email,
      subject: '🎉 ¡Bienvenido a SignatureFlow! - Cuenta verificada',
      html: html
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de bienvenida enviado a:', email);
      return true;
    } catch (error) {
      console.error('❌ Error enviando email de bienvenida:', error);
      return false;
    }
  }

  // Verificar configuración del transporter
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Configuración de email verificada correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error en configuración de email:', error);
      return false;
    }
  }
}

export default new EmailService(); 