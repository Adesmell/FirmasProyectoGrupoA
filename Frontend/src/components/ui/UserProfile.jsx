import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Shield, FileText, Download, Settings, Edit, X } from 'lucide-react';
import { getToken } from '../services/authService';
import API_CONFIG from '../../config/api.js';

const UserProfile = ({ isOpen, onClose, user }) => {
  const [stats, setStats] = useState({
    documents: 0,
    certificates: 0,
    signedDocuments: 0,
    pendingSignatures: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      fetchUserStats();
    }
  }, [isOpen, user]);

  const fetchUserStats = async () => {
    try {
      setIsLoading(true);
      setError('');

      const token = getToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      // Obtener estadísticas de documentos
      const documentsResponse = await fetch(`${API_CONFIG.BASE_URL}/documentos/usuario`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Obtener estadísticas de certificados
      const certificatesResponse = await fetch(`${API_CONFIG.BASE_URL}/certificados/usuario`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Obtener estadísticas generales del usuario
      const userStatsResponse = await fetch(`${API_CONFIG.BASE_URL}/user-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (documentsResponse.ok && certificatesResponse.ok && userStatsResponse.ok) {
        const documents = await documentsResponse.json();
        const certificates = await certificatesResponse.json();
        const userStats = await userStatsResponse.json();

        setStats({
          documents: userStats.stats?.totalDocumentos || 0,
          certificates: userStats.stats?.totalCertificados || 0,
          signedDocuments: userStats.stats?.documentosFirmados || 0,
          pendingSignatures: userStats.stats?.solicitudesPendientes || 0
        });
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setError('Error al cargar las estadísticas del usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const getStatusBadge = (emailVerificado) => {
    return emailVerificado ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
        Verificado
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></div>
        Pendiente
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Perfil de Usuario</h2>
                <p className="text-gray-600">Información personal y estadísticas</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
              <span className="ml-3 text-gray-600">Cargando información...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">
                <X className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Información Personal */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Personal</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Nombre completo</p>
                        <p className="font-medium text-gray-900">
                          {user?.nombre || user?.firstName} {user?.apellido || user?.lastName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Correo electrónico</p>
                        <p className="font-medium text-gray-900">{user?.email}</p>
                        {getStatusBadge(user?.emailVerificado)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Miembro desde</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(user?.fechaCreacion || user?.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <Shield className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">ID de usuario</p>
                        <p className="font-medium text-gray-900">{user?.id}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Estadísticas del Sistema</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-6 h-6 text-blue-600" />
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{stats.documents}</p>
                          <p className="text-sm text-blue-600">Documentos</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-6 h-6 text-green-600" />
                        <div>
                          <p className="text-2xl font-bold text-green-600">{stats.certificates}</p>
                          <p className="text-sm text-green-600">Certificados</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Download className="w-6 h-6 text-purple-600" />
                        <div>
                          <p className="text-2xl font-bold text-purple-600">{stats.signedDocuments}</p>
                          <p className="text-sm text-purple-600">Documentos firmados</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Settings className="w-6 h-6 text-orange-600" />
                        <div>
                          <p className="text-2xl font-bold text-orange-600">{stats.pendingSignatures}</p>
                          <p className="text-sm text-orange-600">Firmas pendientes</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información Adicional */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Información Adicional</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• Última actividad: {formatDate(user?.lastLogin || user?.ultimaActividad)}</p>
                    <p>• Tipo de cuenta: Usuario estándar</p>
                    <p>• Estado de la cuenta: Activa</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cerrar
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <Edit className="w-4 h-4" />
              <span>Editar Perfil</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 