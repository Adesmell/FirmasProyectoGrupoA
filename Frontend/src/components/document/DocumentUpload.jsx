import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, Cloud } from 'lucide-react';
import { validateFile } from './types';

const DocumentUpload = ({ onFileUpload, uploadProgress }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFiles = (files) => {
    for (let i = 0; i < files.length; i++) {
      const validationError = validateFile(files[i]);
      if (validationError) {
        return validationError;
      }
    }
    return null;
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      const validationError = validateFiles(e.dataTransfer.files);
      
      if (validationError) {
        setError(validationError);
        setTimeout(() => setError(null), 5000);
        return;
      }

      setError(null);
      onFileUpload(files);
    }
  }, [onFileUpload]);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      const validationError = validateFiles(e.target.files);
      
      if (validationError) {
        setError(validationError);
        setTimeout(() => setError(null), 5000);
        return;
      }

      setError(null);
      onFileUpload(files);
      
      // Limpiar el input para permitir subir el mismo archivo nuevamente
      e.target.value = '';
    }
  };

  const hasActiveUploads = Object.keys(uploadProgress).length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Subir Documentos</h2>
        <p className="text-gray-600">Sube tus documentos para iniciar el proceso de firma digital</p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
          dragActive 
            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 scale-[1.02] shadow-lg' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept=".pdf,application/pdf"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          id="file-upload"
        />
        
        <div className="flex flex-col items-center space-y-6">
          <div className={`p-6 rounded-full transition-all duration-300 ${
            dragActive 
              ? 'bg-gradient-to-br from-blue-100 to-indigo-100 scale-110' 
              : 'bg-gradient-to-br from-gray-100 to-gray-200'
          }`}>
            {dragActive ? (
              <Cloud className="w-12 h-12 text-blue-600" />
            ) : (
              <Upload className="w-12 h-12 text-gray-500" />
            )}
          </div>
          
          <div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-3">
              {dragActive ? 'Suelta los archivos aquí' : 'Subir Documentos para Firma'}
            </h3>
            <p className="text-gray-600 mb-4 text-lg">
              Arrastra y suelta tus archivos PDF aquí o{' '}
              <label htmlFor="file-upload" className="text-blue-600 hover:text-blue-700 cursor-pointer font-semibold underline decoration-2 underline-offset-2">
                selecciona archivos
              </label>
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
              <span className="px-3 py-1 bg-gray-100 rounded-full">PDF</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Máximo 10MB por archivo</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3 animate-in slide-in-from-top">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {hasActiveUploads && (
        <div className="mt-8 space-y-4">
          <h4 className="font-semibold text-gray-800 text-lg">Subiendo archivos...</h4>
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{fileName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {progress === 100 ? (
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium text-green-600">Completado</span>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-blue-600">{Math.round(progress)}%</span>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;