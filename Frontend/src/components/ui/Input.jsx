import React, { useState, useId } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Input = ({
  label,
  error,
  size = 'md',
  icon,
  className = '',
  type = 'text',
  required,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const [inputType, setInputType] = useState(type);
  const [value, setValue] = useState(props.value || props.defaultValue || '');
  const id = useId();
  
  const sizeStyles = {
    sm: 'h-9 text-sm',
    md: 'h-10 text-base',
    lg: 'h-12 text-lg'
  };
  
  const handleFocus = (e) => {
    setFocused(true);
    props.onFocus?.(e);
  };
  
  const handleBlur = (e) => {
    setFocused(false);
    props.onBlur?.(e);
  };
  
  const handleChange = (e) => {
    setValue(e.target.value);
    props.onChange?.(e);
  };
  
  const togglePasswordVisibility = () => {
    setInputType(inputType === 'password' ? 'text' : 'password');
  };
  
  const hasValue = Boolean(value);
  const showLabel = focused || hasValue;
  
  return (
    <div className="mb-4">
      <div className="relative">
        <label
          htmlFor={id}
          className="block mb-1 text-sm font-medium text-gray-700"
        >
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          id={id}
          type={inputType}
          className={`block w-full rounded-md border ${
            error ? 'border-red-500' : 'border-gray-300'
          } px-3 ${sizeStyles[size]} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            icon ? 'pl-11' : ''
          } ${type === 'password' ? 'pr-10' : ''} ${className}`}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          value={value}
          {...props}
        />
        
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            {React.cloneElement(icon, { size: 20 })}
          </div>
        )}
        
        {type === 'password' && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            onClick={togglePasswordVisibility}
            tabIndex={-1}
          >
            {inputType === 'password' ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        )}
      </div>
      
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};