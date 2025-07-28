import React, { useState, useEffect } from 'react';
import { LoginForm } from './LoginForm';
import { Sparkles } from 'lucide-react';
import { loginUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
export const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
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
      
      // Actualizar el contexto de autenticación
      login(result);
      
      // Redirigir al dashboard
      navigate('/principal');
    } catch (error) {
      setError(error.message || 'Error al iniciar sesión');
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-md w-full mx-auto animate-fadeIn">
      <div className="bg-white rounded-xl shadow-xl overflow-hidden transform transition-all hover:shadow-2xl">
        <div className="px-6 py-8 sm:px-10">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mb-4">
              <Sparkles size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your account to continue
            </p>
          </div>
          
          <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};