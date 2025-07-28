import { PenTool, Shield, FileText } from 'lucide-react';
import { LogoutButton } from './LogoutButton';

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
              <PenTool className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">SignatureFlow</h1>
              <p className="text-sm text-gray-500">Sistema de Firmas Digitales</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <LogoutButton />
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Shield className="w-4 h-4 text-green-500" />
              <span className="font-medium">Conexión segura</span>
            </div>
            
            <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100">
              <FileText className="w-4 h-4" />
              <span>Demo</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;