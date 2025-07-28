import React from 'react';

export const Divider = ({ text, className = '' }) => {
  if (!text) {
    return <hr className={`border-gray-200 my-4 ${className}`} />;
  }
  
  return (
    <div className={`relative flex items-center my-6 ${className}`}>
      <div className="flex-grow border-t border-gray-200"></div>
      <span className="flex-shrink mx-4 text-sm text-gray-500">{text}</span>
      <div className="flex-grow border-t border-gray-200"></div>
    </div>
  );
};