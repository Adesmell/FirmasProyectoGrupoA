import React, { useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi';

const PasswordModal = ({ isOpen, type, message, onClose, autoClose = false, autoCloseDelay = 3000 }) => {
  if (!isOpen) return null;

  // Auto-close para casos de éxito
  useEffect(() => {
    if (autoClose && type === 'success') {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, type, autoClose, autoCloseDelay, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <FiXCircle className="w-8 h-8 text-red-500" />;
      case 'warning':
        return <FiAlertCircle className="w-8 h-8 text-yellow-500" />;
      default:
        return <FiAlertCircle className="w-8 h-8 text-blue-500" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'success':
        return 'Contraseña Correcta';
      case 'error':
        return 'Contraseña Incorrecta';
      case 'warning':
        return 'Advertencia';
      default:
        return 'Información';
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 transform transition-all duration-300 scale-100 animate-slideIn">
        <div className="flex items-center justify-center mb-4">
          {getIcon()}
        </div>
        
        <div className="text-center">
          <h3 className={`text-lg font-semibold mb-2 ${getTextColor()}`}>
            {getTitle()}
          </h3>
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          
          {type !== 'success' && (
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                type === 'error'
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : type === 'warning'
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Entendido
            </button>
          )}
          
          {type === 'success' && (
            <div className="text-sm text-green-600">
              Redirigiendo automáticamente...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordModal; 