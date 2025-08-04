import React, { useState, useEffect } from 'react';
import { LoginForm } from './LoginForm';
import { loginUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PasswordModal from '../ui/PasswordModal';
export const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    type: 'success',
    message: ''
  });
  const navigate = useNavigate();
  const { login, authenticated } = useAuth();
  
  // Redirigir si ya está autenticado
  useEffect(() => {
    if (authenticated) {
      navigate('/principal');
    }
  }, [authenticated, navigate]);
  
  // Maneja el inicio de sesión 
  const handleLogin = async (credentials) => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await loginUser(credentials);
      console.log('acceso exitoso', result);
      
      // Mostrar modal de contraseña correcta
      setPasswordModal({
        isOpen: true,
        type: 'success',
        message: '¡Contraseña correcta! Iniciando sesión...'
      });
      
      // Esperar un momento antes de redirigir
      setTimeout(() => {
        // Actualizar el contexto de autenticación
        login(result);
        
        // Redirigir al dashboard
        navigate('/principal');
      }, 2000);
      
    } catch (error) {
      console.error('Error de login:', error);
      
      // Determinar el tipo de error y mensaje apropiado
      let modalType = 'error';
      let modalMessage = '';
      
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        modalMessage = 'Contraseña incorrecta. Por favor, verifica tus credenciales.';
      } else if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        modalMessage = 'Usuario no encontrado. Verifica tu email.';
      } else if (error.message?.includes('Network') || error.message?.includes('fetch')) {
        modalMessage = 'Error de conexión. Verifica tu conexión a internet.';
        modalType = 'warning';
      } else {
        modalMessage = error.message || 'Error al iniciar sesión. Por favor, intenta de nuevo.';
      }
      
      // Mostrar modal de error
      setPasswordModal({
        isOpen: true,
        type: modalType,
        message: modalMessage
      });
      
      setError(error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cerrar el modal
  const closePasswordModal = () => {
    setPasswordModal(prev => ({ ...prev, isOpen: false }));
  };
  
  return (
    <>
      <div className="max-w-md w-full mx-auto animate-fadeIn">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden transform transition-all hover:shadow-2xl">
          <div className="px-6 py-8 sm:px-10">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="mt-2 text-sm text-gray-600">
                Sign in to your account to continue
              </p>
            </div>
            
            <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
          </div>
        </div>
      </div>
      
      {/* Modal de estado de contraseña */}
      <PasswordModal
        isOpen={passwordModal.isOpen}
        type={passwordModal.type}
        message={passwordModal.message}
        onClose={closePasswordModal}
        autoClose={passwordModal.type === 'success'}
        autoCloseDelay={2000}
      />
    </>
  );
};