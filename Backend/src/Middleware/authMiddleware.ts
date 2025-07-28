import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "KBewxVc$WSWtCkZ9YvJ!6K";

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

export const auth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    console.log('🔐 Auth middleware called for:', req.method, req.path);
    console.log('🔐 Request URL:', req.url);
    console.log('🔐 Request headers:', req.headers);
    
    // Intentar obtener token del header Authorization primero
    let token = null;
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
      console.log('✅ Token from Authorization header, length:', token.length);
    } else {
      // Si no hay header, intentar obtener token del query parameter
      token = req.query.token as string;
      if (token) {
        console.log('✅ Token from query parameter, length:', token.length);
      } else {
        console.log('❌ No token found in Authorization header or query params');
      }
    }
    
    if (!token || token === 'null' || token === 'undefined') {
      console.log('❌ No valid token found in header or query params');
      res.status(401).json({ message: 'No token, authorization denied' });
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
      console.log('✅ JWT decoded successfully, user ID:', decoded.id);
      
      req.user = { id: decoded.id.toString() };
      console.log('✅ User attached to request:', req.user);
      
      next();
    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError);
      res.status(401).json({ message: 'Token is not valid' });
      return;
    }
    
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
