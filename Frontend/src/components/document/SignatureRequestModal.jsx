import React, { useState, useEffect } from 'react';
import { X, User, FileText, Send, AlertCircle, MapPin, Eye } from 'lucide-react';
import { getToken } from '../services/authService';
import API_CONFIG from '../../config/api.js';

const SignatureRequestModal = ({ isOpen, onClose, document, onRequestSent }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [selectedUsuario, setSelectedUsuario] = useState('');
  const [posicionFirma, setPosicionFirma] = useState({ x: 100, y: 100 });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  // Cargar lista de usuarios al abrir el modal
  useEffect(() => {
    if (isOpen) {
      fetchUsuarios();
      if (document) {
        loadPdfUrl();
      }
    }
  }, [isOpen, document]);

  const loadPdfUrl = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_CONFIG.BASE_URL}/documentos/preview/${document.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      }
    } catch (error) {
      console.error('Error cargando PDF:', error);
    }
  };

  const fetchUsuarios = async () => {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      console.log('🔍 Cargando lista de usuarios...');

      const response = await fetch(`${API_CONFIG.BASE_URL}/usuarios`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }

      const data = await response.json();
      console.log('✅ Datos recibidos del servidor:', data);
      
      const usuariosList = data.usuarios || [];
      console.log('✅ Usuarios cargados:', usuariosList);
      
      setUsuarios(usuariosList);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      setError('Error al cargar la lista de usuarios');
    }
  };

  const handlePdfClick = (event) => {
    const container = event.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convertir coordenadas del contenedor a coordenadas del PDF
    // Asumiendo que el PDF se renderiza en un tamaño estándar
    const scaleX = 800 / rect.width;  // Ancho estándar del PDF
    const scaleY = 600 / rect.height;  // Alto estándar del PDF
    
    const pdfX = Math.round(x * scaleX);
    const pdfY = Math.round(y * scaleY);

    // Asegurar que las coordenadas estén dentro de los límites
    const clampedX = Math.max(0, Math.min(800, pdfX));
    const clampedY = Math.max(0, Math.min(600, pdfY));

    setPosicionFirma({ x: clampedX, y: clampedY });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedUsuario) {
      setError('Por favor, selecciona un destinatario');
      return;
    }

    if (!document) {
      setError('No hay documento seleccionado');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = getToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      console.log('🔍 Usuario seleccionado ID:', selectedUsuario);
      console.log('🔍 Tipo de ID seleccionado:', typeof selectedUsuario);
      console.log('🔍 Usuarios disponibles:', usuarios);
      
      // Convertir a string para comparación consistente
      const selectedUser = usuarios.find(u => String(u.id) === String(selectedUsuario));
      console.log('🔍 Usuario encontrado:', selectedUser);
      
      if (!selectedUser) {
        console.error('❌ Usuario no encontrado. ID buscado:', selectedUsuario);
        console.error('❌ Tipo de ID buscado:', typeof selectedUsuario);
        console.error('❌ Usuarios disponibles:', usuarios.map(u => ({ 
          id: u.id, 
          tipoId: typeof u.id,
          idString: String(u.id),
          nombre: u.nombre, 
          email: u.email 
        })));
        throw new Error('Usuario seleccionado no válido');
      }

      console.log('✅ Enviando solicitud para usuario:', selectedUser);

      const response = await fetch(`${API_CONFIG.BASE_URL}/signature-requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentoId: document.id,
          destinatarioEmail: selectedUser.email,
          posicionFirma: posicionFirma,
          mensaje: message.trim() || `Se te ha solicitado firmar el documento "${document.name}"`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al enviar la solicitud');
      }

      const result = await response.json();
      
      // Limpiar formulario
      setSelectedUsuario('');
      setMessage('');
      setPosicionFirma({ x: 100, y: 100 });
      setShowPdfViewer(false);
      
      // Cerrar modal y notificar
      onClose();
      if (onRequestSent) {
        onRequestSent(result);
      }
      
    } catch (error) {
      console.error('Error al enviar solicitud de firma:', error);
      setError(error.message || 'Error al enviar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUsuario('');
    setMessage('');
    setPosicionFirma({ x: 100, y: 100 });
    setError('');
    setShowPdfViewer(false);
    
    // Limpiar URL del PDF
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl('');
    }
    
    onClose();
  };

  // Limpiar URL del PDF cuando se desmonte el componente
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Solicitar Firma
                </h3>
                <p className="text-sm text-gray-600">
                  Enviar solicitud de firma a otro usuario
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Información del documento */}
          {document && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-800">{document.name}</p>
                  <p className="text-sm text-gray-600">
                    {(document.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulario */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Selector de destinatario */}
                <div>
                  <label htmlFor="selectedUsuario" className="block text-sm font-medium text-gray-700 mb-2">
                    Destinatario
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      id="selectedUsuario"
                      value={selectedUsuario}
                      onChange={(e) => {
                        console.log('🔍 Usuario seleccionado en select:', e.target.value);
                        setSelectedUsuario(e.target.value);
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Selecciona un usuario</option>
                      {usuarios.map((usuario) => (
                        <option key={usuario.id} value={usuario.id}>
                          {usuario.nombre} ({usuario.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Posición de firma */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Posición de firma
                  </label>
                  
                  {/* Botón para mostrar/ocultar visor de PDF */}
                  <div className="mb-3">
                    <button
                      type="button"
                      onClick={() => setShowPdfViewer(!showPdfViewer)}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">
                        {showPdfViewer ? 'Ocultar documento' : 'Ver documento y seleccionar posición'}
                      </span>
                    </button>
                  </div>

                  {/* Campos manuales de posición */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="posicionX" className="block text-xs text-gray-600 mb-1">
                        Posición X
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                        <input
                          type="number"
                          id="posicionX"
                          value={posicionFirma.x}
                          onChange={(e) => setPosicionFirma(prev => ({ ...prev, x: parseInt(e.target.value) || 0 }))}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          min="0"
                          max="800"
                          placeholder="100"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="posicionY" className="block text-xs text-gray-600 mb-1">
                        Posición Y
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                        <input
                          type="number"
                          id="posicionY"
                          value={posicionFirma.y}
                          onChange={(e) => setPosicionFirma(prev => ({ ...prev, y: parseInt(e.target.value) || 0 }))}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          min="0"
                          max="600"
                          placeholder="100"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {showPdfViewer 
                      ? 'Haz clic en el documento para seleccionar la posición, o ajusta manualmente los valores'
                      : 'Coordenadas donde se colocará la firma en el documento'
                    }
                  </p>
                </div>

                {/* Mensaje personalizado */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje (opcional)
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Agrega un mensaje personalizado para el destinatario..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Error message */}
                {error && (
                  <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Botones */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Enviar Solicitud</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Visor de PDF */}
            {showPdfViewer && pdfUrl && (
              <div className="lg:col-span-1">
                <div className="mb-2">
                  <p className="text-sm text-gray-600 mb-2">
                    Haz clic en el documento para seleccionar la posición de la firma:
                  </p>
                  <div className="text-xs text-gray-500">
                    Posición seleccionada: X: {posicionFirma.x}, Y: {posicionFirma.y}
                  </div>
                </div>
                
                <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-white h-96">
                  <iframe
                    src={pdfUrl}
                    title="Documento PDF"
                    className="w-full h-full"
                  />
                  {/* Overlay transparente para capturar clics */}
                  <div
                    className="absolute inset-0 cursor-crosshair"
                    onClick={handlePdfClick}
                    style={{ pointerEvents: 'auto' }}
                  />
                  
                  {/* Marcador de posición */}
                  {posicionFirma.x > 0 && posicionFirma.y > 0 && (
                    <div
                      className="absolute w-4 h-4 bg-red-500 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                      style={{
                        left: `${(posicionFirma.x / 800) * 100}%`,
                        top: `${(posicionFirma.y / 600) * 100}%`
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureRequestModal; 