import React, { useEffect } from 'react';
import Header from '../ui/Header';
import DocumentUpload from '../document/DocumentUpload';
import DocumentList from '../document/DocumentList';
import DocumentPreview from '../document/DocumentPreview';
import StatsCards from '../ui/StatsCards';
import Notification from '../ui/Notification';
import { DocumentStatus } from '../document/types';
import { uploadpdf, getUserDocuments, deleteDocument, downloadDocument } from '../services/UploadService';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import CertificateUpload from '../certificate/CertificateUpload';
import CertificateList from '../certificate/CertificateList';
import CertificateGenerator from '../certificate/CertificateGenerator';
import DocumentSigningModal from '../signing/DocumentSigningModal';
import { uploadCertificate, getUserCertificates, deleteCertificate } from '../services/CertificateService';

function Principal() {
  const [documents, setDocuments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [previewDocument, setPreviewDocument] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [certificates, setCertificates] = useState([]);
  const [showCertificateSection, setShowCertificateSection] = useState(false);
  const [certificateTab, setCertificateTab] = useState('upload'); // 'upload' or 'generate'
  const [signingModal, setSigningModal] = useState({ isOpen: false, document: null });
  const { currentUser } = useAuth();

  // Función para cargar documentos desde el servidor
  const fetchDocuments = async (showSuccessMessage = false) => {
    try {
      setIsLoading(true);
      const userDocuments = await getUserDocuments();
      
      if (!userDocuments || userDocuments.length === 0) {
        console.log("No se encontraron documentos o la respuesta está vacía");
        setDocuments([]);
        return;
      }
      
      // Mapear los documentos del backend al formato que espera la UI
      const formattedDocuments = userDocuments.map(doc => {
        // Intentar crear objetos Date válidos, con fallback a null si la fecha es inválida
        let uploadDate = null;
        let signedDate = null;
        
        try {
          if (doc.fechaSubida || doc.uploadDate || doc.fecha_subida) {
            uploadDate = new Date(doc.fechaSubida || doc.uploadDate || doc.fecha_subida);
            // Verificar si la fecha es válida
            if (isNaN(uploadDate.getTime())) uploadDate = null;
          }
          
          if (doc.fechaFirma || doc.signedDate) {
            signedDate = new Date(doc.fechaFirma || doc.signedDate);
            // Verificar si la fecha es válida
            if (isNaN(signedDate.getTime())) signedDate = null;
          }
        } catch (e) {
          console.error('Error al procesar fechas:', e);
        }
        
        return {
          id: doc._id || doc.id,
          name: doc.nombre_original || doc.nombre || doc.name,
          size: doc.tamano || doc.tamaño || doc.size || 0,
          type: doc.tipo_archivo || doc.tipo || doc.type || 'application/pdf',
          uploadDate: uploadDate,
          status: doc.estado === 'firmado' || doc.firmado ? DocumentStatus.SIGNED : DocumentStatus.READY,
          url: doc.url || doc.ruta,
          signedBy: doc.firmadoPor || doc.signedBy,
          signedDate: signedDate
        };
      });
      
      setDocuments(formattedDocuments);
      
      if (showSuccessMessage && formattedDocuments.length > 0) {
        showNotification('success', `Se cargaron ${formattedDocuments.length} documentos`);
      }
    } catch (error) {
      console.error('Error al cargar documentos:', error);
      showNotification('error', 'No se pudieron cargar tus documentos');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar documentos al montar el componente
  useEffect(() => {
    fetchDocuments(true);
  }, []);

  // Bienvenida al usuario
  useEffect(() => {
    if (currentUser) {
      showNotification('success', `Bienvenido, ${currentUser.firstName || currentUser.nombre} ${currentUser.lastName || currentUser.apellido}`);
    }
  }, [currentUser]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleFileUpload = async (files) => {
    showNotification('success', `Subiendo ${files.length} archivo${files.length > 1 ? 's' : ''}...`);

    // Inicializar progreso para cada archivo
    const newUploadProgress = {};
    files.forEach(file => {
      newUploadProgress[file.name] = 0;
    });
    setUploadProgress(newUploadProgress);

    const uploadPromises = files.map(async (file) => {
      try {
        // Simular progreso de carga
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: Math.min(progress, 90)
          }));
        }, 300);

        // Subir el archivo al servidor
        const response = await uploadpdf(file);
        
        // Completar progreso
        clearInterval(interval);
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 100
        }));

        // Crear documento con datos del servidor
        const newDocument = {
          id: response.documento?._id || response._id || response.id || Math.random().toString(36).substr(2, 9),
          name: response.documento?.nombre_original || response.nombre || file.name,
          size: response.documento?.tamano || file.size,
          type: response.documento?.tipo_archivo || file.type,
          uploadDate: new Date(response.documento?.fecha_subida) || new Date(),
          status: DocumentStatus.READY,
          url: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
          signedBy: null,
          signedDate: null
        };

        // Agregar el nuevo documento a la lista
        setDocuments(prev => [...prev, newDocument]);
        
        setTimeout(() => {
          setUploadProgress(prev => {
            const { [file.name]: _, ...rest } = prev;
            return rest;
          });
        }, 1000);

        return newDocument;
      } catch (error) {
        console.error('Error uploading file:', error);
        showNotification('error', `Error al subir ${file.name}: ${error.message}`);
        
        setUploadProgress(prev => {
          const { [file.name]: _, ...rest } = prev;
          return rest;
        });
        
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successCount = results.filter(Boolean).length;
    
    if (successCount > 0) {
      showNotification('success', `${successCount} archivo${successCount > 1 ? 's' : ''} subido${successCount > 1 ? 's' : ''} correctamente`);
    }
  };

  const handlePreview = (document) => {
    setPreviewDocument(document);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDocument(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      showNotification('success', 'Documento eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      showNotification('error', `Error al eliminar documento: ${error.message}`);
    }
  };

  const handleDownload = async (document) => {
    try {
      await downloadDocument(document.id);
      showNotification('success', 'Documento descargado correctamente');
    } catch (error) {
      console.error('Error al descargar documento:', error);
      showNotification('error', `Error al descargar documento: ${error.message}`);
    }
  };

  const handleSign = async (id, certificateId, password) => {
    try {
      if (!certificateId) {
        showNotification('error', 'Debes seleccionar un certificado para firmar');
        return;
      }
      
      if (!password && password !== '') {
        showNotification('error', 'La contraseña del certificado es requerida');
        return;
      }
      
      showNotification('info', 'Firmando documento...');
      
      const result = await signDocument(id, certificateId, password);
      
      setDocuments(prev => prev.map(doc => 
        doc.id === id 
          ? { 
              ...doc, 
              status: DocumentStatus.SIGNED, 
              signedBy: currentUser ? `${currentUser.firstName || currentUser.nombre} ${currentUser.lastName || currentUser.apellido}` : 'Usuario',
              signedDate: new Date()
            }
          : doc
      ));
      
      showNotification('success', 'Documento firmado correctamente');
    } catch (error) {
      console.error('Error al firmar documento:', error);
      showNotification('error', `No se pudo firmar el documento: ${error.message}`);
    }
  };

  // useEffect para cargar certificados del usuario
  useEffect(() => {
    loadUserCertificates();
  }, []);

  // Añadir función para manejar la subida de certificados
  const handleCertificateUpload = async (file, password) => {
    try {
      showNotification('info', 'Subiendo certificado...');
      const result = await uploadCertificate(file, password);
      
      // Recargar la lista completa de certificados desde el servidor
      await loadUserCertificates();
      
      showNotification('success', 'Certificado subido correctamente');
      return result;
    } catch (error) {
      console.error('Error al subir certificado:', error);
      showNotification('error', `Error al subir certificado: ${error.message}`);
      throw error;
    }
  };

  // Función para eliminar certificados
  const handleDeleteCertificate = async (id) => {
    try {
      await deleteCertificate(id);
      setCertificates(prev => prev.filter(cert => cert.id !== id));
      showNotification('success', 'Certificado eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar certificado:', error);
      showNotification('error', `Error al eliminar certificado: ${error.message}`);
    }
  };

  // Función para cargar certificados del usuario
  const loadUserCertificates = async () => {
    try {
      const userCertificates = await getUserCertificates();
      setCertificates(userCertificates);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('Usuario sin certificados - comportamiento normal');
        setCertificates([]);
      } else {
        console.error('Error al cargar certificados:', error);
        showNotification('error', 'No se pudieron cargar tus certificados');
      }
    }
  };

  // Función para manejar la generación de certificados
  const handleCertificateGenerated = async (result) => {
    try {
      showNotification('success', `Certificado ${result.filename} generado y descargado correctamente`);
      // Recargar la lista de certificados del usuario
      await loadUserCertificates();
    } catch (error) {
      console.error('Error después de generar certificado:', error);
    }
  };

  // Función para abrir el modal de firma
  const handleSignDocument = (document) => {
    if (certificates.length === 0) {
      showNotification('error', 'Necesitas al menos un certificado para firmar documentos');
      setShowCertificateSection(true);
      return;
    }
    setSigningModal({ isOpen: true, document });
  };

  // Función para cerrar el modal de firma
  const handleCloseSigningModal = () => {
    setSigningModal({ isOpen: false, document: null });
  };

  // Función para manejar la finalización de la firma
  const handleSigningComplete = async (result) => {
    console.log('✅ Firma completada, actualizando lista de documentos...');
    
    try {
      // Recargar documentos desde el servidor para obtener el estado actualizado
      await fetchDocuments(false);
      console.log('✅ Lista de documentos actualizada automáticamente');
      showNotification('success', 'Documento firmado y lista actualizada correctamente');
    } catch (error) {
      console.error('❌ Error al actualizar lista de documentos:', error);
      // Fallback: actualizar solo el documento específico
      setDocuments(prev => prev.map(doc => 
        doc.id === result.documentId 
          ? { 
              ...doc, 
              status: DocumentStatus.SIGNED, 
              signedBy: currentUser ? `${currentUser.firstName || currentUser.nombre} ${currentUser.lastName || currentUser.apellido}` : 'Usuario',
              signedDate: new Date(),
              signedUrl: result.signedUrl
            }
          : doc
      ));
      showNotification('success', 'Documento firmado correctamente');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      {/* Notification */}
      <Notification 
        notification={notification} 
        onClose={() => setNotification(null)} 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <StatsCards documents={documents} />

        <div className="space-y-8">
          {/* Upload Section */}
          <section className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
            <DocumentUpload 
              onFileUpload={handleFileUpload}
              uploadProgress={uploadProgress}
            />
          </section>

          {/* Documents List */}
          <section className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
            {isLoading ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-3 text-gray-600">Cargando documentos...</p>
              </div>
            ) : (
              <DocumentList
                documents={documents}
                onPreview={handlePreview}
                onDelete={handleDelete}
                onDownload={handleDownload}
                onSign={handleSignDocument}
              />
            )}
          </section>
        </div>

        {/* Certificados Section */}
        <div className="space-y-8 mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Certificados Digitales</h2>
            <button
              onClick={() => setShowCertificateSection(!showCertificateSection)}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              {showCertificateSection ? 'Ocultar' : 'Gestionar Certificados'}
            </button>
          </div>

          {showCertificateSection && (
            <section className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              {/* Tabs para seleccionar entre subir o generar certificado */}
              <div className="mb-8">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                  <button
                    onClick={() => setCertificateTab('upload')}
                    className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                      certificateTab === 'upload'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Subir Certificado
                  </button>
                  <button
                    onClick={() => setCertificateTab('generate')}
                    className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                      certificateTab === 'generate'
                        ? 'bg-white text-green-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Generar Certificado
                  </button>
                </div>
              </div>

              {/* Contenido de las pestañas */}
              {certificateTab === 'upload' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <CertificateUpload onCertificateUpload={handleCertificateUpload} />
                  </div>
                  <div>
                    <CertificateList 
                      certificates={certificates} 
                      onDelete={handleDeleteCertificate} 
                    />
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto">
                  <CertificateGenerator onCertificateGenerated={handleCertificateGenerated} />
                  
                  {/* Mostrar lista de certificados también en la pestaña de generar */}
                  {certificates.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Tus Certificados</h3>
                      <CertificateList 
                        certificates={certificates} 
                        onDelete={handleDeleteCertificate} 
                      />
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* Preview Modal */}
      <DocumentPreview
        document={previewDocument}
        certificates={certificates}
        onClose={() => setPreviewDocument(null)}
        onSign={handleSignDocument}
      />

      {/* Document Signing Modal */}
      <DocumentSigningModal
        isOpen={signingModal.isOpen}
        onClose={handleCloseSigningModal}
        document={signingModal.document}
        certificates={certificates}
        onSigningComplete={handleSigningComplete}
        showNotification={showNotification}
      />
    </div>
  );
}

export default Principal;