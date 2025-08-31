import express from 'express';
import { reputationController } from '../controllers/reputationController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// POST /api/v1/reputation/rate - Create a rating (authenticated)
router.post('/rate', authenticateToken, reputationController.createRating);

// GET /api/v1/reputation/:userId - Get user reputation (public)
router.get('/:userId', reputationController.getUserReputation);

// GET /api/v1/reputation/:userId/history - Get rating history for user (public)
router.get('/:userId/history', reputationController.getRatingHistory);

// GET /api/v1/reputation/escrow/:escrowId/ratings - Get ratings for specific escrow (public)
router.get('/escrow/:escrowId/ratings', reputationController.getEscrowRatings);

// GET /api/v1/reputation/escrow/:escrowId/can-rate - Check if current user can rate this escrow (authenticated)
router.get('/escrow/:escrowId/can-rate', authenticateToken, reputationController.checkCanRate);

// GET /api/v1/reputation/my/ratings - Get my ratings (authenticated)
router.get('/my/ratings', authenticateToken, reputationController.getMyRatings);

export { router as reputationRoutes };
export default router;