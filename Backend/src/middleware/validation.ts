import { Request, Response, NextFunction } from 'express';

interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'email' | 'required' | 'min' | 'max';
  value?: any;
  message?: string;
}

export const validationMiddleware = (rules: ValidationRule[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    
    rules.forEach(rule => {
      const fieldValue = req.body[rule.field];
      
      switch (rule.type) {
        case 'required':
          if (!fieldValue) {
            errors.push(rule.message || `${rule.field} is required`);
          }
          break;
          
        case 'string':
          if (fieldValue && typeof fieldValue !== 'string') {
            errors.push(rule.message || `${rule.field} must be a string`);
          }
          break;
          
        case 'number':
          if (fieldValue && typeof fieldValue !== 'number') {
            errors.push(rule.message || `${rule.field} must be a number`);
          }
          break;
          
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (fieldValue && !emailRegex.test(fieldValue)) {
            errors.push(rule.message || `${rule.field} must be a valid email`);
          }
          break;
          
        case 'min':
          if (fieldValue && fieldValue.length < rule.value) {
            errors.push(rule.message || `${rule.field} must be at least ${rule.value} characters`);
          }
          break;
          
        case 'max':
          if (fieldValue && fieldValue.length > rule.value) {
            errors.push(rule.message || `${rule.field} must be no more than ${rule.value} characters`);
          }
          break;
      }
    });
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        errors
      });
    }
    
    next();
  };
};

// Common validation schemas
export const loginValidation = validationMiddleware([
  { field: 'email', type: 'required' },
  { field: 'email', type: 'email' },
  { field: 'password', type: 'required' },
  { field: 'password', type: 'min', value: 6 }
]);

export const registerValidation = validationMiddleware([
  { field: 'email', type: 'required' },
  { field: 'email', type: 'email' },
  { field: 'password', type: 'required' },
  { field: 'password', type: 'min', value: 6 },
  { field: 'name', type: 'required' },
  { field: 'name', type: 'min', value: 2 }
]);

export const createTransactionValidation = validationMiddleware([
  { field: 'amount', type: 'required' },
  { field: 'amount', type: 'number' },
  { field: 'recipientAddress', type: 'required' },
  { field: 'description', type: 'string' }
]);