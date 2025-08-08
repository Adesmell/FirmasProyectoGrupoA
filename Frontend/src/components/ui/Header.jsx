import { PenTool, Shield, Upload, Settings, User } from 'lucide-react';
import { LogoutButton } from './LogoutButton';
import NotificationBell from './NotificationBell';
import { useNavigate } from 'react-router-dom';

const Header = ({ 
  onAcceptSignature, 
  currentUser
}) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
              <PenTool className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">SignatureFlow</h1>
              <p className="text-sm text-gray-500">Sistema de Firmas Digitales</p>
            </div>
          </div>
          
          {/* Navegación de certificados */}
          <div className="hidden md:flex items-center space-x-2">
            <button
              onClick={() => navigate('/certificates/upload')}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200"
            >
              <Upload className="w-4 h-4" />
              <span>Subir Certificado</span>
            </button>
            
            <button
              onClick={() => navigate('/certificates/generate')}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200"
            >
              <Settings className="w-4 h-4" />
              <span>Generar Certificado</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <NotificationBell onAcceptSignature={onAcceptSignature} />
            
            {/* Botón de perfil */}
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200"
              title="Ver perfil"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">
                {currentUser?.nombre || currentUser?.firstName || 'Usuario'}
              </span>
            </button>
            
            <LogoutButton />
          </div>
        </div>
        
        {/* Navegación móvil para certificados */}
        <div className="md:hidden border-t border-gray-200 py-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/certificates/upload')}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800"
            >
              <Upload className="w-4 h-4" />
              <span>Subir</span>
            </button>
            
            <button
              onClick={() => navigate('/certificates/generate')}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800"
            >
              <Settings className="w-4 h-4" />
              <span>Generar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;