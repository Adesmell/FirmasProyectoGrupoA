import React, { useState } from 'react';
import { Upload, Key, Shield, Lock } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

const CertificateUpload = ({ onCertificateUpload }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.name.toLowerCase().endsWith('.p12')) {
        alert('Por favor selecciona un archivo .p12 válido');
        return;
      }
      
      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 5MB permitido.');
        return;
      }
      
      setSelectedFile(file);
      setPassword(''); // Limpiar contraseña al cambiar archivo
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert('Por favor selecciona un archivo de certificado');
      return;
    }
    
    if (!password) {
      alert('Por favor ingrese la contraseña del certificado');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('🔄 Iniciando subida de certificado...');
      console.log('📁 Archivo:', selectedFile.name);
      console.log('🔑 Contraseña proporcionada:', password ? '***' : 'NO PROPORCIONADA');
      
      await onCertificateUpload(selectedFile, password);
      
      console.log('✅ Certificado subido exitosamente');
      setSelectedFile(null);
      setPassword('');
    } catch (error) {
      console.error('❌ Error en handleSubmit:', error);
      // El error se maneja en el componente padre (modal)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Certificado Digital</h2>
        <p className="text-gray-600">
          Sube tu certificado .p12 o crea un certificado del sistema
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 hover:border-blue-400 hover:bg-blue-50">
          <input
            type="file"
            accept=".p12"
            onChange={handleFileChange}
            className="hidden"
            id="certificate-upload"
          />
          
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
              {selectedFile ? (
                <Shield className="w-10 h-10 text-blue-600" />
              ) : (
                <Key className="w-10 h-10 text-blue-600" />
              )}
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {selectedFile ? selectedFile.name : 'Selecciona tu certificado digital'}
              </h3>
              
              <label
                htmlFor="certificate-upload"
                className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg cursor-pointer transition-colors shadow-sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                {selectedFile ? 'Cambiar archivo' : 'Seleccionar certificado'}
              </label>
              
              <p className="mt-2 text-sm text-gray-500">
                Archivo .p12 (máximo 5MB)
              </p>
            </div>
          </div>
        </div>

        {selectedFile && (
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <Input
              label="Contraseña del certificado"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              icon={<Lock size={18} />}
              placeholder="Introduce la contraseña de tu certificado"
            />
            
            <div className="mt-4">
              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
              >
                Subir Certificado
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default CertificateUpload;