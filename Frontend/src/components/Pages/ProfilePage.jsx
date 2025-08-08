import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Shield, FileText, Download, Settings, ArrowLeft } from 'lucide-react';
import { getToken } from '../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API_CONFIG from '../../config/api.js';

const ProfilePage = () => {
  const [stats, setStats] = useState({
    documents: 0,
    certificates: 0,
    signedDocuments: 0,
    pendingSignatures: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      fetchUserStats();
    }
  }, [currentUser]);

  const fetchUserStats = async () => {
    try {
      setIsLoading(true);
      setError('');

      const token = getToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      // Obtener estadísticas generales del usuario
      const userStatsResponse = await fetch(`${API_CONFIG.BASE_URL}/user-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (userStatsResponse.ok) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/principal')}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Mi Perfil</h1>
                <p className="text-gray-600">Información personal y estadísticas</p>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <span className="ml-4 text-gray-600 text-lg">Cargando información...</span>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="text-red-500 mb-4">
              <Shield className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Error</h3>
            <p className="text-gray-600">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Información Personal */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Información Personal</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <User className="w-6 h-6 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Nombre completo</p>
                      <p className="font-medium text-gray-900 text-lg">
                        {currentUser?.nombre || currentUser?.firstName} {currentUser?.apellido || currentUser?.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <Mail className="w-6 h-6 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Correo electrónico</p>
                      <p className="font-medium text-gray-900 text-lg">{currentUser?.email}</p>
                      <div className="mt-2">
                        {getStatusBadge(currentUser?.emailVerificado)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <Calendar className="w-6 h-6 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Miembro desde</p>
                      <p className="font-medium text-gray-900 text-lg">
                        {formatDate(currentUser?.fechaCreacion || currentUser?.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <Shield className="w-6 h-6 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">ID de usuario</p>
                      <p className="font-medium text-gray-900 text-lg">{currentUser?.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Estadísticas del Sistema</h2>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-blue-50 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-3xl font-bold text-blue-600">{stats.documents}</p>
                        <p className="text-sm text-blue-600 font-medium">Documentos</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-green-50 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <Shield className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-3xl font-bold text-green-600">{stats.certificates}</p>
                        <p className="text-sm text-green-600 font-medium">Certificados</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-purple-50 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <Download className="w-8 h-8 text-purple-600" />
                      <div>
                        <p className="text-3xl font-bold text-purple-600">{stats.signedDocuments}</p>
                        <p className="text-sm text-purple-600 font-medium">Documentos firmados</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-orange-50 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <Settings className="w-8 h-8 text-orange-600" />
                      <div>
                        <p className="text-3xl font-bold text-orange-600">{stats.pendingSignatures}</p>
                        <p className="text-sm text-orange-600 font-medium">Firmas pendientes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información Adicional */}
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Información Adicional</h3>
                <div className="space-y-3 text-gray-600">
                  <p>• Última actividad: {formatDate(currentUser?.lastLogin || currentUser?.ultimaActividad)}</p>
                  <p>• Tipo de cuenta: Usuario estándar</p>
                  <p>• Estado de la cuenta: Activa</p>
                  <p>• Plan actual: Gratuito</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage; 