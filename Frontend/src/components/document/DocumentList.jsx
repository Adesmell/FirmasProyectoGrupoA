import React from 'react';      
import { FileText, Clock, CheckCircle2, AlertCircle, Trash2, Eye, PenTool, Download, User, Send } from 'lucide-react';
import { DocumentStatus, formatFileSize, formatDate } from './types';

const DocumentList = ({ documents, onPreview, onDelete, onDownload, onSign, onRequestSignature }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case DocumentStatus.UPLOADING:
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      case DocumentStatus.READY:
        return <FileText className="w-5 h-5 text-gray-500" />;
      case DocumentStatus.PENDING:
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case DocumentStatus.SIGNED:
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case DocumentStatus.ERROR:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case DocumentStatus.UPLOADING:
        return 'Subiendo...';
      case DocumentStatus.READY:
        return 'Listo para firmar';
      case DocumentStatus.PENDING:
        return 'Pendiente de firma';
      case DocumentStatus.SIGNED:
        return 'Firmado';
      case DocumentStatus.ERROR:
        return 'Error';
      default:
        return 'Sin estado';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case DocumentStatus.UPLOADING:
        return 'text-blue-700 bg-blue-100 border-blue-200';
      case DocumentStatus.READY:
        return 'text-gray-700 bg-gray-100 border-gray-200';
      case DocumentStatus.PENDING:
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case DocumentStatus.SIGNED:
        return 'text-green-700 bg-green-100 border-green-200';
      case DocumentStatus.ERROR:
        return 'text-red-700 bg-red-100 border-red-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="p-6 bg-gray-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <FileText className="w-12 h-12 text-gray-300" />
        </div>
        <h3 className="text-xl font-semibold text-gray-600 mb-3">No hay documentos</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Sube tus primeros documentos para comenzar el proceso de firma digital. 
          Arrastra archivos o usa el botón de subida.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-800">
          Documentos ({documents.length})
        </h3>
        <div className="text-sm text-gray-500">
          {documents.filter(doc => doc.status === DocumentStatus.SIGNED).length} firmados
        </div>
      </div>
      
      <div className="grid gap-4">
        {documents.map((document) => (
          <div key={document.id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  {getStatusIcon(document.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-semibold text-gray-800 truncate mb-2">
                    {document.name}
                  </h4>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <span className="font-medium">{formatFileSize(document.size)}</span>
                    <span>•</span>
                    <span>Subido el {document.uploadDate ? formatDate(document.uploadDate) : 'fecha desconocida'}</span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(document.status)}`}>
                      {getStatusText(document.status)}
                    </span>
                    
                    {document.status === DocumentStatus.SIGNED && document.signedBy && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>
                          Firmado por <span className="font-medium">{document.signedBy}</span>
                          {document.signedDate ? ` el ${formatDate(document.signedDate)}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => onPreview(document)}
                  className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 border border-transparent hover:border-blue-200"
                  title="Previsualizar"
                >
                  <Eye className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => onDownload(document)}
                  className="p-2.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 border border-transparent hover:border-green-200"
                  title="Descargar"
                >
                  <Download className="w-5 h-5" />
                </button>
                
                {document.status === DocumentStatus.READY && (
                  <>
                    <button
                      onClick={() => onSign(document)}
                      className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <PenTool className="w-4 h-4" />
                      <span className="font-medium">Firmar</span>
                    </button>
                    
                    <button
                      onClick={() => onRequestSignature(document)}
                      className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                      title="Solicitar firma a otro usuario"
                    >
                      <Send className="w-4 h-4" />
                      <span className="font-medium">Solicitar</span>
                    </button>
                  </>
                )}
                
                {document.status === DocumentStatus.SIGNED && (
                  <button
                    onClick={() => onDownload(document)}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Descargar documento firmado"
                  >
                    <Download className="w-4 h-4" />
                    <span className="font-medium">Descargar</span>
                  </button>
                )}
                
                {document.status !== DocumentStatus.UPLOADING && (
                  <button
                    onClick={() => onDelete(document.id)}
                    className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 border border-transparent hover:border-red-200"
                    title="Eliminar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentList;