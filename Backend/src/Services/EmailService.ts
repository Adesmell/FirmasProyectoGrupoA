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

  // Generar token de restablecimiento de contraseña
  generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Enviar email de restablecimiento de contraseña
  async sendPasswordResetEmail(email: string, token: string, nombre: string): Promise<boolean> {
    const resetUrl = `http://localhost:5173/reset-password?token=${token}`;
    
    console.log('📧 Intentando enviar email de restablecimiento a:', email);
    console.log('🔗 URL de restablecimiento:', resetUrl);
    
    // Si no hay credenciales válidas, simular envío exitoso
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    
    if (!emailUser || emailUser === 'test@example.com' || !emailPass || emailPass === 'test-password') {
      console.log('✅ Simulando envío de email de restablecimiento (modo desarrollo)');
      console.log('📧 Email simulado enviado a:', email);
      console.log('🔗 Token de restablecimiento:', token);
      console.log('🔗 URL completa:', resetUrl);
      return true;
    }
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Restablece tu contraseña - SignatureFlow</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🖋️ SignatureFlow</div>
            <h1>Restablece tu contraseña</h1>
          </div>
          <div class="content">
            <h2>Hola ${nombre},</h2>
            <p>Has solicitado restablecer tu contraseña en <strong>SignatureFlow</strong>.</p>
            <p>Para crear una nueva contraseña, haz clic en el botón de abajo:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">🔐 Restablecer contraseña</a>
            </div>
            
            <p><strong>¿No puedes hacer clic en el botón?</strong></p>
            <p>Copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px; font-size: 12px;">
              ${resetUrl}
            </p>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul>
                <li>Este enlace expira en 1 hora</li>
                <li>Si no solicitaste este cambio, ignora este email</li>
                <li>Tu contraseña actual seguirá funcionando hasta que la cambies</li>
              </ul>
            </div>
            
            <p><strong>¿No solicitaste este cambio?</strong></p>
            <p>Si no fuiste tú quien solicitó restablecer la contraseña, puedes ignorar este email de forma segura. Tu cuenta permanecerá protegida.</p>
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
      subject: '🔐 Restablece tu contraseña - SignatureFlow',
      html: html
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de restablecimiento enviado a:', email);
      return true;
    } catch (error) {
      console.error('❌ Error enviando email de restablecimiento:', error);
      return false;
    }
  }

  // Enviar email de confirmación de cambio de contraseña
  async sendPasswordChangedEmail(email: string, nombre: string): Promise<boolean> {
    console.log('📧 Intentando enviar email de cambio de contraseña a:', email);
    
    // Si no hay credenciales válidas, simular envío exitoso
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    
    if (!emailUser || emailUser === 'test@example.com' || !emailPass || emailPass === 'test-password') {
      console.log('✅ Simulando envío de email de cambio de contraseña (modo desarrollo)');
      console.log('📧 Email simulado enviado a:', email);
      return true;
    }
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Contraseña actualizada - SignatureFlow</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🖋️ SignatureFlow</div>
            <h1>Contraseña actualizada</h1>
          </div>
          <div class="content">
            <h2>Hola ${nombre},</h2>
            <div class="alert">
              <strong>✅ Tu contraseña ha sido actualizada exitosamente</strong>
            </div>
            <p>Tu contraseña en <strong>SignatureFlow</strong> ha sido cambiada recientemente.</p>
            <p>Si no fuiste tú quien realizó este cambio, por favor contacta inmediatamente con nuestro equipo de soporte.</p>
            <p>Para mantener tu cuenta segura, te recomendamos:</p>
            <ul>
              <li>Usar una contraseña única y segura</li>
              <li>No compartir tus credenciales con nadie</li>
              <li>Activar la autenticación de dos factores si está disponible</li>
            </ul>
            <p>Gracias por usar <strong>SignatureFlow</strong>.</p>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            <p>&copy; 2024 SignatureFlow. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Contraseña actualizada - SignatureFlow',
        html: html
      });
      
      console.log('✅ Email de cambio de contraseña enviado exitosamente a:', email);
      return true;
    } catch (error) {
      console.error('❌ Error al enviar email de cambio de contraseña:', error);
      return false;
    }
  }

  // Enviar email de solicitud de firma
  async sendSignatureRequestEmail(email: string, documentName: string, senderFirstName: string, senderLastName: string): Promise<boolean> {
    console.log('📧 Intentando enviar email de solicitud de firma a:', email);
    
    // Si no hay credenciales válidas, simular envío exitoso
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    
    if (!emailUser || emailUser === 'test@example.com' || !emailPass || emailPass === 'test-password') {
      console.log('✅ Simulando envío de email de solicitud de firma (modo desarrollo)');
      console.log('📧 Email simulado enviado a:', email);
      console.log('📄 Documento:', documentName);
      console.log('👤 Remitente:', `${senderFirstName} ${senderLastName}`);
      return true;
    }
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Solicitud de firma - SignatureFlow</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .request-box { background: #e3f2fd; border: 1px solid #2196f3; color: #0d47a1; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🖋️ SignatureFlow</div>
            <h1>Nueva solicitud de firma</h1>
          </div>
          <div class="content">
            <h2>Hola,</h2>
            <div class="request-box">
              <strong>${senderFirstName} ${senderLastName}</strong> te ha solicitado firmar el documento:
              <br><strong>"${documentName}"</strong>
            </div>
            <p>Para revisar y firmar este documento, accede a tu cuenta de SignatureFlow.</p>
            
            <div style="text-align: center;">
              <a href="http://localhost:5173/principal" class="button">📋 Ver solicitud de firma</a>
            </div>
            
            <p><strong>¿Qué debes hacer?</strong></p>
            <ol>
              <li>Inicia sesión en tu cuenta de SignatureFlow</li>
              <li>Revisa la notificación en el panel de notificaciones</li>
              <li>Revisa el documento y firma en la posición indicada</li>
              <li>Confirma la firma</li>
            </ol>
            
            <p><strong>Importante:</strong> Esta solicitud tiene un tiempo límite. Por favor, responde lo antes posible.</p>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            <p>&copy; 2024 SignatureFlow. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Solicitud de firma: ${documentName} - SignatureFlow`,
        html: html
      });
      
      console.log('✅ Email de solicitud de firma enviado exitosamente a:', email);
      return true;
    } catch (error) {
      console.error('❌ Error al enviar email de solicitud de firma:', error);
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

export { EmailService };
export default EmailService; 