import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';

interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
      return;
    }

    // Verify JWT token
    const decoded = (jwt as any).verify(token, config.jwtSecret || 'default-secret') as any;
    
    req.userId = decoded.userId;
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      liskAddress: decoded.liskAddress,
      publicKey: decoded.publicKey
    };
    
    console.log('🔐 User authenticated:', decoded.email);
    
    next();
  } catch (error) {
    res.status(401).json({
      error: 'Invalid token',
      message: (error as Error).message
    });
    return;
  }
};

export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      // Verify JWT token for optional auth
      const decoded = (jwt as any).verify(token, config.jwtSecret || 'default-secret') as any;
      
      req.userId = decoded.userId;
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        liskAddress: decoded.liskAddress,
        publicKey: decoded.publicKey
      };
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};