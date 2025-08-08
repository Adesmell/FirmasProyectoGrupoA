import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';

interface UserSocket {
  userId: string;
  socketId: string;
}

class WebSocketService {
  private io: SocketIOServer | null = null;
  private userSockets: Map<string, string> = new Map(); // userId -> socketId
  private socketUsers: Map<string, string> = new Map(); // socketId -> userId

  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
      }
    });

    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "tu_clave_secreta_muy_segura_para_jwt_2024") as any;
        socket.data.userId = decoded.id;
        next();
      } catch (error) {
        return next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      const userId = socket.data.userId;
      
      console.log('🔌 Usuario conectado a WebSocket:', userId);
      
      // Guardar la relación usuario-socket
      this.userSockets.set(userId, socket.id);
      this.socketUsers.set(socket.id, userId);

      // Unir al usuario a su sala personal
      socket.join(`user_${userId}`);

      socket.on('disconnect', () => {
        console.log('🔌 Usuario desconectado de WebSocket:', userId);
        this.userSockets.delete(userId);
        this.socketUsers.delete(socket.id);
      });

      // Manejar eventos específicos
      socket.on('join_document_room', (documentId: string) => {
        socket.join(`document_${documentId}`);
        console.log(`📄 Usuario ${userId} se unió a la sala del documento ${documentId}`);
      });

      socket.on('leave_document_room', (documentId: string) => {
        socket.leave(`document_${documentId}`);
        console.log(`📄 Usuario ${userId} salió de la sala del documento ${documentId}`);
      });
    });

    console.log('✅ WebSocket Service inicializado correctamente');
  }

  // Enviar notificación a un usuario específico
  sendNotificationToUser(userId: string, notification: any) {
    if (!this.io) {
      console.warn('⚠️ WebSocket no inicializado');
      return;
    }

    this.io.to(`user_${userId}`).emit('new_notification', notification);
    console.log(`📨 Notificación enviada a usuario ${userId}:`, notification.type);
  }

  // Enviar notificación a múltiples usuarios
  sendNotificationToUsers(userIds: string[], notification: any) {
    if (!this.io) {
      console.warn('⚠️ WebSocket no inicializado');
      return;
    }

    userIds.forEach(userId => {
      this.io!.to(`user_${userId}`).emit('new_notification', notification);
    });
    
    console.log(`📨 Notificación enviada a ${userIds.length} usuarios:`, notification.type);
  }

  // Enviar actualización de documento a todos los usuarios en la sala del documento
  sendDocumentUpdate(documentId: string, update: any) {
    if (!this.io) {
      console.warn('⚠️ WebSocket no inicializado');
      return;
    }

    this.io.to(`document_${documentId}`).emit('document_updated', {
      documentId,
      ...update
    });
    
    console.log(`📄 Actualización de documento enviada para ${documentId}`);
  }

  // Enviar notificación de firma completada
  sendSignatureCompleted(documentId: string, signerId: string, documentName: string) {
    if (!this.io) {
      console.warn('⚠️ WebSocket no inicializado');
      return;
    }

    this.io.to(`document_${documentId}`).emit('signature_completed', {
      documentId,
      signerId,
      documentName,
      timestamp: new Date()
    });
    
    console.log(`✅ Notificación de firma completada enviada para documento ${documentId}`);
  }

  // Verificar si un usuario está conectado
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  // Obtener estadísticas de conexiones
  getConnectionStats() {
    return {
      totalConnections: this.io?.sockets.sockets.size || 0,
      activeUsers: this.userSockets.size,
      userSockets: Array.from(this.userSockets.entries())
    };
  }
}

export default new WebSocketService(); 