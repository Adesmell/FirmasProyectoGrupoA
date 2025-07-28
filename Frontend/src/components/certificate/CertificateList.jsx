import React from 'react';
import { Shield, CheckCircle2, Trash2, Key, Crown } from 'lucide-react';
import { formatDate } from '../document/types';

const CertificateList = ({ certificates, onDelete }) => {
  if (!certificates || certificates.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">No hay certificados cargados.</div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {certificates.map((certificate) => {
        const fullPath = certificate.nombre || certificate.name || certificate.alias || '';
        const fileName = fullPath.split('\\').pop().split('/').pop();
        return (
          <div key={certificate.id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 w-full break-words">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1 min-w-0">
                <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-lg font-semibold text-gray-800 truncate">
                      {fileName || "Certificado digital"}
                    </h4>
                    {certificate.esCertificadoSistema && (
                      <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                        <Crown className="w-3 h-3" />
                        <span>Sistema</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <span className="font-medium">
                      {certificate.emisor || certificate.issuer || 'Sistema de Firma Digital'}
                    </span>
                    <span>•</span>
                    <span>
                      {certificate.fechaSubida ? 
                        `Subido el ${formatDate(new Date(certificate.fechaSubida))}` : 
                        certificate.createdAt ? 
                        `Creado el ${formatDate(new Date(certificate.createdAt))}` :
                        'Fecha desconocida'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="font-medium">
                      {certificate.esCertificadoSistema ? 'Certificado del sistema' : 'Certificado activo'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onDelete(certificate.id)}
                className="ml-4 p-2 rounded-full hover:bg-red-100 text-red-500 transition-colors"
                title="Eliminar certificado"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CertificateList;