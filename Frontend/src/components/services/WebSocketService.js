import { io } from 'socket.io-client';
import { getToken } from './authService';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  // Conectar al WebSocket
  connect() {
    if (this.socket && this.isConnected) {
      console.log('🔌 WebSocket ya está conectado');
      return;
    }

    const token = getToken();
    if (!token) {
      console.log('⚠️ No hay token de autenticación para WebSocket');
      return;
    }

    try {
      console.log('🔌 Conectando a WebSocket...');
      
      this.socket = io('http://localhost:3002', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      this.setupEventListeners();
      
    } catch (error) {
      console.error('❌ Error conectando a WebSocket:', error);
    }
  }

  // Configurar listeners de eventos
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket conectado');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Notificar a los listeners
      this.notifyListeners('connected', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket desconectado:', reason);
      this.isConnected = false;
      
      // Notificar a los listeners
      this.notifyListeners('disconnected', { reason });
      
      // Intentar reconectar si no fue una desconexión manual
      if (reason !== 'io client disconnect') {
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión WebSocket:', error);
      this.notifyListeners('error', { error });
    });

    // Eventos específicos de la aplicación
    this.socket.on('new_notification', (notification) => {
      console.log('📨 Nueva notificación recibida:', notification);
      this.notifyListeners('new_notification', notification);
    });

    this.socket.on('document_updated', (update) => {
      console.log('📄 Documento actualizado:', update);
      this.notifyListeners('document_updated', update);
    });

    this.socket.on('signature_completed', (data) => {
      console.log('✅ Firma completada:', data);
      this.notifyListeners('signature_completed', data);
    });
  }

  // Intentar reconectar
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Máximo número de intentos de reconexión alcanzado');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Intentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      if (!this.isConnected) {
        this.connect();
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  // Desconectar
  disconnect() {
    if (this.socket) {
      console.log('🔌 Desconectando WebSocket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Unirse a una sala de documento
  joinDocumentRoom(documentId) {
    if (this.socket && this.isConnected) {
      console.log(`📄 Uniéndose a la sala del documento: ${documentId}`);
      this.socket.emit('join_document_room', documentId);
    }
  }

  // Salir de una sala de documento
  leaveDocumentRoom(documentId) {
    if (this.socket && this.isConnected) {
      console.log(`📄 Saliendo de la sala del documento: ${documentId}`);
      this.socket.emit('leave_document_room', documentId);
    }
  }

  // Agregar listener para un evento
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remover listener
  removeListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Notificar a todos los listeners de un evento
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en listener de ${event}:`, error);
        }
      });
    }
  }

  // Obtener estado de conexión
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }

  // Limpiar todos los listeners
  clearListeners() {
    this.listeners.clear();
  }
}

// Crear instancia singleton
const webSocketService = new WebSocketService();

export default webSocketService; 