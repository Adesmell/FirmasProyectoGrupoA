import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Mail, AlertCircle } from 'lucide-react';

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de verificación no encontrado');
      return;
    }

    if (!hasVerified.current) {
      hasVerified.current = true;
      verifyEmail();
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await fetch(`http://localhost:3002/api/verify-email/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Email verificado exitosamente');
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Error al verificar el email');
      }
    } catch (error) {
      console.error('Error verificando email:', error);
      setStatus('error');
      setMessage('Error de conexión. Por favor intenta nuevamente.');
    }
  };

  const handleResendEmail = async () => {
    try {
      const email = localStorage.getItem('pendingVerificationEmail');
      if (!email) {
        setMessage('No se encontró email pendiente de verificación');
        return;
      }

      const response = await fetch('http://localhost:3002/api/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Email de verificación reenviado exitosamente');
      } else {
        setMessage(data.message || 'Error al reenviar el email');
      }
    } catch (error) {
      console.error('Error reenviando email:', error);
      setMessage('Error de conexión. Por favor intenta nuevamente.');
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Verificando tu email...</h2>
            <p className="text-gray-600">Por favor espera mientras verificamos tu cuenta.</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">¡Email verificado exitosamente!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Serás redirigido al login en unos segundos...</p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error en la verificación</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Mail className="inline-block w-4 h-4 mr-2" />
                Reenviar email de verificación
              </button>
              <br />
              <button
                onClick={() => navigate('/login')}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Ir al login
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verificación de Email</h1>
          <p className="text-gray-600">SignatureFlow</p>
        </div>

        {renderContent()}

        {status === 'error' && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">¿No recibiste el email?</p>
                <p className="text-xs mt-1">
                  Revisa tu carpeta de spam o solicita un nuevo email de verificación.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage; 