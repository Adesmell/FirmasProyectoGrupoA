import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LogoutButton = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <button
      onClick={handleLogout}
      className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
    >
      <LogOut size={18} />
      <span>Cerrar sesión</span>
    </button>
  );
};
