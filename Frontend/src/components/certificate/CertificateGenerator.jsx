import { useState } from 'react';
import { Download, Key, User, Mail, Building, Globe, Lock, AlertCircle, CheckCircle, Shield, Upload } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { generatePyHankoCertificate, validatePyHankoCertificateData, downloadCertificate } from '../services/CertificateGeneratorService';
import { uploadCertificate } from '../services/CertificateService';

const CertificateGenerator = ({ onCertificateGenerated }) => {
  const [formData, setFormData] = useState({
    commonName: '',
    organization: '',
    organizationalUnit: '',
    locality: '',
    state: '',
    country: 'EC',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generatedCertificate, setGeneratedCertificate] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar contraseñas coinciden
    if (formData.password !== formData.confirmPassword) {
      setErrors(['Las contraseñas no coinciden']);
      return;
    }
    
    // Validar datos del certificado
    const validationErrors = validatePyHankoCertificateData(formData);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsLoading(true);
    setErrors([]);
    
    try {
      const result = await generatePyHankoCertificate(formData);
      
      console.log('Certificado generado con nombre:', result.filename);
      
      // Guardar el certificado generado para mostrar opciones
      setGeneratedCertificate(result);
      setSuccess(true);
      
      // Notificar al componente padre si se proporciona callback
      if (onCertificateGenerated) {
        onCertificateGenerated(result);
      }
      
    } catch (error) {
      setErrors([error.message || 'Error al generar el certificado']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (generatedCertificate) {
      downloadCertificate(generatedCertificate.file, generatedCertificate.filename);
    }
  };

  const handleUploadToSystem = async () => {
    if (!generatedCertificate) return;
    
    try {
      console.log('🔄 Iniciando subida del certificado...');
      console.log('📦 Certificado generado:', generatedCertificate);
      console.log('🔑 Contraseña del formulario:', formData.password ? '***' : 'NO PROPORCIONADA');
      
      // Crear un archivo temporal para subir con el nombre original
      const file = new File([generatedCertificate.file], generatedCertificate.filename, {
        type: 'application/x-pkcs12'
      });
      
      console.log('📁 Archivo creado:', file.name, 'Tamaño:', file.size, 'bytes');
      console.log('📦 Blob original:', generatedCertificate.file.size, 'bytes');
      console.log('🔍 Tipo del Blob:', generatedCertificate.file.type);
      console.log('Subiendo certificado con nombre:', generatedCertificate.filename);
      
      // Verificar que el archivo no esté vacío
      if (file.size === 0) {
        throw new Error('El archivo generado está vacío');
      }
      
      // Subir el certificado al sistema
      await uploadCertificate(file, formData.password);
      
      setSuccess(true);
      setErrors([]);
      
      // Limpiar después de 3 segundos
      setTimeout(() => {
        setGeneratedCertificate(null);
        setSuccess(false);
        setFormData({
          commonName: '',
          organization: '',
          organizationalUnit: '',
          locality: '',
          state: '',
          country: 'EC',
          email: '',
          password: '',
          confirmPassword: ''
        });
      }, 3000);
      
    } catch (error) {
      setErrors([error.message || 'Error al subir el certificado al sistema']);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
          <div>
            <p className="text-yellow-800 font-semibold">Importante:</p>
            <p className="text-yellow-700 text-sm">La contraseña que elijas protegerá tu certificado digital (.p12). <b>Guárdala en un lugar seguro</b>, la necesitarás para firmar documentos y para volver a subir el certificado si lo descargas. Si la olvidas, no podrás recuperar el acceso a tu certificado.</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 mr-4">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Generar Certificado pyHanko</h2>
              <p className="text-gray-600">Crea un certificado compatible con pyHanko para firma digital avanzada</p>
            </div>
          </div>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <p className="text-green-800 font-medium">¡Certificado generado exitosamente!</p>
              <p className="text-green-700 text-sm">El archivo .p12 se ha descargado automáticamente</p>
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium mb-2">Errores encontrados:</p>
                <ul className="text-red-700 text-sm space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Nombre Completo *
              </label>
              <Input
                type="text"
                name="commonName"
                value={formData.commonName}
                onChange={handleInputChange}
                placeholder="Juan Pérez"
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email *
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="juan@ejemplo.com"
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="w-4 h-4 inline mr-2" />
                Organización
              </label>
              <Input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleInputChange}
                placeholder="Mi Empresa S.A."
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unidad Organizacional
              </label>
              <Input
                type="text"
                name="organizationalUnit"
                value={formData.organizationalUnit}
                onChange={handleInputChange}
                placeholder="IT"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localidad
              </label>
              <Input
                type="text"
                name="locality"
                value={formData.locality}
                onChange={handleInputChange}
                placeholder="Guayaquil"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado/Provincia
              </label>
              <Input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="GS"
                maxLength="2"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-4 h-4 inline mr-2" />
                País
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="EC">Ecuador</option>
                <option value="MX">México</option>
                <option value="US">Estados Unidos</option>
                <option value="ES">España</option>
                <option value="AR">Argentina</option>
                <option value="CO">Colombia</option>
                <option value="PE">Perú</option>
                <option value="CL">Chile</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Contraseña del Certificado *
              </label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Mínimo 6 caracteres"
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Confirmar Contraseña *
              </label>
              <Input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Repetir contraseña"
                required
                className="w-full"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Generando certificado...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Generar Certificado pyHanko
                </>
              )}
            </Button>
          </div>

          {/* Botones de acción después de generar */}
          {generatedCertificate && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <p className="text-green-800 font-medium">¡Certificado pyHanko generado exitosamente!</p>
                  <p className="text-green-700 text-sm">Nombre: <strong>{generatedCertificate.filename}</strong></p>
                  <p className="text-green-700 text-sm">¿Qué deseas hacer con el certificado?</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={handleDownload}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Descargar Certificado
                </Button>
                
                <Button
                  onClick={handleUploadToSystem}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Subir al Sistema
                </Button>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                  <div className="text-blue-800 text-sm">
                    <p className="font-medium mb-1">Opciones disponibles:</p>
                    <ul className="space-y-1">
                      <li>• <strong>Descargar:</strong> Guarda el certificado en tu dispositivo</li>
                      <li>• <strong>Subir al Sistema:</strong> Almacena el certificado en el sistema para uso inmediato</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div className="text-blue-800 text-sm">
              <p className="font-medium mb-1">Información importante:</p>
              <ul className="space-y-1">
                <li>• El certificado pyHanko está optimizado para firma digital avanzada</li>
                <li>• Incluye configuraciones específicas para compatibilidad con pyHanko</li>
                <li>• Recomendado para entornos de producción y firma profesional</li>
                <li>• Después de generar, puedes descargarlo o subirlo directamente al sistema</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateGenerator;
