import React from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

const Notification = ({ notification, onClose }) => {
  if (!notification) return null;

  const getNotificationStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: CheckCircle2,
          iconColor: 'text-green-500'
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-yellow-50 to-amber-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: AlertTriangle,
          iconColor: 'text-yellow-500'
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-50 to-rose-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: AlertTriangle,
          iconColor: 'text-red-500'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: CheckCircle2,
          iconColor: 'text-blue-500'
        };
    }
  };

  const styles = getNotificationStyles(notification.type);
  const IconComponent = styles.icon;

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className={`p-4 rounded-xl shadow-lg border ${styles.bg} ${styles.border} ${styles.text} max-w-md`}>
        <div className="flex items-start space-x-3">
          <IconComponent className={`w-5 h-5 ${styles.iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <p className="font-semibold">{notification.message}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;