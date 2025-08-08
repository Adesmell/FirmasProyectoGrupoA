import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Shield, X, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import CertificateUpload from '../certificate/CertificateUpload';
import CertificateList from '../certificate/CertificateList';
import { uploadCertificate, getUserCertificates, deleteCertificate } from '../services/CertificateService';

const CertificateUploadPage = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [modal, setModal] = useState({ show: false, type: '', title: '', message: '', details: '' });

  useEffect(() => {
    loadUserCertificates();
  }, []);

  const loadUserCertificates = async () => {
    try {
      setIsLoading(true);
      const userCertificates = await getUserCertificates();
      setCertificates(userCertificates);
    } catch (error) {
      console.error('Error cargando certificados:', error);
      showModal('error', 'Error', 'Error al cargar los certificados', 'No se pudieron cargar los certificados del usuario.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCertificateUpload = async (file, password) => {
    try {
      const result = await uploadCertificate(file, password);
      
      // Mostrar modal de éxito
      showModal(
        'success', 
        'Certificado Subido', 
        'El certificado se ha subido correctamente',
        ''
      );
      
      loadUserCertificates(); // Recargar la lista
    } catch (error) {
      console.error('Error subiendo certificado:', error);
      
      // Mostrar modal de error
      let errorTitle = 'Error al Subir Certificado';
      let errorMessage = error.message || 'Error al subir el certificado';
      let errorDetails = '';
      
      // Si es un error específico de contraseña, mostrar mensaje simple
      if (error.tipo === 'error_contraseña') {
        errorTitle = 'Contraseña Incorrecta';
        errorMessage = 'La contraseña del certificado es incorrecta';
        errorDetails = '';
      }
      
      showModal('error', errorTitle, errorMessage, errorDetails);
    }
  };

  const handleDeleteCertificate = async (id) => {
    try {
      await deleteCertificate(id);
      showModal('success', 'Certificado Eliminado', 'Certificado eliminado correctamente', 'El certificado ha sido removido de tu cuenta.');
      loadUserCertificates(); // Recargar la lista
    } catch (error) {
      console.error('Error eliminando certificado:', error);
      showModal('error', 'Error al Eliminar', 'Error al eliminar el certificado', 'No se pudo eliminar el certificado. Inténtalo de nuevo.');
    }
  };

  const showModal = (type, title, message, details) => {
    setModal({ show: true, type, title, message, details });
  };

  const closeModal = () => {
    setModal({ show: false, type: '', title: '', message: '', details: '' });
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
              <div className="p-3 bg-gradient-to-br from-green-600 to-green-700 rounded-xl">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Subir Certificados</h1>
                <p className="text-gray-600">Gestiona tus certificados digitales</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sección de Subida */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Subir Nuevo Certificado</h2>
              <p className="text-gray-600">
                Sube tu certificado digital (.p12, .pfx) para poder firmar documentos
              </p>
            </div>
            
            <CertificateUpload onCertificateUpload={handleCertificateUpload} />
          </div>

          {/* Lista de Certificados */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Mis Certificados</h2>
              <p className="text-gray-600">
                Certificados disponibles para firmar documentos
              </p>
            </div>

            {isLoading ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-3 text-gray-600">Cargando certificados...</p>
              </div>
            ) : certificates.length === 0 ? (
              <div className="text-center py-10">
                <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay certificados</h3>
                <p className="text-gray-500">
                  Sube tu primer certificado digital para comenzar a firmar documentos
                </p>
              </div>
            ) : (
              <CertificateList 
                certificates={certificates} 
                onDelete={handleDeleteCertificate} 
              />
            )}
          </div>
        </div>

        {/* Información Adicional */}
        <div className="mt-8 bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Información sobre Certificados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Formatos Soportados</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Certificados PKCS#12 (.p12)</li>
                <li>• Certificados PFX (.pfx)</li>
                <li>• Máximo 5MB por archivo</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Requisitos</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Contraseña del certificado</li>
                <li>• Certificado válido y no expirado</li>
                <li>• Clave privada incluida</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Notificación */}
      {modal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100 ${
            modal.type === 'success' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
          }`}>
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {modal.type === 'success' ? (
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                ) : (
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-800">{modal.title}</h3>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6">
              <p className={`text-lg font-medium mb-3 ${
                modal.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {modal.message}
              </p>
              
              {modal.details && modal.details.trim() !== '' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Lock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {modal.details}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={closeModal}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  modal.type === 'success'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateUploadPage; 