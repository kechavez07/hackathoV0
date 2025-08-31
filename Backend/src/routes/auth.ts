import { Router } from 'express';
import { 
  register, 
  login, 
  logout, 
  getProfile, 
  updateProfile, 
  getWalletInfo 
} from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// POST /api/v1/auth/register - Register with blockchain wallet
router.post('/register', register);

// POST /api/v1/auth/login - Login with email/password
router.post('/login', login);

// POST /api/v1/auth/logout - Logout (JWT invalidation)
router.post('/logout', authMiddleware, logout);

// GET /api/v1/auth/profile - Get user profile with reputation
router.get('/profile', authMiddleware, getProfile);

// PUT /api/v1/auth/profile - Update user profile
router.put('/profile', authMiddleware, updateProfile);

// GET /api/v1/auth/wallet - Get wallet information
router.get('/wallet', authMiddleware, getWalletInfo);

export default router;