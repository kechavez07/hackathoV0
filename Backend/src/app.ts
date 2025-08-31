import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

// Routes imports
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import escrowRoutes from './routes/escrow';
import { reputationRoutes } from './routes/reputation';
import { disputeRoutes } from './routes/dispute';
import apiRoutes from './routes/api';

// Middleware imports
import { authMiddleware } from './middleware/auth';
import { validationMiddleware } from './middleware/validation';
import { rateLimitMiddleware } from './middleware/rateLimit';

// Load environment variables
dotenv.config();

// Import database connection
import { connectDatabase } from './config/database';

class App {
  public app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000', 10);
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // CORS configuration
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    this.app.use(rateLimitMiddleware);

    // Security headers
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Lisk TrustPay Backend'
      });
    });

    // API routes
    this.app.use('/api/v1/auth', authRoutes);
    this.app.use('/api/v1/transactions', authMiddleware, transactionRoutes);
    this.app.use('/api/v1/escrow', authMiddleware, escrowRoutes);
    this.app.use('/api/v1/reputation', reputationRoutes);
    this.app.use('/api/v1/dispute', disputeRoutes);
    this.app.use('/api/v1', apiRoutes);

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
      });
    });
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      const status = (error as any).status || 500;
      const message = error.message || 'Internal server error';
      
      console.error(`[${new Date().toISOString()}] Error:`, {
        message,
        stack: error.stack,
        url: req.url,
        method: req.method
      });

      res.status(status).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });
  }

  public async listen(): Promise<void> {
    try {
      // Connect to database first
      await connectDatabase();
      
      this.app.listen(this.port, () => {
        console.log(`🚀 Lisk TrustPay Backend running on port ${this.port}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`❤️  Health check: http://localhost:${this.port}/health`);
        console.log(`📊 Database: MongoDB Atlas connected`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Create and start the application
const application = new App();
application.listen().catch(error => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});

export default App;