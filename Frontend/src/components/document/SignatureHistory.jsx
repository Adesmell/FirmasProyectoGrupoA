import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, User, FileText, Calendar, Download, Eye } from 'lucide-react';
import { getToken } from '../services/authService';
import API_CONFIG from '../../config/api.js';

const SignatureHistory = ({ documentId, onClose }) => {
  const [historial, setHistorial] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (documentId) {
      fetchHistorial();
    }
  }, [documentId]);

  const fetchHistorial = async () => {
    try {
      setIsLoading(true);
      setError('');

      const token = getToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/signature-history?documentoId=${documentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar el historial');
      }

      const data = await response.json();
      setHistorial(data.historiales[0] || null);
    } catch (error) {
      console.error('Error cargando historial:', error);
      setError(error.message || 'Error al cargar el historial');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'completada':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'en_proceso':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'cancelada':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (estado) => {
    switch (estado) {
      case 'completada':
        return 'Completada';
      case 'en_proceso':
        return 'En proceso';
      case 'cancelada':
        return 'Cancelada';
      default:
        return 'Desconocido';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressPercentage = () => {
    if (!historial) return 0;
    return Math.round((historial.metadata.firmasCompletadas / historial.metadata.totalFirmas) * 100);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando historial...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!historial) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Sin historial</h3>
            <p className="text-gray-600 mb-4">No se encontró historial de firmas para este documento.</p>
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Historial de Firmas
                </h3>
                <p className="text-sm text-gray-600">
                  {historial.documentoNombre}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Información general */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Propietario</span>
              </div>
              <p className="text-gray-900">{historial.propietarioNombre}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Fecha de creación</span>
              </div>
              <p className="text-gray-900">{formatDate(historial.fechaCreacion)}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                {getStatusIcon(historial.estado)}
                <span className="text-sm font-medium text-gray-700">Estado</span>
              </div>
              <p className="text-gray-900">{getStatusText(historial.estado)}</p>
            </div>
          </div>

          {/* Progreso de firmas */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-md font-semibold text-gray-800">Progreso de firmas</h4>
              <span className="text-sm text-gray-600">
                {historial.metadata.firmasCompletadas} de {historial.metadata.totalFirmas}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {getProgressPercentage()}% completado
            </p>
          </div>

          {/* Lista de firmas */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-800 mb-4">Detalles de las firmas</h4>
            <div className="space-y-3">
              {historial.firmas.map((firma, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {firma.firmanteNombre}
                        </p>
                        <p className="text-sm text-gray-600">{firma.firmanteEmail}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {formatDate(firma.fechaFirma)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Posición: ({firma.posicionFirma.x}, {firma.posicionFirma.y})
                      </p>
                    </div>
                  </div>
                  
                  {firma.certificadoInfo && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        <strong>Certificado:</strong> {firma.certificadoInfo.nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        <strong>Emisor:</strong> {firma.certificadoInfo.emisor}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Auditoría */}
          {historial.auditoria && historial.auditoria.cambios && historial.auditoria.cambios.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-800 mb-4">Actividad reciente</h4>
              <div className="space-y-2">
                {historial.auditoria.cambios.slice(-5).reverse().map((cambio, index) => (
                  <div key={index} className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">{cambio.detalles}</span>
                    <span className="text-gray-400">
                      {formatDate(cambio.fecha)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
            {historial.estado === 'completada' && (
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Descargar documento firmado</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureHistory; 