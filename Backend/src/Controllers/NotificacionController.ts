import type { Request, Response, NextFunction } from 'express';
import Notificacion from '../Models/Notificacion';
import Documento from '../Models/Documento';
import EmailService from '../Services/EmailService';
import Usuario from '../Models/UsuarioPostgres';

// Obtener notificaciones del usuario
export const getNotificaciones = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    
    const notificaciones = await Notificacion.find({ 
      destinatario_id: userId 
    })
    .sort({ fecha_creacion: -1 })
    .limit(50);

    res.json({
      notifications: notificaciones.map(notif => ({
        id: notif._id,
        type: notif.tipo,
        message: notif.mensaje,
        read: notif.leida,
        createdAt: notif.fecha_creacion,
        documentId: notif.documento_id,
        documentName: notif.datos_adicionales?.documento_nombre,
        senderName: notif.datos_adicionales?.remitente_nombre,
        signaturePosition: notif.datos_adicionales?.posicion_firma
      }))
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Marcar notificación como leída
export const marcarComoLeida = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const notificacion = await Notificacion.findOneAndUpdate(
      { _id: id, destinatario_id: userId },
      { 
        leida: true, 
        fecha_lectura: new Date() 
      },
      { new: true }
    );

    if (!notificacion) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    res.json({ message: 'Notificación marcada como leída' });
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Crear solicitud de firma
export const crearSolicitudFirma = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { documentoId, destinatarioEmail, posicionFirma, mensaje } = req.body;
    const remitenteId = (req as any).user.id;

    console.log('🔍 Creando solicitud de firma:', {
      documentoId,
      destinatarioEmail,
      remitenteId,
      posicionFirma
    });

    // Verificar que el documento existe y pertenece al remitente
    const documento = await Documento.findOne({ 
      _id: documentoId, 
      usuario_id: remitenteId 
    });

    if (!documento) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    // Buscar el destinatario por email
    const destinatario = await Usuario.findOne({ 
      where: { email: destinatarioEmail } 
    });

    if (!destinatario) {
      return res.status(404).json({ message: 'Destinatario no encontrado' });
    }

    // Obtener los datos del remitente desde la base de datos
    const remitente = await Usuario.findByPk(remitenteId);
    if (!remitente) {
      return res.status(404).json({ message: 'Remitente no encontrado' });
    }

    const remitenteNombre = `${remitente.nombre} ${remitente.apellido}`;
    console.log('✅ Datos del remitente:', {
      id: remitente.id,
      nombre: remitente.nombre,
      apellido: remitente.apellido,
      nombreCompleto: remitenteNombre
    });

    // Crear la notificación
    const notificacion = new Notificacion({
      tipo: 'signature_request',
      remitente_id: remitenteId,
      destinatario_id: destinatario.id.toString(),
      documento_id: documentoId,
      mensaje: mensaje || `Se te ha solicitado firmar el documento "${documento.nombre_original}"`,
      datos_adicionales: {
        documento_nombre: documento.nombre_original,
        remitente_nombre: remitenteNombre,
        posicion_firma: posicionFirma
      }
    });

    await notificacion.save();

    // Enviar email de notificación
    try {
      const emailService = new EmailService();
      console.log('📧 Enviando email con datos del remitente:', {
        email: destinatarioEmail,
        documento: documento.nombre_original,
        nombre: remitente.nombre,
        apellido: remitente.apellido
      });
      await emailService.sendSignatureRequestEmail(
        destinatarioEmail,
        documento.nombre_original,
        remitente.nombre,
        remitente.apellido
      );
    } catch (emailError) {
      console.error('Error al enviar email de notificación:', emailError);
      // No fallar la operación si el email falla
    }

    res.status(201).json({
      message: 'Solicitud de firma enviada correctamente',
      notificationId: notificacion._id
    });
  } catch (error) {
    console.error('Error al crear solicitud de firma:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Aceptar solicitud de firma
export const aceptarSolicitudFirma = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    console.log('🔍 Aceptando solicitud de firma:', { id, userId });

    // Verificar que la notificación existe y es para este usuario
    const notificacion = await Notificacion.findOne({
      _id: id,
      destinatario_id: userId,
      tipo: 'signature_request'
    });

    if (!notificacion) {
      return res.status(404).json({ message: 'Solicitud de firma no encontrada' });
    }

    // Obtener el documento para devolver más información
    const documento = await Documento.findById(notificacion.documento_id);
    if (!documento) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    // Marcar como leída
    notificacion.leida = true;
    notificacion.fecha_lectura = new Date();
    await notificacion.save();

    // Crear notificación de aceptación para el remitente
    const notificacionAceptacion = new Notificacion({
      tipo: 'signature_completed',
      remitente_id: userId,
      destinatario_id: notificacion.remitente_id,
      documento_id: notificacion.documento_id,
      mensaje: `Tu solicitud de firma para "${documento.nombre_original}" fue aceptada`,
      datos_adicionales: {
        documento_nombre: documento.nombre_original,
        remitente_nombre: notificacion.datos_adicionales?.remitente_nombre,
        posicion_firma: notificacion.datos_adicionales?.posicion_firma
      }
    });

    await notificacionAceptacion.save();

    console.log('✅ Solicitud aceptada, notificación enviada al remitente');

    res.json({
      message: 'Solicitud de firma aceptada',
      document: {
        id: documento._id,
        name: documento.nombre_original,
        path: documento.ruta,
        status: documento.estado
      },
      signaturePosition: notificacion.datos_adicionales?.posicion_firma,
      notificationId: notificacion._id
    });
  } catch (error) {
    console.error('Error al aceptar solicitud de firma:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Rechazar solicitud de firma
export const rechazarSolicitudFirma = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    console.log('🔍 Rechazando solicitud de firma:', { id, userId });

    // Verificar que la notificación existe y es para este usuario
    const notificacion = await Notificacion.findOne({
      _id: id,
      destinatario_id: userId,
      tipo: 'signature_request'
    });

    if (!notificacion) {
      return res.status(404).json({ message: 'Solicitud de firma no encontrada' });
    }

    // Obtener el documento para información adicional
    const documento = await Documento.findById(notificacion.documento_id);
    if (!documento) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    // Marcar como leída
    notificacion.leida = true;
    notificacion.fecha_lectura = new Date();
    await notificacion.save();

    // Enviar notificación al remitente de que fue rechazada
    const notificacionRechazo = new Notificacion({
      tipo: 'system',
      remitente_id: userId,
      destinatario_id: notificacion.remitente_id,
      documento_id: notificacion.documento_id,
      mensaje: `Tu solicitud de firma para "${documento.nombre_original}" fue rechazada`,
      datos_adicionales: {
        documento_nombre: documento.nombre_original,
        remitente_nombre: notificacion.datos_adicionales?.remitente_nombre
      }
    });

    await notificacionRechazo.save();

    console.log('✅ Solicitud rechazada, notificación enviada al remitente');

    res.json({ 
      message: 'Solicitud de firma rechazada',
      documentName: documento.nombre_original
    });
  } catch (error) {
    console.error('Error al rechazar solicitud de firma:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener estadísticas de notificaciones
export const getEstadisticasNotificaciones = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const [total, noLeidas, solicitudesPendientes] = await Promise.all([
      Notificacion.countDocuments({ destinatario_id: userId }),
      Notificacion.countDocuments({ destinatario_id: userId, leida: false }),
      Notificacion.countDocuments({ 
        destinatario_id: userId, 
        tipo: 'signature_request', 
        leida: false 
      })
    ]);

    res.json({
      total,
      noLeidas,
      solicitudesPendientes
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de notificaciones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}; 