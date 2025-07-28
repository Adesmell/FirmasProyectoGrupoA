import React from 'react';
import { Clock, CheckCircle2, FileText, Upload } from 'lucide-react';
import { DocumentStatus } from '../document/types';

const StatsCards = ({ documents }) => {
  const getStats = () => {
    const total = documents.length;
    const signed = documents.filter(doc => doc.status === DocumentStatus.SIGNED).length;
    const pending = documents.filter(doc => doc.status === DocumentStatus.READY || doc.status === DocumentStatus.PENDING).length;
    const uploading = documents.filter(doc => doc.status === DocumentStatus.UPLOADING).length;

    return { total, signed, pending, uploading };
  };

  const stats = getStats();

  const statCards = [
    {
      title: 'Total documentos',
      value: stats.total,
      icon: FileText,
      color: 'blue',
      bgGradient: 'from-blue-50 to-indigo-50',
      iconBg: 'from-blue-100 to-indigo-100',
      textColor: 'text-blue-700'
    },
    {
      title: 'Firmados',
      value: stats.signed,
      icon: CheckCircle2,
      color: 'green',
      bgGradient: 'from-green-50 to-emerald-50',
      iconBg: 'from-green-100 to-emerald-100',
      textColor: 'text-green-700'
    },
    {
      title: 'Pendientes',
      value: stats.pending,
      icon: Clock,
      color: 'yellow',
      bgGradient: 'from-yellow-50 to-amber-50',
      iconBg: 'from-yellow-100 to-amber-100',
      textColor: 'text-yellow-700'
    },
    {
      title: 'Subiendo',
      value: stats.uploading,
      icon: Upload,
      color: 'purple',
      bgGradient: 'from-purple-50 to-violet-50',
      iconBg: 'from-purple-100 to-violet-100',
      textColor: 'text-purple-700'
    }
  ];

  if (stats.total === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={index}
            className={`bg-gradient-to-br ${stat.bgGradient} p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300 hover:scale-105`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 bg-gradient-to-br ${stat.iconBg} rounded-xl`}>
                <IconComponent className={`w-6 h-6 ${stat.textColor}`} />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;