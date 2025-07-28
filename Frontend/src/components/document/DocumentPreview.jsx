import React, { useState } from 'react';
import { X, Download, FileText, Image, PenTool } from 'lucide-react';
import { getStoredToken } from '../services/authService';
import API_CONFIG from '../../config/api.js';
import { formatFileSize, formatDate, DocumentStatus } from './types';

const DocumentPreview = ({ document, certificates = [], onClose, onSign }) => {
  const [selectedCertificateId, setSelectedCertificateId] = useState('');
  const [certificatePassword, setCertificatePassword] = useState('');

  if (!document) return null;

  const isPDF = document.type === 'application/pdf';
  const isImage = document.type.startsWith('image/');

  // Función para crear URLs autenticadas
  const createAuthenticatedUrl = (endpoint) => {
    const token = getStoredToken();
    if (token) {
      return `${API_CONFIG.BASE_URL}/documentos/${endpoint}/${document.id}?token=${encodeURIComponent(token)}`;
    }
    return `${API_CONFIG.BASE_URL}/documentos/${endpoint}/${document.id}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden relative">
        {/* Botón de cerrar grande y visible en la esquina superior derecha */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-3 bg-white border-2 border-gray-200 rounded-full shadow-lg text-gray-700 hover:bg-red-500 hover:text-white transition-all duration-200 text-3xl flex items-center justify-center"
          title="Cerrar"
        >
          <X className="w-8 h-8" />
        </button>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              {isImage ? (
                <Image className="w-6 h-6 text-blue-600" />
              ) : (
                <FileText className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{document.name}</h3>
              <p className="text-sm text-gray-500">
                {formatFileSize(document.size)} • Subido el {formatDate(document.uploadDate)}
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 max-h-[70vh] overflow-auto bg-gray-50">
          {isPDF ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full">
              <iframe
                src={createAuthenticatedUrl('preview')}
                className="w-full h-96 rounded-2xl"
                title={`Vista previa de ${document.name}`}
                onError={(e) => {
                  console.error('Error cargando PDF:', e);
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="text-center py-16 hidden">
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 max-w-md mx-auto">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-gray-700 mb-3">Error al cargar PDF</h4>
                  <p className="text-gray-500 mb-6">
                    No se pudo cargar la vista previa del PDF
                  </p>
                  <button 
                    onClick={() => window.open(createAuthenticatedUrl('download'), '_blank')}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl mx-auto transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Download className="w-5 h-5" />
                    <span className="font-medium">Descargar PDF</span>
                  </button>
                </div>
              </div>
            </div>
          ) : isImage ? (
            <div className="text-center">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 inline-block">
                <img
                  src={createAuthenticatedUrl('preview')}
                  alt={document.name}
                  className="max-w-full max-h-96 object-contain rounded-xl"
                  onError={(e) => {
                    console.error('Error cargando imagen:', e);
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="text-center py-8 hidden">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Error al cargar la imagen</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 max-w-md mx-auto">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-700 mb-3">Vista previa no disponible</h4>
                <p className="text-gray-500 mb-6">
                  Este tipo de archivo no se puede previsualizar en el navegador
                </p>
                <button 
                  onClick={() => window.open(createAuthenticatedUrl('download'), '_blank')}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl mx-auto transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Download className="w-5 h-5" />
                  <span className="font-medium">Descargar Archivo</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;