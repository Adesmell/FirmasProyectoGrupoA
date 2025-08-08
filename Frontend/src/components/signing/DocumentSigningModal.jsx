// Modal para el proceso completo de firma de documentos
import React, { useState, useEffect, useCallback } from 'react';
import PDFSignatureSelector from './PDFSignatureSelector';
import { generateQRForCertificate } from '../services/QRService';
import { signDocumentWithCertificate, validateCertificatePassword } from '../services/DocumentSigningService';
import { getToken, getCurrentUser, isAuthenticated } from '../services/authService';
import API_CONFIG from '../../config/api.js';

const DocumentSigningModal = ({ 
  isOpen, 
  onClose, 
  document, 
  certificates, 
  onSigningComplete,
  showNotification,
  signaturePosition: initialSignaturePosition 
}) => {
  // Estados para controlar el flujo
  const [step, setStep] = useState('select-position'); // select-position, select-certificate, enter-password, signing
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [signaturePosition, setSignaturePosition] = useState(null);
  const [password, setPassword] = useState('');
  const [qrData, setQrData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [error, setError] = useState(null);

  // Resetear el estado cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setStep('select-position');
      setSelectedCertificate(null);
      setSignaturePosition(null);
      setPassword('');
      setQrData(null);
      setIsLoading(false);
      setIsSigned(false);
      setError(null);
    }
  }, [isOpen]);

  // Si hay una posición inicial de firma, usarla pero no saltar automáticamente
  useEffect(() => {
    if (isOpen && initialSignaturePosition && !signaturePosition) {
      console.log('🔍 Usando posición de firma inicial:', initialSignaturePosition);
      setSignaturePosition(initialSignaturePosition);
      // No cambiar automáticamente el paso, dejar que el usuario vea el documento primero
    }
  }, [isOpen, initialSignaturePosition, signaturePosition]);

  // Manejar la selección de posición
  const handlePositionSelect = useCallback((position) => {
    console.log('📍 Posición seleccionada:', position);
    setSignaturePosition(position);
    // No cambiar automáticamente al siguiente paso, dejar que el usuario decida
  }, []);

  const handleCertificateSelect = async (certificate) => {
    setSelectedCertificate(certificate);
    setIsLoading(true);
    
    try {
      // Generar código QR con datos del certificado
      const qr = await generateQRForCertificate(certificate);
      setQrData(qr);
      setStep('enter-password');
    } catch (error) {
      console.error('Error al generar QR:', error);
      showNotification('error', 'Error al generar código QR del certificado');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Siempre requerir contraseña para cualquier tipo de certificado
    if (!password.trim()) {
      showNotification('error', 'Por favor ingresa la contraseña de tu certificado para firmar');
      return;
    }

    setIsLoading(true);
    
    try {
      const certificateId = selectedCertificate?._id || selectedCertificate?.id;
      console.log('Validando certificado:', certificateId, 'con contraseña');
      
      if (!certificateId) {
        showNotification('error', 'No se encontró el ID del certificado.');
        setIsLoading(false);
        return;
      }
      
      // Validar contraseña del certificado
      await validateCertificatePassword(certificateId, password);
      
      // Proceder con la firma
      setStep('signing');
      await performSigning();
    } catch (error) {
      console.error('Error al validar contraseña:', error);
      showNotification('error', error.message || 'Contraseña incorrecta o certificado no compatible');
    } finally {
      setIsLoading(false);
    }
  };

  const performSigning = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Debug: Mostrar información del usuario actual
      const currentUser = getCurrentUser();
      console.log('🔍 Usuario actual:', currentUser);
      console.log('🔍 Documento a firmar:', document);
      console.log('🔍 ID del usuario actual:', currentUser?.id);
      console.log('🔍 ID del documento:', document?._id || document?.id);
      
      // Debug: Verificar autenticación
      const isAuth = isAuthenticated();
      console.log('🔍 Usuario autenticado:', isAuth);
      
      // Debug: Verificar token
      const token = getToken();
      console.log('🔍 Token disponible:', token ? 'SÍ' : 'NO');
      console.log('🔍 Token valor:', token);
      
      if (!isAuth || !token) {
        throw new Error('Usuario no autenticado. Por favor, inicie sesión nuevamente.');
      }
      
      // Obtener la imagen QR como base64
      let qrImageBase64 = null;
      if (qrData && qrData.qrImageUrl) {
        try {
          // Descargar la imagen y convertirla a base64 con timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
          
          const response = await fetch(qrData.qrImageUrl, {
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const blob = await response.blob();
          qrImageBase64 = await new Promise((resolve, reject) => {
            const reader = new window.FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          console.log('✅ QR code generado exitosamente');
        } catch (qrError) {
          console.warn('⚠️ Error al obtener QR code, continuando sin QR:', qrError.message);
          // Continuar sin QR code si hay error de red
          qrImageBase64 = null;
        }
      }
      
      // Obtener dimensiones del canvas si están disponibles
      const canvasDimensions = signaturePosition.canvasDimensions || null;
      
      console.log('🔍 Datos para firma:');
      console.log('  document completo:', JSON.stringify(document, null, 2));
      console.log('  document.id:', document.id);
      console.log('  document._id:', document._id);
      console.log('  document.id type:', typeof document.id);
      console.log('  document._id type:', typeof document._id);
      console.log('  selectedCertificate:', selectedCertificate);
      console.log('  selectedCertificate._id:', selectedCertificate._id);
      console.log('  selectedCertificate.id:', selectedCertificate.id);
      
      const certificateId = selectedCertificate._id || selectedCertificate.id;
      const documentId = document._id || document.id;
      
      if (!certificateId) {
        throw new Error('No se pudo obtener el ID del certificado');
      }
      
      if (!documentId) {
        throw new Error('No se pudo obtener el ID del documento');
      }

      // Validar que documentId sea un ObjectId válido (24 caracteres hexadecimales)
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(documentId)) {
        console.error('❌ documentId no es un ObjectId válido:', documentId);
        throw new Error(`ID de documento inválido: ${documentId}. Se esperaba un ObjectId de 24 caracteres hexadecimales.`);
      }

      if (!objectIdRegex.test(certificateId)) {
        console.error('❌ certificateId no es un ObjectId válido:', certificateId);
        throw new Error(`ID de certificado inválido: ${certificateId}. Se esperaba un ObjectId de 24 caracteres hexadecimales.`);
      }
      
      const result = await signDocumentWithCertificate(
        documentId,
        certificateId,
        password,
        signaturePosition,
        {
          qrImageBase64,
          nombre: qrData?.qrData?.nombre,
          correo: qrData?.qrData?.correo,
          organizacion: qrData?.qrData?.organizacion
        },
        canvasDimensions
      );

      // Si la firma fue exitosa, mostrar mensaje de éxito
      if (result.success) {
        console.log('✅ Firma exitosa');
        console.log('  fileName:', result.fileName);
        showNotification('success', 'Documento firmado correctamente');
      } else {
        console.log('❌ Firma no exitosa');
        showNotification('success', 'Documento firmado correctamente');
      }
      
      setIsSigned(true);
      setStep('success'); // Cambiar al paso de éxito
      onSigningComplete(result);
    } catch (error) {
      console.error('Error al firmar documento:', error);
      setError(error.message || 'Error al firmar el documento');
      showNotification('error', error.message || 'Error al firmar el documento');
      setStep('enter-password'); // Volver al paso anterior
    } finally {
      setIsLoading(false);
    }
  };



  // Verificar que el documento esté listo para firmar
  const [documentReady, setDocumentReady] = useState(false);
  const [documentError, setDocumentError] = useState(null);
  const [documentChecking, setDocumentChecking] = useState(false);

  useEffect(() => {
    const checkDocumentReady = async (retryCount = 0) => {
      if (!document || (!document._id && !document.id)) {
        setDocumentError('Documento no válido');
        return;
      }

      setDocumentChecking(true);
      setDocumentError(null);

      try {
        // Verificar que el documento tenga los datos necesarios
        const docId = document._id || document.id;
        if (!docId || !document.name) {
          throw new Error('El documento no tiene los datos necesarios');
        }

        // El documento está listo si tiene ID y nombre
        setDocumentReady(true);
        setDocumentError(null);
      } catch (error) {
        console.error('Error checking document ready state:', error);
        
        // Si el documento no está procesado y no hemos intentado demasiadas veces, reintentar
        if (error.message.includes('datos necesarios') && retryCount < 3) {
          console.log(`Reintentando verificación del documento (intento ${retryCount + 1}/3)...`);
          setTimeout(() => {
            checkDocumentReady(retryCount + 1);
          }, 2000); // Esperar 2 segundos antes de reintentar
          return;
        }
        
        setDocumentError(error.message);
        setDocumentReady(false);
      } finally {
        setDocumentChecking(false);
      }
    };

    if (isOpen && document) {
      checkDocumentReady();
    }
  }, [isOpen, document]);

  if (!isOpen || !document || !document.id) {
    if (isOpen && (!document || !document.id)) {
      console.error('No se proporcionó un documento válido al modal de firma:', document);
    }
    return null;
  }

  // Mostrar carga mientras se verifica el documento
  if (documentChecking) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verificando documento...
            </h2>
            <p className="text-gray-600">
              Comprobando que el documento esté listo para firmar
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error si el documento no está listo
  if (documentError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Documento no disponible
            </h2>
            <p className="text-gray-600 mb-4">{documentError}</p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Recargar página
              </button>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancelar
              </button>
            </div>
            {documentError.includes('procesando') && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  💡 <strong>Sugerencia:</strong> Si acabas de subir el documento, espera unos segundos antes de intentar firmarlo.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Firmar Documento: {document?.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'select-position' ? 'bg-blue-600 text-white' : 
                ['select-certificate', 'enter-password', 'signing', 'success'].includes(step) ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <div className="flex-1 h-1 bg-gray-300 rounded">
                <div className={`h-1 bg-blue-600 rounded transition-all duration-300 ${
                  ['select-certificate', 'enter-password', 'signing', 'success'].includes(step) ? 'w-full' : 'w-0'
                }`} />
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'select-certificate' ? 'bg-blue-600 text-white' : 
                ['enter-password', 'signing', 'success'].includes(step) ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <div className="flex-1 h-1 bg-gray-300 rounded">
                <div className={`h-1 bg-blue-600 rounded transition-all duration-300 ${
                  ['enter-password', 'signing', 'success'].includes(step) ? 'w-full' : 'w-0'
                }`} />
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                ['enter-password', 'signing', 'success'].includes(step) ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
            </div>
                         <div className="flex justify-between text-xs text-gray-600 mt-2 px-2">
               <span className="text-center">Revisar documento<br/>y ubicación</span>
               <span className="text-center">Seleccionar<br/>certificado</span>
               <span className="text-center">Ingresar<br/>contraseña</span>
             </div>
          </div>

                                {/* Step 1: View Document and Select Position */}
            {step === 'select-position' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Revisar documento y seleccionar ubicación de firma
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Primero revisa el documento y luego haz clic en el PDF para seleccionar dónde colocar la firma.
                </p>
                
                {/* Información del documento */}
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Información del documento:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Nombre:</strong> {document?.name || document?.nombre_original}</li>
                    <li>• <strong>Tamaño:</strong> {document?.size ? `${(document.size / 1024 / 1024).toFixed(2)} MB` : 'No disponible'}</li>
                    <li>• <strong>Fecha de subida:</strong> {document?.uploadDate ? new Date(document.uploadDate).toLocaleDateString() : 'No disponible'}</li>
                  </ul>
                </div>
                
                <div className="border rounded-lg p-4 bg-gray-50 h-96">
                  <PDFSignatureSelector 
                    document={document} 
                    onPositionSelect={handlePositionSelect} 
                    onCancel={() => setStep('select-certificate')}
                  />
                </div>
                
                {signaturePosition && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✅ Ubicación seleccionada: X: {signaturePosition.x}%, Y: {signaturePosition.y}%
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Esta posición se guardará y se usará para futuras firmas
                    </p>
                    <div className="mt-3 flex space-x-3">
                      <button
                        onClick={() => setStep('select-certificate')}
                        className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Continuar con esta ubicación
                      </button>
                      <button
                        onClick={() => setSignaturePosition(null)}
                        className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cambiar ubicación
                      </button>
                    </div>
                  </div>
                )}
                
                {!signaturePosition && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      💡 Haz clic en el documento para seleccionar la ubicación de la firma
                    </p>
                  </div>
                )}
              </div>
            )}

                     {/* Step 2: Select Certificate */}
           {step === 'select-certificate' && (
             <div>
               <h3 className="text-lg font-medium text-gray-900 mb-4">Seleccionar certificado</h3>
               <p className="text-sm text-gray-600 mb-4">
                 Seleccione el certificado con el que desea firmar el documento.
               </p>
               
               {/* Resumen de la configuración */}
               <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                 <h4 className="font-medium text-gray-900 mb-2">Resumen de la configuración:</h4>
                 <ul className="text-sm text-gray-600 space-y-1">
                   <li>• <strong>Documento:</strong> {document?.name || document?.nombre_original}</li>
                   <li>• <strong>Ubicación de firma:</strong> X: {signaturePosition?.x || 0}%, Y: {signaturePosition?.y || 0}%</li>
                   <li>• <strong>Página:</strong> {signaturePosition?.page || 1}</li>
                 </ul>
                 <button
                   onClick={() => setStep('select-position')}
                   className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                 >
                   ← Cambiar ubicación de firma
                 </button>
               </div>
                                 <div className="space-y-3">
                   {!signaturePosition && (
                     <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                       <p className="text-sm text-red-800">
                         ⚠️ Primero debes seleccionar una ubicación de firma en el documento
                       </p>
                       <button
                         onClick={() => setStep('select-position')}
                         className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                       >
                         ← Volver a seleccionar ubicación
                       </button>
                     </div>
                   )}
                   
                   {certificates.length > 0 ? (
                     certificates.map((cert) => {
                       console.log('Certificado en modal:', cert);
                       return (
                       <div 
                         key={cert._id || cert.id}
                         onClick={() => signaturePosition ? handleCertificateSelect(cert) : null}
                         className={`p-4 border rounded-lg transition-colors ${
                           selectedCertificate?._id === cert._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                         } ${signaturePosition ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed opacity-50'}`}
                       >
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-900">
                              {cert.alias || cert.nombre || cert.fileName || 'Certificado sin nombre'}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {cert.emisor && (
                                <span>{cert.emisor} • </span>
                              )}
                              Válido hasta: {cert.validTo ? new Date(cert.validTo).toLocaleDateString() : 'Fecha no disponible'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                    })
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No hay certificados disponibles</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Necesita tener al menos un certificado cargado para firmar documentos.
                      </p>
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={onClose}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                          </svg>
                          Subir certificado
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {selectedCertificate && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">
                      Certificado seleccionado: {selectedCertificate?.alias || selectedCertificate?.nombre || selectedCertificate?.fileName}
                    </p>
                  </div>
                )}
                
                {qrData && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={qrData.qrImageUrl} 
                      alt="Código QR del certificado" 
                      className="w-16 h-16"
                      onError={(e) => {
                        console.error('Error al cargar el código QR');
                        e.target.alt = 'Error al cargar el código QR';
                      }}
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">Código QR generado</h4>
                      <p className="text-sm text-gray-600">Se incluirá en la firma del documento</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowPositionSelector(true)}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Seleccionar ubicación de la firma
              </button>
            </div>
          )}

                     {/* Step 3: Enter Password */}
           {step === 'enter-password' && (
             <div>
               <h3 className="text-lg font-medium text-gray-900 mb-4">
                 Contraseña del certificado
               </h3>
               
               {error && (
                 <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                   <p className="text-sm text-red-800">
                     ❌ {error}
                   </p>
                 </div>
               )}
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Resumen de la firma:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Certificado: {selectedCertificate?.alias || selectedCertificate?.fileName}</li>
                  <li>• Ubicación: {signaturePosition?.type === 'custom' ? 'Personalizada' : 
                    signaturePosition?.type?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>
                  <li>• Código QR: Incluido</li>
                </ul>
              </div>

              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña del certificado *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ingresa la contraseña de tu certificado para firmar"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    La contraseña es necesaria para acceder a tu certificado y firmar el documento
                  </p>
                </div>

                                 <div className="flex space-x-3">
                   <button
                     type="button"
                     onClick={() => setStep('select-certificate')}
                     className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                   >
                     ← Volver a certificados
                   </button>
                   <button
                     type="submit"
                     disabled={isLoading}
                     className="flex-1 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                   >
                     {isLoading ? 'Validando...' : 'Firmar documento'}
                   </button>
                 </div>
              </form>
            </div>
          )}

          {/* Step 4: Signing */}
          {step === 'signing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Firmando documento...</h3>
              <p className="text-gray-600">Por favor espera mientras se procesa la firma digital</p>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">¡Documento firmado exitosamente!</h3>
              <p className="text-gray-600 mb-6">El documento ha sido firmado digitalmente</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    // Intentar descargar desde el servidor como respaldo
                    const token = getToken();
                    const link = window.document.createElement('a');
                    link.href = `${window.location.origin}/api/documentos/signed/${document.id}/download?token=${token}`;
                    link.download = `documento-firmado-${document.id}.pdf`;
                    link.target = '_blank';
                    window.document.body.appendChild(link);
                    link.click();
                    window.document.body.removeChild(link);
                    showNotification('success', 'Descarga iniciada');
                  }}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Descargar PDF firmado
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {isLoading && step !== 'signing' && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Generando código QR...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Position Selector Modal */}
      {/* Eliminado: Ya no se usa la versión modal, solo la embebida */}
    </>
  );
};

export default DocumentSigningModal;
