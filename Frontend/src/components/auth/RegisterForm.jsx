import React, { useState } from 'react';
import { Mail, Lock, User, Github } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Divider } from '../ui/Divider';
import { useNavigate } from "react-router";
import { SocialButton } from '../ui/SocialButton';


export const RegisterForm = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });

    let navigate = useNavigate();
  
  const [errors, setErrors] = useState({});
  const [emailStatus, setEmailStatus] = useState('idle'); // 'idle', 'checking', 'available', 'taken'


  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }

    // Verificar email en tiempo real
    if (name === 'email' && value) {
      checkEmailAvailability(value);
    }
  };

  // Función para verificar disponibilidad del email
  const checkEmailAvailability = async (email) => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailStatus('idle');
      return;
    }

    setEmailStatus('checking');
    
    try {
      // Aquí podrías hacer una llamada a la API para verificar el email
      // Por ahora, simularemos la verificación
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simular verificación (en producción, esto sería una llamada real a la API)
      const isAvailable = Math.random() > 0.5; // Simulación
      
      setEmailStatus(isAvailable ? 'available' : 'taken');
    } catch (error) {
      setEmailStatus('idle');
    }
  };

    const handleRegister = async (formData) => {
    setIsLoading(true);
    try {
      const result = await registerUser(formData);
      console.log('Registro exitoso:', result);

      // Redirigir al login o dashboard
      navigate('/login');
    } catch (error) {
      alert(error.message); // Reemplaza esto con un toast si usas uno
    } finally {
      setIsLoading(false);
    }
  };

  
  const validateForm = () => {
    console.log('🔍 Iniciando validación del formulario...');
    const newErrors = {};
    
    // Full name validation
    if (!formData.nombre) {
      newErrors.nombre = 'El nombre es requerido';
    }

    // Full name validation
    if (!formData.apellido) {
      newErrors.apellido = 'El apellido es requerido';
    }
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Por favor ingresa un correo electrónico válido';
    } else if (emailStatus === 'taken') {
      newErrors.email = 'Este correo electrónico ya está registrado';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'La contraseña debe contener al menos una letra minúscula';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'La contraseña debe contener al menos una letra mayúscula';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'La contraseña debe contener al menos un número';
    } else if (!/(?=.*[@$!%*?&])/.test(formData.password)) {
      newErrors.password = 'La contraseña debe contener al menos un carácter especial (@$!%*?&)';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Por favor confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    // Terms acceptance validation
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Debes aceptar los términos y condiciones';
    }
    
    console.log('📋 Errores encontrados:', newErrors);
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('✅ Formulario válido:', isValid);
    return isValid;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('📝 Formulario enviado, validando...');
    
    if (validateForm()) {
      console.log('✅ Validación exitosa, enviando datos:', { ...formData, password: '***' });
      onSubmit(formData);
    } else {
      console.log('❌ Validación fallida, errores:', errors);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full">
      <Input
        label="Nombre"
        type="text"
        name="nombre"
        icon={<User size={18} />}
        required
        autoComplete="nombre"
        value={formData.nombre}
        onChange={handleChange}
        error={errors.nombre}
      />

      <Input
        label="Apellido"
        type="text"
        name="apellido"
        icon={<User size={18} />}
        required
        autoComplete="apellido"
        value={formData.apellido}
        onChange={handleChange}
        error={errors.apellido}
      />
      
      <div className="relative">
        <Input
          label="Correo Electrónico"
          type="email"
          name="email"
          icon={<Mail size={18} />}
          required
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />
        
        {/* Indicador de estado del email */}
        {formData.email && emailStatus !== 'idle' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {emailStatus === 'checking' && (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            )}
            {emailStatus === 'available' && (
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            {emailStatus === 'taken' && (
              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        )}
        
        {/* Mensaje de estado del email */}
        {formData.email && emailStatus === 'taken' && (
          <p className="mt-1 text-sm text-red-600">
            Este correo electrónico ya está registrado
          </p>
        )}
        {formData.email && emailStatus === 'available' && (
          <p className="mt-1 text-sm text-green-600">
            Este correo electrónico está disponible
          </p>
        )}
      </div>
      
      <Input
        label="Contraseña"
        type="password"
        name="password"
        icon={<Lock size={18} />}
        required
        autoComplete="new-password"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
      />
      


      {/* Políticas de contraseña */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm font-medium text-blue-800 mb-2">Políticas de contraseña:</p>
        <ul className="text-xs space-y-1">
          <li className={`flex items-center ${formData.password.length >= 8 ? 'text-green-700' : 'text-blue-700'}`}>
            <span className={`mr-2 ${formData.password.length >= 8 ? 'text-green-500' : 'text-gray-400'}`}>
              {formData.password.length >= 8 ? '✓' : '○'}
            </span>
            Mínimo 8 caracteres
          </li>
          <li className={`flex items-center ${/(?=.*[a-z])/.test(formData.password) ? 'text-green-700' : 'text-blue-700'}`}>
            <span className={`mr-2 ${/(?=.*[a-z])/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}`}>
              {/(?=.*[a-z])/.test(formData.password) ? '✓' : '○'}
            </span>
            Al menos una letra minúscula
          </li>
          <li className={`flex items-center ${/(?=.*[A-Z])/.test(formData.password) ? 'text-green-700' : 'text-blue-700'}`}>
            <span className={`mr-2 ${/(?=.*[A-Z])/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}`}>
              {/(?=.*[A-Z])/.test(formData.password) ? '✓' : '○'}
            </span>
            Al menos una letra mayúscula
          </li>
          <li className={`flex items-center ${/(?=.*\d)/.test(formData.password) ? 'text-green-700' : 'text-blue-700'}`}>
            <span className={`mr-2 ${/(?=.*\d)/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}`}>
              {/(?=.*\d)/.test(formData.password) ? '✓' : '○'}
            </span>
            Al menos un número
          </li>
          <li className={`flex items-center ${/(?=.*[@$!%*?&])/.test(formData.password) ? 'text-green-700' : 'text-blue-700'}`}>
            <span className={`mr-2 ${/(?=.*[@$!%*?&])/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}`}>
              {/(?=.*[@$!%*?&])/.test(formData.password) ? '✓' : '○'}
            </span>
            Al menos un carácter especial (@$!%*?&)
          </li>
        </ul>
      </div>
      
      <Input
        label="Confirmar Contraseña"
        type="password"
        name="confirmPassword"
        icon={<Lock size={18} />}
        required
        autoComplete="new-password"
        value={formData.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
      />
      
      {/* Términos y Condiciones */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex items-center h-5 mt-0.5">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-800 cursor-pointer">
              Acepto los{' '}
              <span className="text-blue-600 hover:text-blue-700 underline font-semibold">
                Términos y Condiciones
              </span>
              {' '}y la{' '}
              <span className="text-blue-600 hover:text-blue-700 underline font-semibold">
                Política de Privacidad
              </span>
            </label>
            <p className="text-xs text-gray-600 mt-1">
              Al crear una cuenta, aceptas nuestros términos de servicio y política de privacidad.
            </p>
            {errors.acceptTerms && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-red-700 font-medium">
                    Debes aceptar los términos y condiciones para continuar
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Button
        type="submit"
        fullWidth
        isLoading={isLoading}
        className="mt-6"
      >
        Crear Cuenta
      </Button>
      
      <p className="mt-6 text-center text-sm text-gray-600">
        ¿Ya tienes una cuenta?{' '}
        <Button variant="link" type="button" className="font-medium"onClick={()=> {navigate("/Login")}}>
          Iniciar Sesión
        </Button>
      </p>
    </form>
  );
};