// Componente para seleccionar la ubicación de la firma en el PDF
import React, { useState, useRef, useEffect } from 'react';
import { FiZoomIn, FiZoomOut, FiChevronLeft, FiChevronRight, FiX, FiCheck, FiMove, FiTarget } from 'react-icons/fi';
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
  
  // Estados para posicionamiento manual
  const [positioningMode, setPositioningMode] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  
  // Obtener posición guardada del localStorage o usar posición por defecto
  const getStoredPosition = () => {
    const stored = localStorage.getItem('signaturePosition');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing stored position:', e);
      }
    }
    return { x: 200, y: 200 }; // Posición por defecto
  };
  
  const [currentPosition, setCurrentPosition] = useState(getStoredPosition());

  // Convertir el documento a URL si es necesario y establecer posición fija
  useEffect(() => {
    if (!document) {
      console.error('No document provided to PDFSignatureSelector');
      return;
    }

    // Verificar que el documento esté listo para firmar
    const checkDocumentReady = async () => {
      try {
        if (document._id || document.id) {
          const docId = document._id || document.id;
          
          // Verificar que el documento tenga los datos necesarios
          if (!docId || !document.name) {
            throw new Error('El documento no tiene los datos necesarios');
          }
          
          // Cargar el PDF directamente
          const url = `${API_CONFIG.BASE_URL}/documentos/preview/${docId}`;
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
        
        // Establecer posición guardada o por defecto
        setPosition(currentPosition);
      } catch (error) {
        console.error('Error checking document ready state:', error);
        setPdfError(error);
      }
    };
    
    checkDocumentReady();
  }, [document]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.3));
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  };

  // Función para manejar clics en el PDF
  const handlePdfClick = (e) => {
    if (!positioningMode) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setSelectedPosition({ x, y });
    console.log('PDF clicked at:', { x, y });
  };

  // Función para guardar la posición seleccionada
  const handleSavePosition = () => {
    if (selectedPosition) {
      localStorage.setItem('signaturePosition', JSON.stringify(selectedPosition));
      setCurrentPosition(selectedPosition);
      setPosition(selectedPosition);
      setPositioningMode(false);
      console.log('Posición guardada:', selectedPosition);
    }
  };

  // Función para activar/desactivar modo de posicionamiento
  const togglePositioningMode = () => {
    setPositioningMode(!positioningMode);
    if (!positioningMode) {
      setSelectedPosition(null);
    }
  };

  const handleConfirmPosition = () => {
    const finalPosition = selectedPosition || currentPosition;
    console.log('Confirmando posición:', finalPosition);
    
    onPositionSelect({
      type: 'fixed',
      pageNumber,
      x: finalPosition.x,
      y: finalPosition.y,
      page: pageNumber,
      scale: scale,
      coordinates: {
        x: finalPosition.x,
        y: finalPosition.y
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
    <div className="w-full h-full bg-white rounded-lg border flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b bg-gray-50">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Seleccionar posición de la firma
          </h3>
          <p className="text-xs text-gray-600">
            {positioningMode 
              ? 'Haz clic en el PDF para seleccionar la posición de la firma' 
              : 'Activa el modo de posicionamiento para elegir dónde colocar la firma'
            }
          </p>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('X button clicked');
            if (onCancel) {
              onCancel();
            }
          }}
          onMouseEnter={() => console.log('Mouse entered X button')}
          className="p-1 text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          <FiX size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Simplified controls */}
        <div className="flex justify-between items-center p-2 bg-gray-50 border-b">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
              disabled={pageNumber <= 1}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 text-xs"
            >
              <FiChevronLeft size={16} />
            </button>
            <span className="text-xs">
              Página {pageNumber} de {numPages || 1}
            </span>
            <button
              onClick={() => setPageNumber(Math.min(numPages || 1, pageNumber + 1))}
              disabled={pageNumber >= (numPages || 1)}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 text-xs"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setScale(Math.max(0.3, scale - 0.1))}
              className="p-1 rounded hover:bg-gray-200 text-xs"
            >
              <FiZoomOut size={16} />
            </button>
            <span className="text-xs">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale(Math.min(3, scale + 0.1))}
              className="p-1 rounded hover:bg-gray-200 text-xs"
            >
              <FiZoomIn size={16} />
            </button>
            
            {/* Botón para activar/desactivar modo de posicionamiento */}
            <button
              onClick={togglePositioningMode}
              className={`px-3 py-1 text-xs rounded flex items-center space-x-1 ${
                positioningMode 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <FiTarget size={12} />
              <span>
                {positioningMode ? 'Modo Activo' : 'Posicionar Firma'}
              </span>
            </button>
            
            {/* Botón para guardar posición */}
            {selectedPosition && (
              <button
                onClick={handleSavePosition}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                Guardar
              </button>
            )}
            
            {/* Información de posición actual */}
            <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
              Posición: {Math.round(currentPosition.x)}%, {Math.round(currentPosition.y)}%
            </div>
          </div>
        </div>

        {/* PDF Area */}
        <div 
          className="flex-1 overflow-auto bg-gray-100 relative" 
          ref={pdfContainerRef}
        >
          {pdfUrl ? (
            <div className="w-full h-full relative">
              <div 
                className="w-full h-full relative"
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left'
                }}
              >
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
                  className="absolute inset-0"
                  onClick={handlePdfClick}
                  style={{
                    cursor: positioningMode ? 'crosshair' : 'default',
                    pointerEvents: positioningMode ? 'auto' : 'none'
                  }}
                />
                
                {/* Marcador de posición actual */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${currentPosition.x}%`,
                    top: `${currentPosition.y}%`,
                    transform: 'translate(-50%, -50%)',
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
                
                {/* Marcador de posición seleccionada (temporal) */}
                {selectedPosition && (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: `${selectedPosition.x}%`,
                      top: `${selectedPosition.y}%`,
                      transform: 'translate(-50%, -50%)',
                      width: 40,
                      height: 40,
                      backgroundColor: 'rgba(34, 197, 94, 0.9)',
                      borderRadius: '50%',
                      border: '3px solid white',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 11
                    }}
                  >
                    <FaSignature className="text-white" size={20} />
                  </div>
                )}
              </div>
              
              {/* Indicador de modo de posicionamiento */}
              {positioningMode && (
                <div className="absolute top-2 left-2 bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-medium">
                  <FiTarget className="inline mr-1" size={12} />
                  Modo Posicionamiento Activo
                </div>
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
                <div className="space-y-2">
                  <button 
                    onClick={reloadPdf}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
                  >
                    Reintentar
                  </button>
                  <button 
                    onClick={() => {
                      console.log('Error Cancel button clicked, onCancel function:', typeof onCancel);
                      if (onCancel) {
                        onCancel();
                      } else {
                        console.error('onCancel function is not provided');
                      }
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end space-x-2 p-3 border-t bg-gray-50">
        <button
          onClick={() => {
            console.log('Footer Cancel button clicked, onCancel function:', typeof onCancel);
            if (onCancel) {
              onCancel();
            } else {
              console.error('onCancel function is not provided');
            }
          }}
          className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirmPosition}
          className="px-3 py-1 text-xs rounded flex items-center space-x-1 bg-green-600 text-white hover:bg-green-700"
        >
          <FaSignature size={12} />
          <span>
            Confirmar posición ({Math.round(currentPosition.x)}%, {Math.round(currentPosition.y)}%)
          </span>
        </button>
      </div>
    </div>
  );
};

export default PDFSignatureSelector;