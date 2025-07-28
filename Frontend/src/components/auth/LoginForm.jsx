import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useNavigate } from "react-router";


export const LoginForm = ({onSubmit, isLoading = false }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    rememberMe: false
  });


  let navigate = useNavigate();
  
  const [errors, setErrors] = useState({});
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCredentials(prev => ({
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
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!credentials.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!credentials.password) {
      newErrors.password = 'Password is required';
    } else if (credentials.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(credentials);
    }
  };



  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full">
      <Input
        label="Email"
        type="email"
        name="email"
        icon={<Mail size={18} />}
        required
        autoComplete="email"
        value={credentials.email}
        onChange={handleChange}
        error={errors.email}
      />
      
      <Input
        label="Password"
        type="password"
        name="password"
        icon={<Lock size={18} />}
        required
        autoComplete="current-password"
        value={credentials.password}
        onChange={handleChange}
        error={errors.password}
      />
      
      <div className="flex items-center justify-between">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="rememberMe"
            checked={credentials.rememberMe}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-600">Remember me</span>
        </label>
        
        <Button variant="link" type="button">
          Forgot password?
        </Button>
      </div>
      
      <Button
        type="submit"
        fullWidth
        isLoading={isLoading}
        className="mt-6"
        
      >
        Sign in
      </Button>
      
      
      <p className="mt-6 text-center text-sm text-gray-600">
        Dont have an account?{' '}
        
        <Button variant="link" type="button" className="font-medium" onClick={()=> {navigate("/Register")}}>
          Sign up
        </Button>
      </p>
    </form>
  );
};