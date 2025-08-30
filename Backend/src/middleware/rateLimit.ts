import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

const createRateLimit = (options: RateLimitOptions) => {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
    standardHeaders = true,
    legacyHeaders = false
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    // Clean up expired entries
    if (store[key] && store[key].resetTime <= now) {
      delete store[key];
    }
    
    // Initialize or update the store entry
    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs
      };
    } else {
      store[key].count++;
    }
    
    const current = store[key];
    const remaining = Math.max(0, max - current.count);
    const resetTime = new Date(current.resetTime);
    
    // Set headers
    if (standardHeaders) {
      res.setHeader('RateLimit-Limit', max);
      res.setHeader('RateLimit-Remaining', remaining);
      res.setHeader('RateLimit-Reset', resetTime.toISOString());
    }
    
    if (legacyHeaders) {
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(current.resetTime / 1000));
    }
    
    // Check if limit exceeded
    if (current.count > max) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message,
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      });
      return;
    }
    
    next();
  };
};

// Default rate limit: 100 requests per 15 minutes
export const rateLimitMiddleware = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});

// Strict rate limit for auth endpoints: 5 requests per 15 minutes
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts, please try again later.'
});

// API rate limit: 1000 requests per hour
export const apiRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000
});