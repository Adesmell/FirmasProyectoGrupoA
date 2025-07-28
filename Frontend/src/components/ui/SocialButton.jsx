import React from 'react';

export const SocialButton = ({
  provider,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = "flex items-center justify-center w-full px-4 py-2 mt-2 text-sm font-medium transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const providerStyles = {
    google: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
    apple: "bg-black text-white hover:bg-gray-900 focus:ring-gray-500",
    github: "bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-500"
  };
  
  return (
    <button
      className={`${baseStyles} ${providerStyles[provider]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};