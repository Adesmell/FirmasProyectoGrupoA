import type { Request, Response, NextFunction } from 'express';

// Extender el tipo Request para incluir el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

export const testAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    console.log('🔧 Test Auth middleware called for:', req.method, req.path);
    
    // Para pruebas, crear un usuario de prueba
    req.user = { 
      id: '507f1f77bcf86cd799439011' // ID de prueba
    };
    
    console.log('✅ Test user attached to request:', req.user);
    next();
    
  } catch (error) {
    console.error('❌ Test Auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 