interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

interface TemplateData {
  [key: string]: any;
}

class EmailTemplateService {
  private templates: Map<string, EmailTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Plantilla para solicitud de firma
    this.templates.set('signature_request', {
      subject: 'Solicitud de firma: {{documentName}} - SignatureFlow',
      html: `
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
            .progress-bar { background: #e0e0e0; border-radius: 10px; height: 20px; margin: 20px 0; }
            .progress-fill { background: linear-gradient(90deg, #4CAF50, #45a049); height: 100%; border-radius: 10px; transition: width 0.3s; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🖋️ SignatureFlow</div>
              <h1>Nueva solicitud de firma</h1>
            </div>
            <div class="content">
              <h2>Hola {{recipientName}},</h2>
              <div class="request-box">
                <strong>{{senderName}}</strong> te ha solicitado firmar el documento:
                <br><strong>"{{documentName}}"</strong>
              </div>
              
              {{#if multipleSigners}}
              <div style="margin: 20px 0;">
                <h3>📋 Progreso de firmas</h3>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: {{progressPercentage}}%"></div>
                </div>
                <p><strong>{{completedSignatures}} de {{totalSignatures}}</strong> firmas completadas</p>
              </div>
              {{/if}}
              
              <p>Para revisar y firmar este documento, accede a tu cuenta de SignatureFlow.</p>
              
              <div style="text-align: center;">
                <a href="{{appUrl}}/principal" class="button">📋 Ver solicitud de firma</a>
              </div>
              
              <p><strong>¿Qué debes hacer?</strong></p>
              <ol>
                <li>Inicia sesión en tu cuenta de SignatureFlow</li>
                <li>Revisa la notificación en el panel de notificaciones</li>
                <li>Revisa el documento y firma en la posición indicada</li>
                <li>Confirma la firma</li>
              </ol>
              
              {{#if customMessage}}
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <strong>Mensaje personalizado:</strong><br>
                {{customMessage}}
              </div>
              {{/if}}
              
              <p><strong>Importante:</strong> Esta solicitud tiene un tiempo límite. Por favor, responde lo antes posible.</p>
            </div>
            <div class="footer">
              <p>Este es un email automático, por favor no respondas a este mensaje.</p>
              <p>&copy; 2024 SignatureFlow. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    // Plantilla para firma completada
    this.templates.set('signature_completed', {
      subject: 'Firma completada: {{documentName}} - SignatureFlow',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Firma completada - SignatureFlow</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-box { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">✅ SignatureFlow</div>
              <h1>Firma completada</h1>
            </div>
            <div class="content">
              <h2>¡Excelente!</h2>
              <div class="success-box">
                <strong>{{signerName}}</strong> ha firmado exitosamente el documento:
                <br><strong>"{{documentName}}"</strong>
              </div>
              
              {{#if multipleSigners}}
              <div style="margin: 20px 0;">
                <h3>📋 Progreso de firmas</h3>
                <p><strong>{{completedSignatures}} de {{totalSignatures}}</strong> firmas completadas</p>
                {{#if isComplete}}
                <p style="color: #155724; font-weight: bold;">🎉 ¡Todas las firmas han sido completadas!</p>
                {{else}}
                <p>Faltan {{remainingSignatures}} firmas por completar.</p>
                {{/if}}
              </div>
              {{/if}}
              
              <div style="text-align: center;">
                <a href="{{appUrl}}/principal" class="button">📋 Ver documento firmado</a>
              </div>
              
              <p><strong>Detalles de la firma:</strong></p>
              <ul>
                <li><strong>Firmante:</strong> {{signerName}}</li>
                <li><strong>Fecha:</strong> {{signatureDate}}</li>
                <li><strong>Hora:</strong> {{signatureTime}}</li>
                {{#if certificateInfo}}
                <li><strong>Certificado:</strong> {{certificateInfo}}</li>
                {{/if}}
              </ul>
            </div>
            <div class="footer">
              <p>Este es un email automático, por favor no respondas a este mensaje.</p>
              <p>&copy; 2024 SignatureFlow. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    // Plantilla para bienvenida
    this.templates.set('welcome', {
      subject: '¡Bienvenido a SignatureFlow!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Bienvenido - SignatureFlow</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .welcome-box { background: #e8f5e8; border: 1px solid #4CAF50; color: #2e7d32; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🖋️ SignatureFlow</div>
              <h1>¡Bienvenido!</h1>
            </div>
            <div class="content">
              <h2>Hola {{userName}},</h2>
              <div class="welcome-box">
                <strong>¡Tu cuenta ha sido verificada exitosamente!</strong>
                <br>Ya puedes comenzar a usar SignatureFlow para firmar y gestionar documentos digitales.
              </div>
              
              <p><strong>¿Qué puedes hacer con SignatureFlow?</strong></p>
              <ul>
                <li>📄 Subir y gestionar documentos PDF</li>
                <li>🔐 Firmar documentos con certificados digitales</li>
                <li>📧 Solicitar firmas a otros usuarios</li>
                <li>📋 Realizar firmas múltiples</li>
                <li>📊 Seguir el progreso de tus solicitudes</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="{{appUrl}}/principal" class="button">🚀 Comenzar a usar SignatureFlow</a>
              </div>
              
              <p><strong>Próximos pasos:</strong></p>
              <ol>
                <li>Sube tu primer documento</li>
                <li>Configura tu certificado digital</li>
                <li>Realiza tu primera firma</li>
                <li>Invita a otros usuarios a firmar</li>
              </ol>
            </div>
            <div class="footer">
              <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
              <p>&copy; 2024 SignatureFlow. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  }

  // Renderizar plantilla con datos
  renderTemplate(templateName: string, data: TemplateData): EmailTemplate {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Plantilla '${templateName}' no encontrada`);
    }

    const renderedTemplate: EmailTemplate = {
      subject: this.replaceVariables(template.subject, data),
      html: this.replaceVariables(template.html, data)
    };

    if (template.text) {
      renderedTemplate.text = this.replaceVariables(template.text, data);
    }

    return renderedTemplate;
  }

  // Reemplazar variables en el template
  private replaceVariables(content: string, data: TemplateData): string {
    let result = content;

    // Reemplazar variables simples {{variable}}
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(data[key] || ''));
    });

    // Manejar condicionales {{#if variable}}...{{/if}}
    result = this.processConditionals(result, data);

    return result;
  }

  // Procesar condicionales en el template
  private processConditionals(content: string, data: TemplateData): string {
    const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    
    return content.replace(conditionalRegex, (match, condition, content) => {
      if (data[condition]) {
        return content;
      }
      return '';
    });
  }

  // Agregar nueva plantilla
  addTemplate(name: string, template: EmailTemplate) {
    this.templates.set(name, template);
  }

  // Obtener lista de plantillas disponibles
  getAvailableTemplates(): string[] {
    return Array.from(this.templates.keys());
  }
}

export default new EmailTemplateService(); 