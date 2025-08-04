import React, { useState } from 'react';
import { RegisterForm } from './RegisterForm';
import { registerUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';

export const RegisterPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  
  const handleRegister = async (userData) => {
    console.log('🚀 Iniciando registro con datos:', { ...userData, password: '***' });
    setIsLoading(true);
    setMessage(null);
    
    try {
      console.log('📞 Llamando a registerUser...');
      const result = await registerUser(userData);
      console.log('✅ Registro exitoso:', result);

      // Verificar si el usuario necesita verificar su email
      if (result.success && !result.user.emailVerificado) {
        console.log('📧 Usuario registrado pero requiere verificación de email');
        setMessage({
          type: 'verification-required',
          text: `¡Registro exitoso! Hemos enviado un email de verificación a ${userData.email}. Por favor, revisa tu bandeja de entrada y verifica tu cuenta antes de iniciar sesión.`
        });
        
        // No redirigir automáticamente, dejar que el usuario vea el mensaje
        return;
      }

      // Mostrar mensaje de éxito para usuarios verificados
      console.log('💬 Configurando mensaje de éxito...');
      setMessage({
        type: 'success',
        text: '¡Registro exitoso! Tu cuenta ha sido creada correctamente. Redirigiendo al login...'
      });

      console.log('⏰ Configurando redirección...');
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        console.log('🔄 Redirigiendo a /login...');
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error en registro:', error);
      
      // Determinar el tipo de error
      let errorMessage = 'Error al registrar el usuario';
      let errorType = 'error';
      
      if (error.includes('email') || error.includes('correo') || error.includes('ya existe')) {
        errorMessage = 'El correo electrónico ya está registrado. Por favor, usa otro correo o inicia sesión.';
        errorType = 'email-exists';
      } else if (error.includes('password') || error.includes('contraseña')) {
        errorMessage = 'La contraseña no cumple con los requisitos de seguridad.';
        errorType = 'password-error';
      }
      
      console.log('💬 Configurando mensaje de error:', { errorType, errorMessage });
      setMessage({
        type: errorType,
        text: errorMessage
      });
    } finally {
      console.log('🏁 Finalizando registro, isLoading = false');
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-md w-full mx-auto animate-fadeIn">
      <div className="bg-white rounded-xl shadow-xl overflow-hidden transform transition-all hover:shadow-2xl">
        <div className="px-6 py-8 sm:px-10">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900">Crear una cuenta</h2>
            <p className="mt-2 text-sm text-gray-600">
              Únete a nosotros y comienza tu viaje
            </p>
          </div>
          
          {/* Mensaje de estado */}
          {message && (
            <div className={`mb-4 p-4 rounded-lg border ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : message.type === 'verification-required'
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : message.type === 'email-exists'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-start">
                <div className="flex-1">
                  <span className="text-sm font-medium">{message.text}</span>
                  {message.type === 'verification-required' && (
                    <div className="mt-2 text-xs text-blue-700">
                      <p>• Revisa tu carpeta de spam si no encuentras el email</p>
                      <p>• El enlace de verificación expira en 24 horas</p>
                      <p>• Puedes iniciar sesión una vez verificado tu email</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <RegisterForm onSubmit={handleRegister} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};