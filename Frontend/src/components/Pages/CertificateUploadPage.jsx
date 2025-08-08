import React, { useState, useEffect } from 'react';
import { Upload, ArrowLeft, Shield, FileText, Trash2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CertificateUpload from '../certificate/CertificateUpload';
import CertificateList from '../certificate/CertificateList';
import { uploadCertificate, getUserCertificates, deleteCertificate } from '../services/CertificateService';

const CertificateUploadPage = () => {
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

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
      showNotification('error', 'Error al cargar los certificados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCertificateUpload = async (file, password) => {
    try {
      const result = await uploadCertificate(file, password);
      showNotification('success', 'Certificado subido correctamente');
      loadUserCertificates(); // Recargar la lista
    } catch (error) {
      console.error('Error subiendo certificado:', error);
      showNotification('error', error.message || 'Error al subir el certificado');
    }
  };

  const handleDeleteCertificate = async (id) => {
    try {
      await deleteCertificate(id);
      showNotification('success', 'Certificado eliminado correctamente');
      loadUserCertificates(); // Recargar la lista
    } catch (error) {
      console.error('Error eliminando certificado:', error);
      showNotification('error', 'Error al eliminar el certificado');
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
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

        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg ${
            notification.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {notification.message}
          </div>
        )}

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
              <ul className="space-y-2 text-gray-600">
                <li>• Archivos .p12 (PKCS#12)</li>
                <li>• Archivos .pfx (Personal Information Exchange)</li>
                <li>• Certificados con contraseña</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Recomendaciones</h4>
              <ul className="space-y-2 text-gray-600">
                <li>• Mantén tus certificados seguros</li>
                <li>• No compartas tu contraseña</li>
                <li>• Verifica la validez del certificado</li>
                <li>• Respaldos regulares</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateUploadPage; 