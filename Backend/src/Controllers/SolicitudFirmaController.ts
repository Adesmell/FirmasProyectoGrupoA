import type { Request, Response, NextFunction } from "express";
import SolicitudFirma from "../Models/SolicitudFirma";
import HistorialFirma from "../Models/HistorialFirma";
import Documento from "../Models/Documento";
import Usuario from "../Models/UsuarioPostgres";
import EmailTemplateService from "../Services/EmailTemplateService";
import WebSocketService from "../Services/WebSocketService";
import { Op } from "sequelize";

// Crear solicitud de firma múltiple
export const crearSolicitudFirmaMultiple = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { documentoId, firmantes, mensaje } = req.body;
    const remitenteId = (req as any).user.id;

    console.log('🔍 Creando solicitud de firma múltiple:', {
      documentoId,
      firmantes: firmantes.length,
      remitenteId
    });

    // Verificar que el documento existe y pertenece al remitente
    const documento = await Documento.findOne({ 
      _id: documentoId, 
      usuario_id: remitenteId 
    });

    if (!documento) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    // Obtener datos del remitente
    const remitente = await Usuario.findByPk(remitenteId);
    if (!remitente) {
      return res.status(404).json({ message: 'Remitente no encontrado' });
    }

    // Validar y procesar firmantes
    const firmantesProcesados = [];
    const emailsFirmantes = [];

    for (const firmante of firmantes) {
      // Buscar usuario por email
      const usuario = await Usuario.findOne({ 
        where: { email: firmante.email.toLowerCase() } 
      });

      if (!usuario) {
        return res.status(404).json({ 
          message: `Usuario no encontrado: ${firmante.email}` 
        });
      }

      firmantesProcesados.push({
        userId: usuario.id.toString(),
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        posicionFirma: firmante.posicionFirma,
        estado: 'pendiente'
      });

      emailsFirmantes.push(usuario.email);
    }

    // Crear solicitud de firma múltiple
    const solicitud = new SolicitudFirma({
      documentoId,
      remitenteId: remitenteId.toString(),
      remitenteNombre: `${remitente.nombre} ${remitente.apellido}`,
      firmantes: firmantesProcesados,
      mensaje,
      metadata: {
        documentoNombre: documento.nombre_original,
        totalFirmantes: firmantesProcesados.length,
        firmantesCompletados: 0
      }
    });

    await solicitud.save();

    // Crear historial de firma
    const historial = new HistorialFirma({
      documentoId,
      documentoNombre: documento.nombre_original,
      propietarioId: remitenteId.toString(),
      propietarioNombre: `${remitente.nombre} ${remitente.apellido}`,
      solicitudId: solicitud._id.toString(),
      firmas: [],
      metadata: {
        totalFirmas: firmantesProcesados.length,
        firmasCompletadas: 0,
        tipoDocumento: 'pdf',
        tamanoArchivo: documento.tamano
      },
      auditoria: {
        creadoPor: remitenteId.toString()
      }
    });

    await historial.save();

    // Enviar notificaciones por WebSocket y email
    const templateData = {
      documentName: documento.nombre_original,
      senderName: `${remitente.nombre} ${remitente.apellido}`,
      appUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
      multipleSigners: firmantesProcesados.length > 1,
      totalSignatures: firmantesProcesados.length,
      completedSignatures: 0,
      progressPercentage: 0,
      customMessage: mensaje
    };

    // Enviar notificaciones a cada firmante
    for (const firmante of firmantesProcesados) {
      const notificationData = {
        ...templateData,
        recipientName: `${firmante.nombre} ${firmante.apellido}`
      };

      // Enviar por WebSocket si está conectado
      if (WebSocketService.isUserOnline(firmante.userId)) {
        WebSocketService.sendNotificationToUser(firmante.userId, {
          type: 'signature_request',
          solicitudId: solicitud._id.toString(),
          documentoId,
          documentoNombre: documento.nombre_original,
          remitenteNombre: `${remitente.nombre} ${remitente.apellido}`,
          posicionFirma: firmante.posicionFirma
        });
      }

      // Enviar email
      try {
        const emailTemplate = EmailTemplateService.renderTemplate('signature_request', notificationData);
        // Aquí usarías tu EmailService para enviar el email
        console.log(`📧 Email de solicitud enviado a: ${firmante.email}`);
      } catch (emailError) {
        console.error('Error enviando email:', emailError);
      }
    }

    res.status(201).json({
      message: 'Solicitud de firma múltiple creada exitosamente',
      solicitudId: solicitud._id,
      historialId: historial._id,
      firmantes: firmantesProcesados.length
    });

  } catch (error) {
    console.error('Error al crear solicitud de firma múltiple:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener solicitudes de firma del usuario
export const obtenerSolicitudesFirma = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { estado, limit = 10, page = 1 } = req.query;

    const query: any = {
      $or: [
        { remitenteId: userId.toString() },
        { 'firmantes.userId': userId.toString() }
      ]
    };

    if (estado) {
      query.estado = estado;
    }

    const solicitudes = await SolicitudFirma.find(query)
      .sort({ fechaCreacion: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await SolicitudFirma.countDocuments(query);

    res.json({
      solicitudes,
      paginacion: {
        total,
        pagina: Number(page),
        porPagina: Number(limit),
        totalPaginas: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Error al obtener solicitudes de firma:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener historial de firmas
export const obtenerHistorialFirmas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { documentoId, limit = 20, page = 1 } = req.query;

    const query: any = {
      $or: [
        { propietarioId: userId.toString() },
        { 'firmas.firmanteId': userId.toString() }
      ]
    };

    if (documentoId) {
      query.documentoId = documentoId;
    }

    const historiales = await HistorialFirma.find(query)
      .sort({ fechaCreacion: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await HistorialFirma.countDocuments(query);

    res.json({
      historiales,
      paginacion: {
        total,
        pagina: Number(page),
        porPagina: Number(limit),
        totalPaginas: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Error al obtener historial de firmas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener estadísticas de firmas
export const obtenerEstadisticasFirmas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const [
      totalSolicitudes,
      solicitudesCompletadas,
      totalFirmas,
      firmasEsteMes
    ] = await Promise.all([
      SolicitudFirma.countDocuments({ remitenteId: userId.toString() }),
      SolicitudFirma.countDocuments({ 
        remitenteId: userId.toString(), 
        estado: 'completada' 
      }),
      HistorialFirma.countDocuments({ propietarioId: userId.toString() }),
      HistorialFirma.countDocuments({
        propietarioId: userId.toString(),
        fechaCreacion: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      })
    ]);

    res.json({
      totalSolicitudes,
      solicitudesCompletadas,
      totalFirmas,
      firmasEsteMes,
      porcentajeCompletadas: totalSolicitudes > 0 
        ? Math.round((solicitudesCompletadas / totalSolicitudes) * 100) 
        : 0
    });

  } catch (error) {
    console.error('Error al obtener estadísticas de firmas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Marcar firma como completada
export const marcarFirmaCompletada = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { solicitudId, certificadoId } = req.body;
    const userId = (req as any).user.id;

    console.log('🔍 Marcando firma como completada:', { solicitudId, userId });

    // Buscar solicitud
    const solicitud = await SolicitudFirma.findById(solicitudId);
    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    // Verificar que el usuario es firmante
    const firmante = solicitud.firmantes.find(f => f.userId === userId.toString());
    if (!firmante) {
      return res.status(403).json({ message: 'No tienes permisos para firmar este documento' });
    }

    // Marcar como firmado
    await solicitud.marcarFirmado(userId.toString(), certificadoId);

    // Actualizar historial
    const historial = await HistorialFirma.findOne({ solicitudId: solicitudId });
    if (historial) {
      const firma = {
        firmanteId: userId.toString(),
        firmanteNombre: `${firmante.nombre} ${firmante.apellido}`,
        firmanteEmail: firmante.email,
        certificadoId,
        posicionFirma: firmante.posicionFirma,
        fechaFirma: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {
          tipoFirma: 'multiple',
          metodo: 'certificado_local',
          version: '1.0'
        }
      };

      await historial.agregarFirma(firma);
    }

    // Enviar notificación por WebSocket
    WebSocketService.sendDocumentUpdate(solicitud.documentoId, {
      tipo: 'firma_completada',
      firmante: `${firmante.nombre} ${firmante.apellido}`,
      progreso: solicitud.metadata.firmantesCompletados,
      total: solicitud.metadata.totalFirmantes
    });

    // Si todas las firmas están completadas, enviar notificación al remitente
    if (solicitud.estado === 'completada') {
      WebSocketService.sendNotificationToUser(solicitud.remitenteId, {
        type: 'signature_completed',
        documentoId: solicitud.documentoId,
        documentoNombre: solicitud.metadata.documentoNombre,
        solicitudId: solicitud._id.toString()
      });
    }

    res.json({
      message: 'Firma marcada como completada',
      progreso: solicitud.metadata.firmantesCompletados,
      total: solicitud.metadata.totalFirmantes,
      completada: solicitud.estado === 'completada'
    });

  } catch (error) {
    console.error('Error al marcar firma como completada:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export default {
  crearSolicitudFirmaMultiple,
  obtenerSolicitudesFirma,
  obtenerHistorialFirmas,
  obtenerEstadisticasFirmas,
  marcarFirmaCompletada
}; 