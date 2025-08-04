import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useNavigate, useSearchParams } from "react-router";

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});
  
  const navigate = useNavigate();

  // Verificar token al cargar la página
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setMessage({
          type: 'error',
          text: 'Token de restablecimiento no válido'
        });
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:3002/api/verify-reset-token/${token}`);
        const data = await response.json();

        if (response.ok) {
          setIsTokenValid(true);
        } else {
          setMessage({
            type: 'error',
            text: data.message || 'Token inválido o expirado'
          });
        }
      } catch (error) {
        setMessage({
          type: 'error',
          text: 'Error de conexión. Por favor intenta nuevamente.'
        });
      } finally {
        setIsValidating(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validar nueva contraseña
    if (!formData.newPassword) {
      newErrors.newPassword = 'La nueva contraseña es requerida';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'La contraseña debe tener al menos 8 caracteres';
    } else if (!/(?=.*[a-z])/.test(formData.newPassword)) {
      newErrors.newPassword = 'La contraseña debe contener al menos una letra minúscula';
    } else if (!/(?=.*[A-Z])/.test(formData.newPassword)) {
      newErrors.newPassword = 'La contraseña debe contener al menos una letra mayúscula';
    } else if (!/(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = 'La contraseña debe contener al menos un número';
    } else if (!/(?=.*[@$!%*?&])/.test(formData.newPassword)) {
      newErrors.newPassword = 'La contraseña debe contener al menos un carácter especial (@$!%*?&)';
    }
    
    // Validar confirmación de contraseña
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Por favor confirma tu contraseña';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('http://localhost:3002/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: formData.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: data.message
        });
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Error al restablecer la contraseña'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error de conexión. Por favor intenta nuevamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-3 text-gray-600">Verificando enlace...</p>
        </div>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Enlace inválido
            </h2>
            <p className="text-gray-600">
              El enlace de restablecimiento no es válido o ha expirado
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {message && (
              <div className={`p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            <div className="text-center mt-6">
              <Button 
                variant="link" 
                type="button" 
                onClick={() => navigate('/forgot-password')}
                className="flex items-center justify-center mx-auto"
              >
                <ArrowLeft size={16} className="mr-2" />
                Solicitar nuevo enlace
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Restablecer contraseña
          </h2>
          <p className="text-gray-600">
            Ingresa tu nueva contraseña
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Input
                label="Nueva contraseña"
                type={showPassword ? "text" : "password"}
                name="newPassword"
                required
                autoComplete="new-password"
                value={formData.newPassword}
                onChange={handleChange}
                error={errors.newPassword}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirmar nueva contraseña"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                required
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Políticas de contraseña */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-800 mb-2">Políticas de contraseña:</p>
              <ul className="text-xs space-y-1">
                <li className={`flex items-center ${formData.newPassword.length >= 8 ? 'text-green-700' : 'text-blue-700'}`}>
                  <span className={`mr-2 ${formData.newPassword.length >= 8 ? 'text-green-500' : 'text-gray-400'}`}>
                    {formData.newPassword.length >= 8 ? '✓' : '○'}
                  </span>
                  Mínimo 8 caracteres
                </li>
                <li className={`flex items-center ${/(?=.*[a-z])/.test(formData.newPassword) ? 'text-green-700' : 'text-blue-700'}`}>
                  <span className={`mr-2 ${/(?=.*[a-z])/.test(formData.newPassword) ? 'text-green-500' : 'text-gray-400'}`}>
                    {/(?=.*[a-z])/.test(formData.newPassword) ? '✓' : '○'}
                  </span>
                  Al menos una letra minúscula
                </li>
                <li className={`flex items-center ${/(?=.*[A-Z])/.test(formData.newPassword) ? 'text-green-700' : 'text-blue-700'}`}>
                  <span className={`mr-2 ${/(?=.*[A-Z])/.test(formData.newPassword) ? 'text-green-500' : 'text-gray-400'}`}>
                    {/(?=.*[A-Z])/.test(formData.newPassword) ? '✓' : '○'}
                  </span>
                  Al menos una letra mayúscula
                </li>
                <li className={`flex items-center ${/(?=.*\d)/.test(formData.newPassword) ? 'text-green-700' : 'text-blue-700'}`}>
                  <span className={`mr-2 ${/(?=.*\d)/.test(formData.newPassword) ? 'text-green-500' : 'text-gray-400'}`}>
                    {/(?=.*\d)/.test(formData.newPassword) ? '✓' : '○'}
                  </span>
                  Al menos un número
                </li>
                <li className={`flex items-center ${/(?=.*[@$!%*?&])/.test(formData.newPassword) ? 'text-green-700' : 'text-blue-700'}`}>
                  <span className={`mr-2 ${/(?=.*[@$!%*?&])/.test(formData.newPassword) ? 'text-green-500' : 'text-gray-400'}`}>
                    {/(?=.*[@$!%*?&])/.test(formData.newPassword) ? '✓' : '○'}
                  </span>
                  Al menos un carácter especial (@$!%*?&)
                </li>
              </ul>
            </div>

            {message && (
              <div className={`p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              className="mt-6"
            >
              Restablecer contraseña
            </Button>

            <div className="text-center">
              <Button 
                variant="link" 
                type="button" 
                onClick={() => navigate('/login')}
                className="flex items-center justify-center mx-auto"
              >
                <ArrowLeft size={16} className="mr-2" />
                Volver al inicio de sesión
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 