import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useNavigate } from "react-router";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar email
    if (!email) {
      setErrors({ email: 'El email es requerido' });
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Por favor ingresa un email válido' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('http://localhost:3002/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: data.message
        });
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Error al enviar el email'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            ¿Olvidaste tu contraseña?
          </h2>
          <p className="text-gray-600">
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              type="email"
              name="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />

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
              Enviar enlace de restablecimiento
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

        <div className="text-center text-sm text-gray-600">
          <p>
            ¿No tienes una cuenta?{' '}
            <Button 
              variant="link" 
              type="button" 
              onClick={() => navigate('/register')}
              className="font-medium"
            >
              Regístrate aquí
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}; 