import express from 'express';
import { disputeController } from '../controllers/disputeController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// POST /api/v1/dispute/create - Create a dispute (authenticated)
router.post('/create', authenticateToken, disputeController.createDispute);

// GET /api/v1/dispute/:disputeId - Get dispute details (authenticated)
router.get('/:disputeId', authenticateToken, disputeController.getDispute);

// GET /api/v1/dispute/my/all - Get my disputes (authenticated)
router.get('/my/all', authenticateToken, disputeController.getUserDisputes);

// GET /api/v1/dispute/escrow/:escrowId - Get disputes for specific escrow (authenticated)
router.get('/escrow/:escrowId', authenticateToken, disputeController.getEscrowDisputes);

// POST /api/v1/dispute/:disputeId/message - Add message to dispute (authenticated)
router.post('/:disputeId/message', authenticateToken, disputeController.addMessage);

// PUT /api/v1/dispute/:disputeId/resolve - Resolve dispute (authenticated)
router.put('/:disputeId/resolve', authenticateToken, disputeController.resolveDispute);

// POST /api/v1/dispute/:disputeId/escalate - Escalate dispute (authenticated)
router.post('/:disputeId/escalate', authenticateToken, disputeController.escalateDispute);

// GET /api/v1/dispute/escrow/:escrowId/can-create - Check if user can create dispute (authenticated)
router.get('/escrow/:escrowId/can-create', authenticateToken, disputeController.checkCanCreateDispute);

// GET /api/v1/dispute/types/all - Get dispute types and options (public)
router.get('/types/all', disputeController.getDisputeTypes);

export { router as disputeRoutes };
export default router;