import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Clock, User } from 'lucide-react';
import { getToken } from '../services/authService';
import API_CONFIG from '../../config/api.js';

const NotificationBell = ({ onAcceptSignature }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Función para cargar notificaciones
  const fetchNotifications = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_CONFIG.BASE_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.filter(n => !n.read).length || 0);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    }
  };

  // Función para cargar vista previa del documento
  const loadDocumentPreview = async (documentId) => {
    try {
      setIsLoadingPreview(true);
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_CONFIG.BASE_URL}/documentos/preview/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPreviewDocument({ url, documentId });
      } else {
        console.error('Error al cargar vista previa del documento');
      }
    } catch (error) {
      console.error('Error al cargar vista previa:', error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Función para cerrar vista previa
  const closePreview = () => {
    if (previewDocument?.url) {
      URL.revokeObjectURL(previewDocument.url);
    }
    setPreviewDocument(null);
  };

  // Función para marcar notificación como leída
  const markAsRead = async (notificationId) => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_CONFIG.BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  };

  // Función para aceptar solicitud de firma
  const acceptSignatureRequest = async (notificationId, documentId) => {
    try {
      const token = getToken();
      if (!token) return;

      console.log('🔍 Aceptando solicitud de firma:', { notificationId, documentId });

      const response = await fetch(`${API_CONFIG.BASE_URL}/signature-requests/${notificationId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Solicitud aceptada:', result);

        // Remover la notificación de la lista
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Cerrar el panel de notificaciones y la vista previa
        setIsOpen(false);
        closePreview();

        // Llamar al callback para abrir el modal de firma
        if (onAcceptSignature && result.document) {
          onAcceptSignature({
            id: result.document.id,
            name: result.document.name,
            path: result.document.path,
            status: result.document.status,
            signaturePosition: result.signaturePosition
          });
        }
      }
    } catch (error) {
      console.error('Error al aceptar solicitud de firma:', error);
    }
  };

  // Función para ver documento antes de aceptar
  const viewDocumentBeforeAccept = async (documentId) => {
    await loadDocumentPreview(documentId);
  };

  // Función para rechazar solicitud de firma
  const rejectSignatureRequest = async (notificationId) => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_CONFIG.BASE_URL}/signature-requests/${notificationId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remover la notificación de la lista
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error al rechazar solicitud de firma:', error);
    }
  };

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    fetchNotifications();
    
    // Polling cada 30 segundos para nuevas notificaciones
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => {
      clearInterval(interval);
      // Limpiar URL del blob al desmontar
      if (previewDocument?.url) {
        URL.revokeObjectURL(previewDocument.url);
      }
    };
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'signature_request':
        return <User className="w-4 h-4 text-blue-500" />;
      case 'signature_completed':
        return <Check className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case 'signature_request':
        return `${notification.senderName} te ha solicitado firmar "${notification.documentName}"`;
      case 'signature_completed':
        return `Documento "${notification.documentName}" ha sido firmado`;
      default:
        return notification.message;
    }
  };

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Notificaciones</h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  closePreview();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No hay notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 font-medium">
                          {getNotificationText(notification)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                        
                        {/* Botones de acción para solicitudes de firma */}
                        {notification.type === 'signature_request' && !notification.read && (
                          <div className="flex space-x-2 mt-3">
                            <button
                              onClick={() => viewDocumentBeforeAccept(notification.documentId)}
                              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                            >
                              Ver documento
                            </button>
                            <button
                              onClick={() => acceptSignatureRequest(notification.id, notification.documentId)}
                              className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                            >
                              Aceptar
                            </button>
                            <button
                              onClick={() => rejectSignatureRequest(notification.id)}
                              className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vista previa del documento */}
          {previewDocument && (
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-800">Vista previa del documento</h4>
                <button
                  onClick={closePreview}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {isLoadingPreview ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                  <span className="ml-2 text-sm text-gray-600">Cargando documento...</span>
                </div>
              ) : (
                <div className="relative h-64 border border-gray-300 rounded-lg overflow-hidden">
                  <iframe
                    src={previewDocument.url}
                    title="Vista previa del documento"
                    className="w-full h-full"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 