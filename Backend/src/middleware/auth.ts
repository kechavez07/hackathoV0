import { Request, Response, NextFunction } from 'express';

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

    // TODO: Implement JWT token verification
    // For now, we'll simulate a successful auth
    req.userId = 'mock-user-id';
    req.user = { id: 'mock-user-id', address: 'mock-address' };
    
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
      // TODO: Implement JWT token verification
      req.userId = 'mock-user-id';
      req.user = { id: 'mock-user-id', address: 'mock-address' };
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};