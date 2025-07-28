// Componente para seleccionar la ubicación de la firma en el PDF
import React, { useState, useRef, useEffect } from 'react';
import { FiZoomIn, FiZoomOut, FiChevronLeft, FiChevronRight, FiX, FiCheck } from 'react-icons/fi';
import { FaSignature } from 'react-icons/fa';
import { getToken } from '../services/authService';
import API_CONFIG from '../../config/api.js';

const PDFSignatureSelector = ({ document, onPositionSelect, onCancel }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(0.8);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const pdfContainerRef = useRef(null);

  // Convertir el documento a URL si es necesario
  useEffect(() => {
    if (!document) {
      console.error('No document provided to PDFSignatureSelector');
      return;
    }

    console.log('Document in PDFSignatureSelector:', document);
    
    // Si el documento es un objeto con un id
    if (document._id || document.id) {
      // Usa _id o id según cuál exista
      const docId = document._id || document.id;
      const url = `${API_CONFIG.BASE_URL}/documentos/preview/${docId}`;
      console.log('Setting PDF URL:', url);
      setPdfUrl(url);
    } else if (typeof document === 'string' && document.startsWith('/')) {
      setPdfUrl(`${window.location.origin}${document}`);
    } else if (typeof document === 'string') {
      setPdfUrl(document);
    } else if (document.url && typeof document.url === 'string') {
      setPdfUrl(document.url);
    } else {
      setPdfUrl('');
    }
  }, [document]);

  // Función simple para manejar clics en el PDF
  const handlePdfClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setPosition({ x, y });
    console.log('PDF clicked at:', { x, y });
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  };

  const handleConfirmPosition = () => {
    console.log('Confirmando posición:', position);
    
    if (!pdfContainerRef.current) {
      console.error('No se pudo obtener la referencia del contenedor PDF');
      return;
    }
    
    const container = pdfContainerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Calcular posición en porcentaje relativo al tamaño del contenedor
    const xPercent = (position.x / rect.width) * 100;
    const yPercent = (position.y / rect.height) * 100;
    
    console.log('Coordenadas calculadas:', {
      pixels: { x: Math.round(position.x), y: Math.round(position.y) },
      percent: { x: Math.round(xPercent), y: Math.round(yPercent) },
      container: { width: rect.width, height: rect.height }
    });
    
    console.log('Llamando a onPositionSelect con:', {
      type: 'custom',
      pageNumber,
      x: xPercent,
      y: yPercent,
      page: pageNumber,
      scale: scale,
      coordinates: {
        x: Math.round(position.x),
        y: Math.round(position.y)
      }
    });
    
    onPositionSelect({
      type: 'custom',
      pageNumber,
      x: xPercent,
      y: yPercent,
      page: pageNumber,
      scale: scale,
      coordinates: {
        x: Math.round(position.x),
        y: Math.round(position.y)
      }
    });
  };

  // Función simple para manejar errores del PDF
  const onPdfError = (error) => {
    console.error('Error loading PDF:', error);
    console.error('PDF URL:', pdfUrl);
    setPdfError(error);
  };

  // Función para recargar el PDF
  const reloadPdf = () => {
    setPdfUrl(''); // Limpiar URL para forzar recarga
    setPdfError(null);
    setTimeout(() => {
      if (document._id || document.id) {
        const docId = document._id || document.id;
        const url = `${API_CONFIG.BASE_URL}/documentos/preview/${docId}`;
        setPdfUrl(url);
      }
    }, 100);
  };

  // Log del token para debugging
  useEffect(() => {
    const token = getToken();
    console.log('Token available:', !!token);
    console.log('Token length:', token ? token.length : 0);
    console.log('Token preview:', token ? token.substring(0, 50) + '...' : 'none');
    
    if (!token) {
      console.error('No token available - user may need to login again');
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 h-5/6 max-w-6xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Selecciona la posición de la firma
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Haz clic en el PDF para posicionar la firma
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Controles de navegación */}
          <div className="flex justify-between items-center p-4 bg-white border-b">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                disabled={pageNumber <= 1}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                <FiChevronLeft />
              </button>
              <span className="text-sm">
                Página {pageNumber} de {numPages || 1}
              </span>
              <button
                onClick={() => setPageNumber(Math.min(numPages || 1, pageNumber + 1))}
                disabled={pageNumber >= (numPages || 1)}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                <FiChevronRight />
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                className="p-2 rounded hover:bg-gray-100"
              >
                <FiZoomOut />
              </button>
              <span className="text-sm">{Math.round(scale * 100)}%</span>
              <button
                onClick={() => setScale(Math.min(3, scale + 0.1))}
                className="p-2 rounded hover:bg-gray-100"
              >
                <FiZoomIn />
              </button>
              
              {/* Botón para recargar PDF */}
              <button
                onClick={reloadPdf}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Recargar PDF
              </button>
              
              {/* Botón para limpiar posición */}
              {position && position.x > 0 && position.y > 0 && (
                <button
                  onClick={() => setPosition({ x: 0, y: 0 })}
                  className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Limpiar Posición
                </button>
              )}
              
              {/* Información de posición */}
              {position && position.x > 0 && position.y > 0 && (
                <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  Posición: X: {Math.round(position.x)}px, Y: {Math.round(position.y)}px
                </div>
              )}
              
              {/* Mensaje informativo */}
              <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                Usando embed tag (simple y compatible)
              </div>
            </div>
          </div>

          {/* Área del PDF - Usando embed tag simple */}
          <div className="flex-1 overflow-auto bg-gray-100 relative" ref={pdfContainerRef}>
            {pdfUrl ? (
              <div className="w-full h-full relative">
                <embed
                  src={`${pdfUrl}?token=${getToken()}`}
                  type="application/pdf"
                  className="w-full h-full border-0"
                  onLoad={() => {
                    console.log('Embed PDF loaded successfully');
                  }}
                  onError={onPdfError}
                />
                
                {/* Overlay para capturar clics */}
                <div 
                  className="absolute inset-0 cursor-crosshair"
                  onClick={(e) => {
                    if (!pdfContainerRef.current) return;
                    
                    const rect = pdfContainerRef.current.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    setPosition({ x, y });
                    console.log('PDF click at:', { x, y });
                  }}
                />
                
                {/* Marcador de posición */}
                {position && position.x > 0 && position.y > 0 && (
                  <>
                    {/* Círculo principal */}
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: position.x - 20,
                        top: position.y - 20,
                        width: 40,
                        height: 40,
                        backgroundColor: 'rgba(59, 130, 246, 0.9)',
                        borderRadius: '50%',
                        border: '3px solid white',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10
                      }}
                    >
                      <FaSignature className="text-white" size={20} />
                    </div>
                    
                    {/* Líneas de guía */}
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: position.x - 1,
                        top: 0,
                        width: 2,
                        height: position.y - 20,
                        backgroundColor: 'rgba(59, 130, 246, 0.6)',
                        zIndex: 5
                      }}
                    />
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: 0,
                        top: position.y - 1,
                        width: position.x - 20,
                        height: 2,
                        backgroundColor: 'rgba(59, 130, 246, 0.6)',
                        zIndex: 5
                      }}
                    />
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <span>Cargando PDF...</span>
              </div>
            )}
            
            {/* Mostrar error si existe */}
            {pdfError && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
                <div className="text-center p-4">
                  <div className="text-red-600 mb-4">
                    <span className="block mb-2">Error al cargar el PDF</span>
                    <span className="text-sm text-gray-600">{pdfError.message}</span>
                  </div>
                  <button 
                    onClick={reloadPdf}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 p-4 border-t">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmPosition}
            disabled={!position.x || !position.y}
            className={`px-4 py-2 rounded flex items-center space-x-2 ${
              position.x && position.y 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-400 text-gray-600 cursor-not-allowed'
            }`}
          >
            <FaSignature />
            <span>
              {position.x && position.y 
                ? `Confirmar Posición (${Math.round(position.x)}, ${Math.round(position.y)})` 
                : 'Selecciona una posición primero'
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFSignatureSelector;