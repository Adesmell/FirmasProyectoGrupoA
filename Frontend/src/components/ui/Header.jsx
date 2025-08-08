import { PenTool } from 'lucide-react';
import { LogoutButton } from './LogoutButton';
import NotificationBell from './NotificationBell';

const Header = ({ onAcceptSignature }) => {
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
          
          <div className="flex items-center space-x-3">
            <NotificationBell onAcceptSignature={onAcceptSignature} />
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;